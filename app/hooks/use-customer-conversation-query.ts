"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  useBusinessConversationsPusher,
  useConversationMessagesPusher,
} from "@/app/hooks/use-business-chat-pusher";
import type { ChatMessagePusherPayload } from "@/app/lib/pusher-chat";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  getLatestMessageWindow,
} from "@/app/components/business/guest-chats/guest-chats-utils";
import {
  getMaxMessageId,
  insertMessageIfAbsent,
  mergeConversationAfterSync,
  messageExistsById,
  sortConversationMessages,
} from "@/app/services/chat/chat-query-cache";
import { CHAT_MESSAGE_SYNC_PAGE_SIZE } from "@/app/services/chat/chat-sync.constants";
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
  CustomerConversationMessages,
} from "@/app/services/chat/get-business-conversation";
import {
  getCustomerConversation,
  syncCustomerConversationMessages,
} from "@/app/services/chat/get-business-conversation";
import type { ChatCustomer } from "@/app/services/chat/get-business-chat-customers";

function yieldToNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function syncBatchHasMore(delta: CustomerConversationMessages): boolean {
  if (delta.hasMore === true) {
    return true;
  }
  if (delta.hasMore === false) {
    return false;
  }
  return delta.messages.length >= CHAT_MESSAGE_SYNC_PAGE_SIZE;
}

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
  const guestNameRef = useRef<string | null>(initialMemoryPage?.customerName ?? null);
  const guestEmailRef = useRef<string | null>(
    initialMemoryPage?.customerEmail ?? null,
  );
  const messagesLoadedRef = useRef(false);
  const sidebarHintRef = useRef(sidebarHint);
  sidebarHintRef.current = sidebarHint;
  const sidebarSyncTargetRef = useRef<string | null>(null);
  const syncInFlightRef = useRef<Promise<void> | null>(null);

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
    if (page.customerName != null) {
      guestNameRef.current = page.customerName;
    }
    if (page.customerEmail != null) {
      guestEmailRef.current = page.customerEmail;
    }
    setConversation({
      customerId: page.customerId,
      customerName: page.customerName ?? guestNameRef.current,
      customerEmail: page.customerEmail ?? guestEmailRef.current,
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

  // Keep live Pusher rows when sync pages overwrite fullMessagesRef mid-flight.
  const reconcileWithLiveMessages = useCallback(
    (detail: CustomerConversationDetail): CustomerConversationDetail => {
      const live = fullMessagesRef.current;
      if (live.length === 0) {
        return detail;
      }

      let messages = detail.messages;
      for (const message of live) {
        messages = insertMessageIfAbsent(messages, message);
      }

      return {
        ...detail,
        messages: sortConversationMessages(messages),
      };
    },
    [],
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
      if (syncInFlightRef.current) {
        return syncInFlightRef.current;
      }

      const run = (async () => {
        let cursor = cachedLastMessageId ?? 0;
        let merged: CustomerConversationDetail | null = null;

        if (cachedLastMessageId && CHAT_USE_INDEXED_DB) {
          merged = await getStoredChatConversation(businessId, customerId);
        } else if (cachedLastMessageId && fullMessagesRef.current.length > 0) {
          merged = {
            customerId,
            customerName: null,
            customerEmail: null,
            messages: fullMessagesRef.current,
          };
        }

        while (true) {
          const delta = await syncCustomerConversationMessages(
            businessId,
            customerId,
            cursor,
          );

          if (delta.messages.length === 0) {
            break;
          }

          const pageMessages = sortConversationMessages(delta.messages);

          for (const message of pageMessages) {
            if (merged && messageExistsById(merged.messages, message.id)) {
              continue;
            }

            merged = mergeConversationAfterSync(merged, {
              conversationId: delta.conversationId,
              customerId: delta.customerId,
              messages: [message],
            });
            merged = reconcileWithLiveMessages(merged);
            applyLatestWindow(merged);
            await yieldToNextFrame();
          }

          if (!syncBatchHasMore(delta)) {
            break;
          }

          const batchLastId = getMaxMessageId(pageMessages);
          if (batchLastId == null || batchLastId <= cursor) {
            break;
          }
          cursor = batchLastId;
        }

        messagesLoadedRef.current = true;

        if (merged) {
          merged = reconcileWithLiveMessages(merged);
          applyLatestWindow(merged);
          if (CHAT_USE_INDEXED_DB) {
            await saveChatConversation(businessId, customerId, merged);
          }
          return;
        }

        if (!cachedLastMessageId) {
          await fetchAndStoreConversation();
        }
      })();

      syncInFlightRef.current = run;
      try {
        await run;
      } finally {
        if (syncInFlightRef.current === run) {
          syncInFlightRef.current = null;
        }
      }
    },
    [
      applyLatestWindow,
      customerId,
      businessId,
      fetchAndStoreConversation,
      reconcileWithLiveMessages,
    ],
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
      guestNameRef.current = null;
      guestEmailRef.current = null;
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
          const lastMessageId =
            page.lastMessageId ?? getMaxMessageId(page.messages);
          if (lastMessageId != null && lastMessageId > 0) {
            await syncConversationRef.current(lastMessageId);
          } else {
            await syncConversationRef.current(0);
          }
        } catch (syncError) {
          if (!cancelled) {
            console.warn("[Chat sync] Background catch-up failed", syncError);
          }
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
        await syncConversationRef.current(0);
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

      // Prefer full store + any live rows already shown (Pusher can beat IndexedDB).
      let allMessages = data.messages;
      for (const message of fullMessagesRef.current) {
        allMessages = insertMessageIfAbsent(allMessages, message);
      }
      allMessages = sortConversationMessages(allMessages);
      fullMessagesRef.current = allMessages;

      const latestPage = getLatestMessageWindow(allMessages);
      const startIndex = messageStartIndexRef.current;
      const viewingLatest = startIndex >= latestPage.startIndex;

      if (viewingLatest) {
        applyMessagePage({
          customerId: data.customerId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          messages: latestPage.window,
          startIndex: latestPage.startIndex,
          hasOlder: latestPage.hasOlder,
        });
        return;
      }

      setConversation((prev) => {
        const visible = mergeVisibleMessages(
          allMessages,
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
  }, [applyMessagePage, customerId, businessId, mergeVisibleMessages]);

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
        const lastMessageId = cached
          ? getMaxMessageId(cached.messages)
          : getMaxMessageId(memoryPage?.messages ?? []);

        if (lastMessageId != null && lastMessageId > 0) {
          await syncConversationRef.current(lastMessageId);
        } else {
          await syncConversationRef.current(0);
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

        const nextStart = Math.max(0, startIndex - CHAT_MESSAGE_SYNC_PAGE_SIZE);
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
      const cached = CHAT_USE_INDEXED_DB
        ? await getStoredChatConversation(businessId, customerId)
        : null;
      const lastMessageId =
        getMaxMessageId(cached?.messages ?? []) ??
        getMaxMessageId(conversation?.messages ?? []);

      if (lastMessageId != null && lastMessageId > 0) {
        await syncConversationFromApi(lastMessageId);
      } else {
        await syncConversationFromApi(0);
      }
      setError(null);
    } catch (refetchError) {
      setError(
        getApiErrorMessage(refetchError, "Could not load this conversation."),
      );
    } finally {
      setRefreshing(false);
    }
  }, [customerId, syncConversationFromApi, businessId, conversation?.messages]);

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
        const existing = fullMessagesRef.current;
        const hadMessage = messageExistsById(existing, payload.message.id);
        let nextMessages = existing;

        if (hadMessage) {
          nextMessages = existing.map((message) =>
            message.id === payload.message.id
              ? {
                  ...message,
                  automationName:
                    message.automationName ??
                    payload.message.automationName ??
                    null,
                  campaignName:
                    message.campaignName ??
                    payload.message.campaignName ??
                    null,
                  funnelName:
                    message.funnelName ??
                    payload.message.funnelName ??
                    null,
                  funnelId:
                    message.funnelId ?? payload.message.funnelId ?? null,
                }
              : message,
          );
        } else {
          nextMessages = sortConversationMessages(
            insertMessageIfAbsent(existing, payload.message),
          );
        }

        applyLatestWindow({
          customerId,
          customerName: payload.customerName ?? guestNameRef.current,
          customerEmail: payload.customerEmail ?? guestEmailRef.current,
          messages: nextMessages,
        });
        messagesLoadedRef.current = true;
      } catch (error) {
        console.warn("[Chat Pusher] Failed to apply open-thread message", {
          businessId,
          conversationId,
          customerId,
          error,
        });
        return;
      }

      if (CHAT_USE_INDEXED_DB) {
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
    [applyLatestWindow, customerId, conversationId, businessId],
  );

  // Business list channel is always subscribed while chats are open; also apply
  // here so the open thread updates even if the per-conversation channel is late.
  useBusinessConversationsPusher(businessId, applyPusherMessage);
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
