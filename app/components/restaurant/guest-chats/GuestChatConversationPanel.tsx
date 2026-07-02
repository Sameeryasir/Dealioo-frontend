"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { ChatCustomer } from "@/app/services/chat/get-restaurant-chat-customers";
import { useCustomerConversationQuery } from "@/app/hooks/use-customer-conversation-query";
import { useSendCustomerMessage } from "@/app/hooks/use-send-customer-message";
import { GuestChatComposer } from "./GuestChatComposer";
import { GuestChatConversationHeader } from "./GuestChatConversationHeader";
import { GuestChatDayDivider } from "./GuestChatDayDivider";
import {
  GuestChatErrorEmptyState,
  GuestChatNoMessagesEmptyState,
} from "./GuestChatEmptyStates";
import { getMessageStackPositions, groupMessagesByDay } from "./guest-chats-utils";
import { GuestChatMessageBubble } from "./GuestChatMessageBubble";
import { GuestChatScrollArea } from "./GuestChatScrollArea";
import { peekStoredChatMessagesLatestPage } from "@/app/services/chat/chat-indexed-db";
import {
  GuestChatMessagesSkeleton,
} from "./GuestChatSkeletons";

export function GuestChatConversationPanel({
  restaurantId,
  row,
  onBack,
}: {
  restaurantId: number;
  row: ChatCustomer;
  onBack?: () => void;
}) {
  const {
    conversation,
    loading,
    awaitingCache,
    syncing,
    loadingOlder,
    hasOlderMessages,
    loadOlderMessages,
    refreshing,
    error,
    refetch,
  } = useCustomerConversationQuery(restaurantId, row.customerId);
  const sendMessage = useSendCustomerMessage(restaurantId, row);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const loadingOlderRef = useRef(false);
  const openedCustomerRef = useRef<number | null>(null);

  const memoryPage = peekStoredChatMessagesLatestPage(restaurantId, row.customerId);
  const messages =
    conversation?.customerId === row.customerId
      ? conversation.messages
      : (memoryPage?.messages ?? []);
  const messageGroups = groupMessagesByDay(messages);
  const lastMessageId = messages.at(-1)?.id ?? null;
  const isSwitchingGuest =
    conversation != null && conversation.customerId !== row.customerId;
  const showMessageSkeleton =
    messages.length === 0 &&
    memoryPage == null &&
    (loading || awaitingCache || isSwitchingGuest);

  const scrollToLatestMessage = useCallback(() => {
    const container = scrollAreaRef.current;
    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, []);

  useEffect(() => {
    stickToBottomRef.current = true;
  }, [row.customerId]);

  useLayoutEffect(() => {
    if (showMessageSkeleton || messages.length === 0) {
      return;
    }

    const isOpeningGuest = openedCustomerRef.current !== row.customerId;
    if (isOpeningGuest) {
      openedCustomerRef.current = row.customerId;
      stickToBottomRef.current = true;
    }

    if (!stickToBottomRef.current && !isOpeningGuest) {
      return;
    }

    scrollToLatestMessage();

    const frame = requestAnimationFrame(() => {
      scrollToLatestMessage();
    });

    return () => cancelAnimationFrame(frame);
  }, [
    lastMessageId,
    messages.length,
    row.customerId,
    scrollToLatestMessage,
    showMessageSkeleton,
    syncing,
  ]);

  const handleScroll = useCallback(() => {
    const container = scrollAreaRef.current;
    if (!container || loadingOlderRef.current) {
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    if (distanceFromBottom < 80) {
      stickToBottomRef.current = true;
    } else if (container.scrollTop > 120) {
      stickToBottomRef.current = false;
    }

    if (container.scrollTop > 80 || !hasOlderMessages || loadingOlder) {
      return;
    }

    const previousScrollHeight = container.scrollHeight;
    loadingOlderRef.current = true;

    void loadOlderMessages().then((loaded) => {
      loadingOlderRef.current = false;

      if (!loaded) {
        return;
      }

      requestAnimationFrame(() => {
        const nextContainer = scrollAreaRef.current;
        if (!nextContainer) {
          return;
        }

        nextContainer.scrollTop =
          nextContainer.scrollHeight - previousScrollHeight + nextContainer.scrollTop;
      });
    });
  }, [hasOlderMessages, loadOlderMessages, loadingOlder]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="shrink-0">
        <GuestChatConversationHeader
          row={row}
          onRefresh={() => void refetch()}
          refreshing={refreshing || syncing}
          onBack={onBack}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col bg-white">
        <GuestChatScrollArea
          ref={scrollAreaRef}
          className="flex-1 bg-[#F8FAFC]"
          onScroll={handleScroll}
        >
          {showMessageSkeleton ? (
            <GuestChatMessagesSkeleton />
          ) : error ? (
            <div className="flex min-h-full items-center justify-center">
              <GuestChatErrorEmptyState title="Could not load conversation" description={error} />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex min-h-full items-center justify-center">
              <GuestChatNoMessagesEmptyState />
            </div>
          ) : (
            <div className="flex w-full flex-col gap-4 px-3 py-6 sm:px-5">
              {loadingOlder ? (
                <p className="py-2 text-center text-xs font-medium text-zinc-400">
                  Loading older messages...
                </p>
              ) : null}
              {messageGroups.map((group) => {
                const groupStackPositions = getMessageStackPositions(group.messages);

                return (
                <div key={group.day} className="mb-4 last:mb-0">
                  <GuestChatDayDivider label={group.day} />
                  <div className="mt-2">
                  {group.messages.map((message, index) => (
                    <GuestChatMessageBubble
                      key={message.id}
                      message={message}
                      index={index}
                      stackPosition={groupStackPositions[index] ?? "single"}
                    />
                  ))}
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </GuestChatScrollArea>

        <GuestChatComposer
          disabled={Boolean(error) || showMessageSkeleton}
          sending={sendMessage.isPending}
          onSend={async (body) => {
            await sendMessage.mutateAsync(body);
          }}
        />
      </div>
    </div>
  );
}
