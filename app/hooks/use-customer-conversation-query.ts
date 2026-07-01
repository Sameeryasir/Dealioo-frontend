"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRestaurantChatPusher } from "@/app/hooks/use-restaurant-chat-pusher";
import type { ChatMessagePusherPayload } from "@/app/lib/pusher-chat";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  getLatestMessageWindow,
} from "@/app/components/restaurant/guest-chats/guest-chats-utils";
import { mergeConversationAfterSync } from "@/app/services/chat/chat-query-cache";
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
} from "@/app/services/chat/get-restaurant-conversation";
import { useConversationCatchUpRegistration } from "@/app/hooks/use-restaurant-chat-catch-up-sync";

export function useCustomerConversationQuery(
  restaurantId: number,
  customerId: number,
) {
  const [conversation, setConversation] = useState<CustomerConversationDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [awaitingCache, setAwaitingCache] = useState(
    () => !peekStoredChatMessagesLatestPage(restaurantId, customerId),
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
    const fresh = await getCustomerConversation(restaurantId, customerId);
    await saveChatConversation(restaurantId, customerId, fresh);
    applyLatestWindow(fresh);
    setError(null);
    return fresh;
  }, [applyLatestWindow, customerId, restaurantId]);

  const syncConversationFromApi = useCallback(
    async (cachedLastMessageId: number | null) => {
      if (cachedLastMessageId) {
        const delta = await syncCustomerConversationMessages(
          restaurantId,
          customerId,
          cachedLastMessageId,
        );

        if (delta.messages.length === 0) {
          return;
        }

        const cached = await getStoredChatConversation(restaurantId, customerId);
        const merged = mergeConversationAfterSync(cached, delta);
        await saveChatConversation(restaurantId, customerId, merged);
        applyLatestWindow(merged);
        return;
      }

      const fresh = await getCustomerConversation(restaurantId, customerId);
      await saveChatConversation(restaurantId, customerId, fresh);
      applyLatestWindow(fresh);
    },
    [applyLatestWindow, customerId, restaurantId],
  );

  useLayoutEffect(() => {
    if (restaurantId < 1 || customerId < 1) {
      return;
    }

    const memoryPage = peekStoredChatMessagesLatestPage(restaurantId, customerId);
    if (memoryPage) {
      applyMessagePage(memoryPage);
      setAwaitingCache(false);
    } else {
      setAwaitingCache(true);
    }
  }, [applyMessagePage, customerId, restaurantId]);

  useEffect(() => {
    if (restaurantId < 1 || customerId < 1) {
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

      const memoryPage = peekStoredChatMessagesLatestPage(restaurantId, customerId);

      const page =
        memoryPage ??
        (await getStoredChatMessagesLatestPage(restaurantId, customerId));

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
    restaurantId,
    syncConversationFromApi,
  ]);

  useEffect(() => {
    return subscribeChatConversation((storedRestaurantId, storedCustomerId, data) => {
      if (
        storedRestaurantId !== restaurantId ||
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
  }, [customerId, restaurantId]);

  const loadOlderMessages = useCallback(async () => {
    if (
      restaurantId < 1 ||
      customerId < 1 ||
      loadingOlder ||
      !hasOlderMessages
    ) {
      return false;
    }

    setLoadingOlder(true);

    try {
      const page = await getStoredChatMessagesOlderPage(
        restaurantId,
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
    restaurantId,
  ]);

  const refetch = useCallback(async () => {
    if (restaurantId < 1 || customerId < 1) {
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
  }, [customerId, fetchAndStoreConversation, restaurantId]);

  const catchUpSync = useCallback(async () => {
    if (restaurantId < 1 || customerId < 1) {
      return;
    }

    try {
      const page = await getStoredChatMessagesLatestPage(restaurantId, customerId);
      await syncConversationFromApi(page?.lastMessageId ?? null);
    } catch {
    }
  }, [customerId, restaurantId, syncConversationFromApi]);

  useConversationCatchUpRegistration(catchUpSync);

  const applyPusherMessage = useCallback(
    (payload: ChatMessagePusherPayload) => {
      if (
        payload.restaurantId !== restaurantId ||
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

        if (prev.messages.some((message) => message.id === payload.message.id)) {
          return prev;
        }

        return {
          customerId: prev.customerId,
          customerName: payload.customerName ?? prev.customerName,
          customerEmail: payload.customerEmail ?? prev.customerEmail,
          messages: [...prev.messages, payload.message],
        };
      });

      void patchChatConversationFromPusher(restaurantId, customerId, payload);
    },
    [customerId, restaurantId],
  );

  useRestaurantChatPusher(restaurantId, applyPusherMessage);

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
