"use client";

import { useEffect, useRef } from "react";
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
import { groupMessagesByDay } from "./guest-chats-utils";
import { GuestChatMessageBubble } from "./GuestChatMessageBubble";
import { GuestChatScrollArea } from "./GuestChatScrollArea";
import {
  GuestChatHeaderSkeleton,
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
  const { conversation, loading, refreshing, error, refetch } =
    useCustomerConversationQuery(restaurantId, row.customerId);
  const sendMessage = useSendCustomerMessage(restaurantId, row);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messages = conversation?.messages ?? [];
  const messageGroups = groupMessagesByDay(messages);
  const lastMessageId = messages.at(-1)?.id ?? null;

  useEffect(() => {
    if (loading || messages.length === 0) {
      return;
    }

    const scrollToLatestMessage = () => {
      const container = scrollAreaRef.current;
      if (!container) {
        return;
      }

      container.scrollTop = container.scrollHeight;
    };

    scrollToLatestMessage();

    const frame = requestAnimationFrame(scrollToLatestMessage);
    return () => cancelAnimationFrame(frame);
  }, [loading, row.customerId, lastMessageId, messages.length]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      {loading ? (
        <>
          <div className="shrink-0">
            <GuestChatHeaderSkeleton />
          </div>
          <GuestChatScrollArea className="flex-1">
            <GuestChatMessagesSkeleton />
          </GuestChatScrollArea>
        </>
      ) : (
        <>
          <div className="shrink-0">
            <GuestChatConversationHeader
              row={row}
              onRefresh={() => void refetch()}
              refreshing={refreshing}
              onBack={onBack}
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col bg-white">
            <GuestChatScrollArea ref={scrollAreaRef} className="flex-1 bg-[#F8FAFC]">
              {error ? (
                <div className="flex min-h-full items-center justify-center">
                  <GuestChatErrorEmptyState title="Could not load conversation" description={error} />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex min-h-full items-center justify-center">
                  <GuestChatNoMessagesEmptyState />
                </div>
              ) : (
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6">
                  {messageGroups.map((group) => (
                    <div key={group.day} className="space-y-3">
                      <GuestChatDayDivider label={group.day} />
                      {group.messages.map((message, index) => (
                        <GuestChatMessageBubble key={message.id} message={message} index={index} />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </GuestChatScrollArea>

            <GuestChatComposer
              disabled={Boolean(error)}
              sending={sendMessage.isPending}
              onSend={async (body) => {
                await sendMessage.mutateAsync(body);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
