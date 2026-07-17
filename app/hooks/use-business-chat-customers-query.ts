"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBusinessConversationsPusher } from "@/app/hooks/use-business-chat-pusher";
import type { ChatMessagePusherPayload } from "@/app/lib/pusher-chat";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  appendChatCustomersPage,
  getLatestConversationIdByCreatedAt,
  mergeCustomersAfterSync,
  mergePageOneIntoLoadedCustomers,
  patchChatCustomersFromPusher,
} from "@/app/services/chat/chat-query-cache";
import {
  getRestaurantChatCustomers,
  RESTAURANT_CHAT_PAGE_SIZE,
  syncRestaurantChatCustomers,
  type PaginatedChatCustomersResponse,
} from "@/app/services/chat/get-business-chat-customers";

export function useBusinessChatCustomersQuery(businessId: number) {
  const [data, setData] = useState<PaginatedChatCustomersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedPageRef = useRef(1);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    loadedPageRef.current = 1;
    setData(null);
    setError(null);
  }, [businessId]);

  const fetchPage = useCallback(
    async (page: number) => {
      return getRestaurantChatCustomers(businessId, {
        page,
        limit: RESTAURANT_CHAT_PAGE_SIZE,
      });
    },
    [businessId],
  );

  const syncCustomersFromApi = useCallback(
    async (current: PaginatedChatCustomersResponse) => {
      const afterConversationId = getLatestConversationIdByCreatedAt(current);
      if (!afterConversationId) {
        const fresh = await fetchPage(1);
        setData((prev) => mergePageOneIntoLoadedCustomers(prev, fresh));
        loadedPageRef.current = Math.max(loadedPageRef.current, 1);
        setError(null);
        return;
      }

      const delta = await syncRestaurantChatCustomers(
        businessId,
        afterConversationId,
      );

      if (delta.data.length === 0) {
        return;
      }

      const merged = mergeCustomersAfterSync(current, delta.data);
      setData((prev) => mergePageOneIntoLoadedCustomers(prev, merged));
      setError(null);
    },
    [businessId, fetchPage],
  );

  useEffect(() => {
    if (businessId < 1) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    loadedPageRef.current = 1;

    async function loadFirstPage() {
      setLoading(true);
      setSyncing(true);
      setError(null);

      try {
        const fresh = await fetchPage(1);
        if (cancelled) {
          return;
        }
        setData(fresh);
        loadedPageRef.current = 1;
        await syncCustomersFromApi(fresh);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(loadError, "Could not load guest conversations."),
          );
        }
      } finally {
        if (!cancelled) {
          setSyncing(false);
          setLoading(false);
        }
      }
    }

    void loadFirstPage();

    return () => {
      cancelled = true;
    };
  }, [businessId, fetchPage, syncCustomersFromApi]);

  const loadMore = useCallback(async () => {
    if (businessId < 1 || loadingMoreRef.current) {
      return;
    }

    const totalPages = data?.meta.totalPages ?? 0;
    const nextPage = loadedPageRef.current + 1;
    if (totalPages < 1 || nextPage > totalPages) {
      return;
    }

    loadingMoreRef.current = true;
    setLoadingMore(true);
    setError(null);

    try {
      const next = await fetchPage(nextPage);
      setData((prev) => appendChatCustomersPage(prev, next));
      loadedPageRef.current = nextPage;
    } catch (loadError) {
      setError(
        getApiErrorMessage(loadError, "Could not load more guest conversations."),
      );
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [businessId, data?.meta.totalPages, fetchPage]);

  const refetch = useCallback(async () => {
    if (businessId < 1) {
      return;
    }

    setRefreshing(true);
    loadedPageRef.current = 1;

    try {
      const fresh = await fetchPage(1);
      setData(fresh);
      setError(null);
    } catch (refetchError) {
      setError(
        getApiErrorMessage(refetchError, "Could not load guest conversations."),
      );
    } finally {
      setRefreshing(false);
    }
  }, [fetchPage, businessId]);

  const applyPusherMessage = useCallback(
    (payload: ChatMessagePusherPayload) => {
      if (payload.businessId !== businessId) {
        return;
      }

      try {
        setData((prev) => {
          const next = patchChatCustomersFromPusher(
            prev ?? undefined,
            payload,
            1,
          );
          if (!next || next === prev) {
            return prev;
          }
          return next;
        });
      } catch (error) {
        console.warn("[Chat Pusher] Failed to apply conversation list update", {
          businessId,
          conversationId: payload.conversationId,
          customerId: payload.customerId,
          error,
        });
      }
    },
    [businessId],
  );

  useBusinessConversationsPusher(businessId, applyPusherMessage);

  const loadedPage = data?.meta.page ?? loadedPageRef.current;
  const totalPages = data?.meta.totalPages ?? 0;
  const hasMore = totalPages > 0 && loadedPage < totalPages;

  return {
    rows: data?.data ?? [],
    totalPages,
    total: data?.meta.total ?? 0,
    loading,
    loadingMore,
    hasMore,
    syncing,
    refreshing,
    error,
    page: loadedPage,
    loadMore,
    refetch,
  };
}
