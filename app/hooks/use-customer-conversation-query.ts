"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useBusinessChatPusher } from "@/app/hooks/use-business-chat-pusher";
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
import {
  getStoredChatConversation,
  getStoredChatMessagesLatestPage,
  getStoredChatMessagesOlderPage,
  patchChatConversationFromPusher,
  peekStoredChatMessagesLatestPage,
  saveChatConversation,
  subscribeChatConversation,
} from "@/app/services/chat/chat-indexed-db";
import {
  getCustomerConversation,
  syncCustomerConversationMessages,
  type CustomerConversationDetail,
} from "@/app/services/chat/get-business-conversation";
import { useConversationCatchUpRegistration } from "@/app/hooks/use-business-chat-catch-up-sync";

export function useCustomerConversationQuery(
  businessId: number,
  customerId: number,
) {
  const [conversation, setConversation] = useState<CustomerConversationDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [awaitingCache, setAwaitingCache] = useState(
    () => !peekStoredChatMessagesLatestPage(businessId, customerId),
  );
  const [syncing, setSyncing] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageStartIndexRef = useRef(0);

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
    const fresh = await getCustomerConversation(businessId, customerId);
    await saveChatConversation(businessId, customerId, fresh);
    applyLatestWindow(fresh);
    setError(null);
    return fresh;
  }, [applyLatestWindow, customerId, businessId]);

  const syncConversationFromApi = useCallback(
    async (cachedLastMessageId: number | null) => {
      if (cachedLastMessageId) {
        const delta = await syncCustomerConversationMessages(
          businessId,
          customerId,
          cachedLastMessageId,
        );

        if (delta.messages.length === 0) {
          return;
        }

        const cached = await getStoredChatConversation(businessId, customerId);
        const merged = mergeConversationAfterSync(cached, delta);
        await saveChatConversation(businessId, customerId, merged);
        applyLatestWindow(merged);
        return;
      }

      const fresh = await getCustomerConversation(businessId, customerId);
      await saveChatConversation(businessId, customerId, fresh);
      applyLatestWindow(fresh);
    },
    [applyLatestWindow, customerId, businessId],
  );

  useLayoutEffect(() => {
    if (businessId < 1 || customerId < 1) {
      return;
    }

    const memoryPage = peekStoredChatMessagesLatestPage(businessId, customerId);
    if (memoryPage) {
      applyMessagePage(memoryPage);
      setAwaitingCache(false);
    } else {
      setAwaitingCache(true);
    }
  }, [applyMessagePage, customerId, businessId]);

  useEffect(() => {
    if (businessId < 1 || customerId < 1) {
      setConversation(null);
      setHasOlderMessages(false);
      messageStartIndexRef.current = 0;
      setLoading(false);
      setAwaitingCache(false);
      return;
    }

    let cancelled = false;

    async function loadAndSyncConversation() {
      setSyncing(false);
      setError(null);
      messageStartIndexRef.current = 0;

      const memoryPage = peekStoredChatMessagesLatestPage(businessId, customerId);

      const page =
        memoryPage ??
        (await getStoredChatMessagesLatestPage(businessId, customerId));

      if (cancelled) {
        return;
      }

      const hadCachedPage = Boolean(page);

      if (page) {
        applyMessagePage(page);
      } else {
        setConversation(null);
        setHasOlderMessages(false);
        setLoading(true);
      }

      setAwaitingCache(false);

      const lastMessageId = page?.lastMessageId ?? null;

      const runBackgroundSync = () => {
        if (cancelled) {
          return;
        }

        setSyncing(true);

        void syncConversationFromApi(lastMessageId)
          .then(() => {
            if (!cancelled) {
              setError(null);
            }
          })
          .catch((syncError) => {
            if (cancelled) {
              return;
            }

            if (!hadCachedPage) {
              setConversation(null);
              setError(
                getApiErrorMessage(syncError, "Could not load this conversation."),
              );
            }
          })
          .finally(() => {
            if (cancelled) {
              return;
            }

            setSyncing(false);
            if (!hadCachedPage) {
              setLoading(false);
            }
          });
      };

      if (hadCachedPage) {
        requestAnimationFrame(runBackgroundSync);
      } else {
        runBackgroundSync();
      }
    }

    void loadAndSyncConversation();

    return () => {
      cancelled = true;
    };
  }, [
    applyMessagePage,
    customerId,
    businessId,
    syncConversationFromApi,
  ]);

  useEffect(() => {
    return subscribeChatConversation((storedRestaurantId, storedCustomerId, data) => {
      if (
        storedRestaurantId !== businessId ||
        storedCustomerId !== customerId
      ) {
        return;
      }

      const startIndex = messageStartIndexRef.current;
      const visible = data.messages.slice(startIndex);
      setConversation({
        customerId: data.customerId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        messages: visible,
      });
      setHasOlderMessages(startIndex > 0);
    });
  }, [customerId, businessId]);

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

  const catchUpSync = useCallback(async () => {
    if (businessId < 1 || customerId < 1) {
      return;
    }

    try {
      const cached = await getStoredChatConversation(businessId, customerId);
      const lastMessageId =
        cached != null ? getLatestMessageId(cached.messages) : null;
      await syncConversationFromApi(lastMessageId);
    } catch {
    }
  }, [customerId, businessId, syncConversationFromApi]);

  useConversationCatchUpRegistration(catchUpSync);

  const applyPusherMessage = useCallback(
    (payload: ChatMessagePusherPayload) => {
      if (
        payload.businessId !== businessId ||
        payload.customerId !== customerId
      ) {
        return;
      }

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

      void patchChatConversationFromPusher(businessId, customerId, payload);
    },
    [customerId, businessId],
  );

  useBusinessChatPusher(businessId, applyPusherMessage);

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
