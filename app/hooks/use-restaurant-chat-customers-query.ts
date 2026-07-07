"use client";

import { useCallback, useEffect, useState } from "react";
import { useRestaurantChatPusher } from "@/app/hooks/use-restaurant-chat-pusher";
import type { ChatMessagePusherPayload } from "@/app/lib/pusher-chat";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  getLatestCustomerIdByCreatedAt,
  mergeCustomersAfterSync,
  patchChatCustomersFromPusher,
} from "@/app/services/chat/chat-query-cache";
import {
  getStoredChatCustomers,
  patchChatCustomersFromPusherInIndexedDb,
  saveChatCustomers,
  subscribeChatCustomers,
} from "@/app/services/chat/chat-indexed-db";
import {
  getRestaurantChatCustomers,
  RESTAURANT_CHAT_PAGE_SIZE,
  syncRestaurantChatCustomers,
  type PaginatedChatCustomersResponse,
} from "@/app/services/chat/get-restaurant-chat-customers";
import { useGuestChatCatchUpRegistration } from "@/app/hooks/use-restaurant-chat-catch-up-sync";

export function useRestaurantChatCustomersQuery(restaurantId: number) {
  const [page, setPageState] = useState(1);
  const [data, setData] = useState<PaginatedChatCustomersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPageState(1);
  }, [restaurantId]);

  const fetchAndStoreCustomers = useCallback(async () => {
    const fresh = await getRestaurantChatCustomers(restaurantId, {
      page,
      limit: RESTAURANT_CHAT_PAGE_SIZE,
    });
    await saveChatCustomers(restaurantId, page, fresh);
    setData(fresh);
    setError(null);
    return fresh;
  }, [page, restaurantId]);

  const syncCustomersFromApi = useCallback(
    async (cached: PaginatedChatCustomersResponse) => {
      if (page !== 1) {
        await fetchAndStoreCustomers();
        return;
      }

      const afterCustomerId = getLatestCustomerIdByCreatedAt(cached);
      if (!afterCustomerId) {
        await fetchAndStoreCustomers();
        return;
      }

      const delta = await syncRestaurantChatCustomers(
        restaurantId,
        afterCustomerId,
        { limit: RESTAURANT_CHAT_PAGE_SIZE },
      );

      if (delta.data.length === 0) {
        return;
      }

      const merged = mergeCustomersAfterSync(cached, delta.data);
      await saveChatCustomers(restaurantId, page, merged);
      setData(merged);
      setError(null);
    },
    [fetchAndStoreCustomers, page, restaurantId],
  );

  useEffect(() => {
    if (restaurantId < 1) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadFromDbAndSync() {
      setSyncing(false);
      setError(null);

      const cached = await getStoredChatCustomers(restaurantId, page);
      if (cancelled) {
        return;
      }

      const hadCachedCustomers = Boolean(cached);

      if (cached) {
        setData(cached);
      } else {
        setData(null);
        setLoading(true);
      }

      setSyncing(true);

      try {
        if (cached) {
          await syncCustomersFromApi(cached);
        } else {
          await fetchAndStoreCustomers();
        }
      } catch (syncError) {
        if (!cancelled && !hadCachedCustomers) {
          setError(
            getApiErrorMessage(syncError, "Could not load guest conversations."),
          );
        }
      } finally {
        if (!cancelled) {
          setSyncing(false);
          if (!hadCachedCustomers) {
            setLoading(false);
          }
        }
      }
    }

    void loadFromDbAndSync();

    return () => {
      cancelled = true;
    };
  }, [fetchAndStoreCustomers, page, restaurantId, syncCustomersFromApi]);

  useEffect(() => {
    return subscribeChatCustomers((storedRestaurantId, storedPage, customers) => {
      if (storedRestaurantId !== restaurantId || storedPage !== page) {
        return;
      }

      setData(customers);
    });
  }, [page, restaurantId]);

  const refetch = useCallback(async () => {
    if (restaurantId < 1) {
      return;
    }

    setRefreshing(true);

    try {
      await fetchAndStoreCustomers();
    } catch (refetchError) {
      setError(
        getApiErrorMessage(refetchError, "Could not load guest conversations."),
      );
    } finally {
      setRefreshing(false);
    }
  }, [fetchAndStoreCustomers, restaurantId]);

  const catchUpSync = useCallback(async () => {
    if (restaurantId < 1) {
      return;
    }

    try {
      await fetchAndStoreCustomers();
    } catch {
    }
  }, [fetchAndStoreCustomers, restaurantId]);

  useGuestChatCatchUpRegistration(catchUpSync);

  const setPage = useCallback((nextPage: number) => {
    setPageState(nextPage);
  }, []);

  const applyPusherMessage = useCallback(
    (payload: ChatMessagePusherPayload) => {
      if (payload.restaurantId !== restaurantId) {
        return;
      }

      setData((prev) => patchChatCustomersFromPusher(prev ?? undefined, payload, page) ?? prev);
      void patchChatCustomersFromPusherInIndexedDb(restaurantId, payload);
    },
    [page, restaurantId],
  );

  useRestaurantChatPusher(restaurantId, applyPusherMessage);

  return {
    rows: data?.data ?? [],
    totalPages: data?.meta.totalPages ?? 0,
    total: data?.meta.total ?? 0,
    loading,
    syncing,
    refreshing,
    error,
    page,
    setPage,
    refetch,
  };
}
