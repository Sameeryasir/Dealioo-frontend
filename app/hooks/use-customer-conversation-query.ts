"use client";

import { useCallback, useEffect, useState } from "react";
import { useRestaurantChatPusher } from "@/app/hooks/use-restaurant-chat-pusher";
import type { ChatMessagePusherPayload } from "@/app/lib/pusher-chat";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  getStoredChatConversation,
  patchChatConversationFromPusher,
  saveChatConversation,
  subscribeChatConversation,
} from "@/app/services/chat/chat-indexed-db";
import {
  getCustomerConversation,
  type CustomerConversationDetail,
} from "@/app/services/chat/get-restaurant-conversation";

export function useCustomerConversationQuery(
  restaurantId: number,
  customerId: number,
) {
  const [conversation, setConversation] = useState<CustomerConversationDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAndStoreConversation = useCallback(async () => {
    const fresh = await getCustomerConversation(restaurantId, customerId);
    await saveChatConversation(restaurantId, customerId, fresh);
    setConversation(fresh);
    setError(null);
    return fresh;
  }, [customerId, restaurantId]);

  useEffect(() => {
    if (restaurantId < 1 || customerId < 1) {
      setConversation(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadConversation() {
      setLoading(true);
      setError(null);

      const cached = await getStoredChatConversation(restaurantId, customerId);
      if (cancelled) {
        return;
      }

      if (cached) {
        setConversation(cached);
        setLoading(false);
      }

      try {
        await fetchAndStoreConversation();
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        if (!cached) {
          setConversation(null);
          setError(
            getApiErrorMessage(loadError, "Could not load this conversation."),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadConversation();

    return () => {
      cancelled = true;
    };
  }, [customerId, fetchAndStoreConversation, restaurantId]);

  useEffect(() => {
    return subscribeChatConversation((storedRestaurantId, storedCustomerId, data) => {
      if (
        storedRestaurantId !== restaurantId ||
        storedCustomerId !== customerId
      ) {
        return;
      }

      setConversation(data);
    });
  }, [customerId, restaurantId]);

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

  const applyPusherMessage = useCallback(
    (payload: ChatMessagePusherPayload) => {
      if (
        payload.restaurantId !== restaurantId ||
        payload.customerId !== customerId
      ) {
        return;
      }

      void patchChatConversationFromPusher(restaurantId, customerId, payload);
    },
    [customerId, restaurantId],
  );

  useRestaurantChatPusher(restaurantId, applyPusherMessage);

  return {
    conversation,
    loading,
    refreshing,
    error,
    refetch,
  };
}
