"use client";

import { useCallback, useEffect, useState } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRestaurantChatPusher } from "@/app/hooks/use-restaurant-chat-pusher";
import type { ChatMessagePusherPayload } from "@/app/lib/pusher-chat";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  getStoredChatCustomers,
  patchChatCustomersFromPusherInIndexedDb,
  saveChatCustomers,
  subscribeChatCustomers,
} from "@/app/services/chat/chat-indexed-db";
import { chatQueryKeys } from "@/app/services/chat/chat-query-keys";
import {
  getRestaurantChatCustomers,
  RESTAURANT_CHAT_PAGE_SIZE,
  type PaginatedChatCustomersResponse,
} from "@/app/services/chat/get-restaurant-chat-customers";

export function useRestaurantChatCustomersQuery(restaurantId: number) {
  const queryClient = useQueryClient();
  const [page, setPageState] = useState(1);

  useEffect(() => {
    setPageState(1);
  }, [restaurantId]);

  const customersQueryKey = chatQueryKeys.customers(restaurantId, page);

  useEffect(() => {
    if (restaurantId < 1) {
      return;
    }

    let cancelled = false;

    async function loadCachedCustomers() {
      const cached = await getStoredChatCustomers(restaurantId, page);
      if (cancelled || !cached) {
        return;
      }

      queryClient.setQueryData<PaginatedChatCustomersResponse>(
        customersQueryKey,
        cached,
      );
    }

    void loadCachedCustomers();

    return () => {
      cancelled = true;
    };
  }, [customersQueryKey, page, queryClient, restaurantId]);

  useEffect(() => {
    return subscribeChatCustomers((storedRestaurantId, storedPage, data) => {
      if (storedRestaurantId !== restaurantId || storedPage !== page) {
        return;
      }

      queryClient.setQueryData<PaginatedChatCustomersResponse>(
        chatQueryKeys.customers(storedRestaurantId, storedPage),
        data,
      );
    });
  }, [page, queryClient, restaurantId]);

  const query = useQuery({
    queryKey: customersQueryKey,
    queryFn: async () => {
      const fresh = await getRestaurantChatCustomers(restaurantId, {
        page,
        limit: RESTAURANT_CHAT_PAGE_SIZE,
      });
      await saveChatCustomers(restaurantId, page, fresh);
      return fresh;
    },
    enabled: restaurantId >= 1,
    placeholderData: keepPreviousData,
  });

  const setPage = useCallback((nextPage: number) => {
    setPageState(nextPage);
  }, []);

  const applyPusherMessage = useCallback(
    (payload: ChatMessagePusherPayload) => {
      if (payload.restaurantId !== restaurantId) {
        return;
      }

      void patchChatCustomersFromPusherInIndexedDb(restaurantId, payload);
    },
    [restaurantId],
  );

  useRestaurantChatPusher(restaurantId, applyPusherMessage);

  return {
    rows: query.data?.data ?? [],
    totalPages: query.data?.meta.totalPages ?? 0,
    total: query.data?.meta.total ?? 0,
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error
      ? getApiErrorMessage(
          query.error,
          "Could not load guest conversations.",
        )
      : null,
    page,
    setPage,
    refetch: query.refetch,
  };
}
