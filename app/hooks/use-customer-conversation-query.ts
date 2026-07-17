"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useConversationMessagesPusher } from "@/app/hooks/use-business-chat-pusher";
import type { ChatMessagePusherPayload } from "@/app/lib/pusher-chat";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  getLatestMessageWindow,
} from "@/app/components/business/guest-chats/guest-chats-utils";
import {
  getLatestMessageId,
  insertMessageIfAbsent,
  mergeConversationAfterSync,
  messageExistsById,
} from "@/app/services/chat/chat-query-cache";
import { CHAT_USE_INDEXED_DB } from "@/app/services/chat/chat-cache-mode";
import {
  getStoredChatConversation,
  getStoredChatMessagesLatestPage,
  getStoredChatMessagesOlderPage,
  patchChatConversationFromPusher,
  peekStoredChatMessagesLatestPage,
  saveChatConversation,
  subscribeChatConversation,
} from "@/app/services/chat/chat-indexed-db";
import type {
  ConversationMessage,
  CustomerConversationDetail,
} from "@/app/services/chat/get-business-conversation";
import {
  getCustomerConversation,
  syncCustomerConversationMessages,
} from "@/app/services/chat/get-business-conversation";
import type { ChatCustomer } from "@/app/services/chat/get-business-chat-customers";

function isConversationBehindSidebar(
  messages: ConversationMessage[],
  sidebarHint: Pick<ChatCustomer, "lastMessageAt" | "messageCount"> | null | undefined,
  totalCachedMessages?: number,
): boolean {
  if (!sidebarHint?.lastMessageAt) {
    return false;
  }

  const latest = messages.at(-1);
  const cachedCount = totalCachedMessages ?? messages.length;
  if (!latest) {
    return sidebarHint.messageCount > 0;
  }

  const sidebarTime = new Date(sidebarHint.lastMessageAt).getTime();
  const latestTime = new Date(latest.sentAt).getTime();

  if (Number.isNaN(sidebarTime) || Number.isNaN(latestTime)) {
    return sidebarHint.messageCount > cachedCount;
  }

  return (
    sidebarTime > latestTime + 500 || sidebarHint.messageCount > cachedCount
  );
}

export function useCustomerConversationQuery(
  businessId: number,
  customerId: number,
  conversationId: number,
  sidebarHint?: Pick<ChatCustomer, "lastMessageAt" | "messageCount"> | null,
) {
  const initialMemoryPage =
    CHAT_USE_INDEXED_DB && businessId > 0 && customerId > 0
      ? peekStoredChatMessagesLatestPage(businessId, customerId)
      : null;

  const [conversation, setConversation] = useState<CustomerConversationDetail | null>(
    () =>
      initialMemoryPage
        ? {
            customerId: initialMemoryPage.customerId,
            customerName: initialMemoryPage.customerName,
            customerEmail: initialMemoryPage.customerEmail,
            messages: initialMemoryPage.messages,
          }
        : null,
  );
  const [loading, setLoading] = useState(() => !initialMemoryPage);
  const [awaitingCache, setAwaitingCache] = useState(() => !initialMemoryPage);
  const [syncing, setSyncing] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(
    () => initialMemoryPage?.hasOlder ?? false,
  );
  const [error, setError] = useState<string | null>(null);
  const messageStartIndexRef = useRef(initialMemoryPage?.startIndex ?? 0);
  const fullMessagesRef = useRef<ConversationMessage[]>([]);
  const messagesLoadedRef = useRef(false);
  const sidebarHintRef = useRef(sidebarHint);
  sidebarHintRef.current = sidebarHint;
  const sidebarSyncTargetRef = useRef<string | null>(null);

  const mergeVisibleMessages = useCallback(
    (
      storedMessages: ConversationMessage[],
      previousMessages: ConversationMessage[] | undefined,
      startIndex: number,
    ) => {
      const visible = storedMessages.slice(startIndex);
      if (!previousMessages?.length) {
        return visible;
      }

      let merged = visible;
      for (const message of previousMessages) {
        merged = insertMessageIfAbsent(merged, message);
      }

      return merged.sort(
        (left, right) =>
          new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime(),
      );
    },
    [],
  );

  const applyMessagePage = useCallback((page: {
    customerId: number;
    customerName: string | null;
    customerEmail: string | null;
    messages: CustomerConversationDetail["messages"];
    startIndex: number;
    hasOlder: boolean;
  }) => {
    messageStartIndexRef.current = page.startIndex;
    setHasOlderMessages(page.hasOlder);
    setConversation({
      customerId: page.customerId,
      customerName: page.customerName,
      customerEmail: page.customerEmail,
      messages: page.messages,
    });
  }, []);

  const applyLatestWindow = useCallback(
    (detail: CustomerConversationDetail) => {
      fullMessagesRef.current = detail.messages;
      const latestPage = getLatestMessageWindow(detail.messages);
      applyMessagePage({
        customerId: detail.customerId,
        customerName: detail.customerName,
        customerEmail: detail.customerEmail,
        messages: latestPage.window,
        startIndex: latestPage.startIndex,
        hasOlder: latestPage.hasOlder,
      });
    },
    [applyMessagePage],
  );

  const fetchAndStoreConversation = useCallback(async () => {
    const fresh = await getCustomerConversation(
      businessId,
      conversationId,
      customerId,
    );
    applyLatestWindow(fresh);
    setError(null);
    messagesLoadedRef.current = true;

    if (CHAT_USE_INDEXED_DB) {
      const previous = await getStoredChatConversation(businessId, customerId);
      await saveChatConversation(businessId, customerId, {
        ...fresh,
        customerName:
          fresh.customerName ?? previous?.customerName ?? null,
        customerEmail:
          fresh.customerEmail ?? previous?.customerEmail ?? null,
      });
    }

    return fresh;
  }, [applyLatestWindow, conversationId, customerId, businessId]);

  const syncConversationFromApi = useCallback(
    async (cachedLastMessageId: number | null) => {
      if (cachedLastMessageId) {
        const delta = await syncCustomerConversationMessages(
          businessId,
          customerId,
          cachedLastMessageId,
        );

        if (delta.messages.length === 0) {
          messagesLoadedRef.current = true;
          return;
        }

        const cached = CHAT_USE_INDEXED_DB
          ? await getStoredChatConversation(businessId, customerId)
          : fullMessagesRef.current.length > 0
            ? {
                customerId,
                customerName: null,
                customerEmail: null,
                messages: fullMessagesRef.current,
              }
            : null;
        const merged = mergeConversationAfterSync(cached, {
          conversationId: delta.conversationId,
          customerId: delta.customerId,
          messages: delta.messages,
        });
        applyLatestWindow(merged);
        messagesLoadedRef.current = true;
        if (CHAT_USE_INDEXED_DB) {
          await saveChatConversation(businessId, customerId, merged);
        }
        return;
      }

      await fetchAndStoreConversation();
    },
    [applyLatestWindow, customerId, businessId, fetchAndStoreConversation],
  );

  const fetchAndStoreRef = useRef(fetchAndStoreConversation);
  fetchAndStoreRef.current = fetchAndStoreConversation;
  const syncConversationRef = useRef(syncConversationFromApi);
  syncConversationRef.current = syncConversationFromApi;

  useLayoutEffect(() => {
    if (businessId < 1 || customerId < 1) {
      return;
    }

    if (!CHAT_USE_INDEXED_DB) {
      setLoading(true);
      setAwaitingCache(false);
      return;
    }

    const memoryPage = peekStoredChatMessagesLatestPage(businessId, customerId);
    if (memoryPage) {
      applyMessagePage(memoryPage);
      setAwaitingCache(false);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setAwaitingCache(true);
  }, [applyMessagePage, businessId, customerId, conversationId]);

  useEffect(() => {
    if (businessId < 1 || customerId < 1 || conversationId < 1) {
      setConversation(null);
      setHasOlderMessages(false);
      messageStartIndexRef.current = 0;
      fullMessagesRef.current = [];
      messagesLoadedRef.current = false;
      setLoading(false);
      setAwaitingCache(false);
      return;
    }

    let cancelled = false;

    async function loadConversationFast() {
      messagesLoadedRef.current = false;
      setError(null);

      if (!CHAT_USE_INDEXED_DB) {
        setLoading(true);
        setSyncing(true);
        try {
          await fetchAndStoreRef.current();
        } catch (syncError) {
          if (!cancelled) {
            setConversation(null);
            setError(
              getApiErrorMessage(syncError, "Could not load this conversation."),
            );
          }
        } finally {
          if (!cancelled) {
            setSyncing(false);
            setLoading(false);
          }
        }
        return;
      }

      const memoryPage = peekStoredChatMessagesLatestPage(businessId, customerId);
      const page =
        memoryPage ??
        (await getStoredChatMessagesLatestPage(businessId, customerId));

      if (cancelled) {
        return;
      }

      if (page) {
        applyMessagePage(page);
        setAwaitingCache(false);
        setLoading(false);

        setSyncing(true);
        try {
          const lastMessageId = getLatestMessageId(page.messages);
          if (lastMessageId) {
            await syncConversationRef.current(lastMessageId);
          } else {
            await fetchAndStoreRef.current();
          }
        } catch {
        } finally {
          if (!cancelled) {
            messagesLoadedRef.current = true;
            setSyncing(false);
          }
        }
        return;
      }

      setAwaitingCache(false);
      setLoading(true);
      setSyncing(true);
      try {
        await fetchAndStoreRef.current();
      } catch (syncError) {
        if (!cancelled) {
          setConversation(null);
          setError(
            getApiErrorMessage(syncError, "Could not load this conversation."),
          );
        }
      } finally {
        if (!cancelled) {
          setSyncing(false);
          setLoading(false);
        }
      }
    }

    void loadConversationFast();

    return () => {
      cancelled = true;
    };
  }, [applyMessagePage, customerId, conversationId, businessId]);

  useEffect(() => {
    if (!CHAT_USE_INDEXED_DB) {
      return;
    }

    return subscribeChatConversation((storedRestaurantId, storedCustomerId, data) => {
      if (
        storedRestaurantId !== businessId ||
        storedCustomerId !== customerId
      ) {
        return;
      }

      const startIndex = messageStartIndexRef.current;
      setConversation((prev) => {
        const visible = mergeVisibleMessages(
          data.messages,
          prev?.customerId === customerId ? prev.messages : undefined,
          startIndex,
        );

        return {
          customerId: data.customerId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          messages: visible,
        };
      });
      setHasOlderMessages(startIndex > 0);
    });
  }, [customerId, businessId, mergeVisibleMessages]);

  useEffect(() => {
    if (!CHAT_USE_INDEXED_DB) {
      return;
    }

    const sidebarLastMessageAt = sidebarHint?.lastMessageAt;
    const sidebarMessageCount = sidebarHint?.messageCount ?? 0;

    if (businessId < 1 || customerId < 1 || !sidebarLastMessageAt) {
      return;
    }

    const memoryPage = peekStoredChatMessagesLatestPage(businessId, customerId);
    const cachedMessages = memoryPage?.messages ?? [];

    if (
      !isConversationBehindSidebar(
        cachedMessages,
        {
          lastMessageAt: sidebarLastMessageAt,
          messageCount: sidebarMessageCount,
        },
        memoryPage?.totalMessages,
      )
    ) {
      return;
    }

    if (sidebarSyncTargetRef.current === sidebarLastMessageAt) {
      return;
    }

    sidebarSyncTargetRef.current = sidebarLastMessageAt;
    let cancelled = false;

    void (async () => {
      setSyncing(true);

      try {
        const cached = await getStoredChatConversation(businessId, customerId);
        const lastMessageId =
          cached != null ? getLatestMessageId(cached.messages) : null;

        if (lastMessageId) {
          await syncConversationRef.current(lastMessageId);
        } else {
          await fetchAndStoreRef.current();
        }

        if (!cancelled) {
          setError(null);
        }
      } catch {
        if (!cancelled) {
          sidebarSyncTargetRef.current = null;
        }
      } finally {
        if (!cancelled) {
          setSyncing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    businessId,
    customerId,
    sidebarHint?.lastMessageAt,
    sidebarHint?.messageCount,
  ]);

  const loadOlderMessages = useCallback(async () => {
    if (
      businessId < 1 ||
      customerId < 1 ||
      loadingOlder ||
      !hasOlderMessages
    ) {
      return false;
    }

    setLoadingOlder(true);

    try {
      if (!CHAT_USE_INDEXED_DB) {
        const startIndex = messageStartIndexRef.current;
        if (startIndex <= 0) {
          setHasOlderMessages(false);
          return false;
        }

        const nextStart = Math.max(0, startIndex - 10);
        const all = fullMessagesRef.current;
        applyMessagePage({
          customerId,
          customerName: conversation?.customerName ?? null,
          customerEmail: conversation?.customerEmail ?? null,
          messages: all.slice(nextStart),
          startIndex: nextStart,
          hasOlder: nextStart > 0,
        });
        return true;
      }

      const page = await getStoredChatMessagesOlderPage(
        businessId,
        customerId,
        messageStartIndexRef.current,
      );

      if (!page) {
        setHasOlderMessages(false);
        return false;
      }

      applyMessagePage(page);
      return true;
    } finally {
      setLoadingOlder(false);
    }
  }, [
    applyMessagePage,
    conversation?.customerEmail,
    conversation?.customerName,
    customerId,
    hasOlderMessages,
    loadingOlder,
    businessId,
  ]);

  const refetch = useCallback(async () => {
    if (businessId < 1 || customerId < 1) {
      return;
    }

    setRefreshing(true);

    try {
      await fetchAndStoreConversation();
    } catch (refetchError) {
      setError(
        getApiErrorMessage(refetchError, "Could not load this conversation."),
      );
    } finally {
      setRefreshing(false);
    }
  }, [customerId, fetchAndStoreConversation, businessId]);

  const applyPusherMessage = useCallback(
    (payload: ChatMessagePusherPayload) => {
      if (
        payload.businessId !== businessId ||
        payload.conversationId !== conversationId ||
        payload.customerId !== customerId
      ) {
        return;
      }

      try {
        setConversation((prev) => {
          if (!prev) {
            return {
              customerId,
              customerName: payload.customerName,
              customerEmail: payload.customerEmail,
              messages: [payload.message],
            };
          }

          if (messageExistsById(prev.messages, payload.message.id)) {
            return prev;
          }

          return {
            customerId: prev.customerId,
            customerName: payload.customerName ?? prev.customerName,
            customerEmail: payload.customerEmail ?? prev.customerEmail,
            messages: insertMessageIfAbsent(prev.messages, payload.message),
          };
        });

        fullMessagesRef.current = insertMessageIfAbsent(
          fullMessagesRef.current,
          payload.message,
        );
      } catch (error) {
        console.warn("[Chat Pusher] Failed to apply open-thread message", {
          businessId,
          conversationId,
          customerId,
          error,
        });
        return;
      }

      if (CHAT_USE_INDEXED_DB && messagesLoadedRef.current) {
        void patchChatConversationFromPusher(
          businessId,
          customerId,
          payload,
        ).catch((error) => {
          console.warn("[Chat Pusher] Failed to patch message cache", {
            businessId,
            conversationId,
            customerId,
            error,
          });
        });
      }
    },
    [customerId, conversationId, businessId],
  );

  useConversationMessagesPusher(
    businessId,
    conversationId,
    applyPusherMessage,
    businessId > 0 && customerId > 0 && conversationId > 0,
  );

  return {
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
  };
}
