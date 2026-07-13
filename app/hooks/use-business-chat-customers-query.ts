"use client";

import { useCallback, useEffect, useState } from "react";
import { useBusinessChatPusher } from "@/app/hooks/use-business-chat-pusher";
import type { ChatMessagePusherPayload } from "@/app/lib/pusher-chat";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  areChatCustomerListsEquivalent,
  getLatestCustomerIdByCreatedAt,
  mergeCustomersAfterSync,
  patchChatCustomersFromPusher,
} from "@/app/services/chat/chat-query-cache";
import {
  getStoredChatCustomers,
  patchChatConversationFromPusher,
  patchChatCustomersFromPusherInIndexedDb,
  saveChatCustomers,
  subscribeChatCustomers,
} from "@/app/services/chat/chat-indexed-db";
import {
  getRestaurantChatCustomers,
  RESTAURANT_CHAT_PAGE_SIZE,
  syncRestaurantChatCustomers,
  type PaginatedChatCustomersResponse,
} from "@/app/services/chat/get-business-chat-customers";
import { useGuestChatCatchUpRegistration } from "@/app/hooks/use-business-chat-catch-up-sync";

export function useBusinessChatCustomersQuery(businessId: number) {
  const [page, setPageState] = useState(1);
  const [data, setData] = useState<PaginatedChatCustomersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPageState(1);
  }, [businessId]);

  const fetchAndStoreCustomers = useCallback(async () => {
    const fresh = await getRestaurantChatCustomers(businessId, {
      page,
      limit: RESTAURANT_CHAT_PAGE_SIZE,
    });
    await saveChatCustomers(businessId, page, fresh);
    setData(fresh);
    setError(null);
    return fresh;
  }, [page, businessId]);

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
        businessId,
        afterCustomerId,
        { limit: RESTAURANT_CHAT_PAGE_SIZE },
      );

      if (delta.data.length === 0) {
        return;
      }

      const merged = mergeCustomersAfterSync(cached, delta.data);
      await saveChatCustomers(businessId, page, merged);
      setData(merged);
      setError(null);
    },
    [fetchAndStoreCustomers, page, businessId],
  );

  useEffect(() => {
    if (businessId < 1) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadFromDbAndSync() {
      setSyncing(false);
      setError(null);

      const cached = await getStoredChatCustomers(businessId, page);
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
  }, [fetchAndStoreCustomers, page, businessId, syncCustomersFromApi]);

  useEffect(() => {
    return subscribeChatCustomers((storedRestaurantId, storedPage, customers) => {
      if (storedRestaurantId !== businessId || storedPage !== page) {
        return;
      }

      // Ignore IndexedDB echo when Pusher already updated in-memory state.
      setData((prev) => {
        if (prev && areChatCustomerListsEquivalent(prev.data, customers.data)) {
          return prev;
        }
        return customers;
      });
    });
  }, [page, businessId]);

  const refetch = useCallback(async () => {
    if (businessId < 1) {
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
  }, [fetchAndStoreCustomers, businessId]);

  const catchUpSync = useCallback(async () => {
    if (businessId < 1) {
      return;
    }

    try {
      await fetchAndStoreCustomers();
    } catch {
    }
  }, [fetchAndStoreCustomers, businessId]);

  useGuestChatCatchUpRegistration(catchUpSync);

  const setPage = useCallback((nextPage: number) => {
    setPageState(nextPage);
  }, []);

  const applyPusherMessage = useCallback(
    (payload: ChatMessagePusherPayload) => {
      if (payload.businessId !== businessId) {
        return;
      }

      setData((prev) => {
        const next = patchChatCustomersFromPusher(prev ?? undefined, payload, page);
        if (!next || next === prev) {
          return prev;
        }
        return next;
      });
      void patchChatCustomersFromPusherInIndexedDb(businessId, payload);
      // Keep conversation storage in sync even when this guest is not open in the panel.
      void patchChatConversationFromPusher(businessId, payload.customerId, payload);
    },
    [page, businessId],
  );

  useBusinessChatPusher(businessId, applyPusherMessage);

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
