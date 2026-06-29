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
import { patchChatCustomersFromPusher } from "@/app/services/chat/chat-query-cache";
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

  const query = useQuery({
    queryKey: chatQueryKeys.customers(restaurantId, page),
    queryFn: () =>
      getRestaurantChatCustomers(restaurantId, {
        page,
        limit: RESTAURANT_CHAT_PAGE_SIZE,
      }),
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

      const customersRoot = chatQueryKeys.customersRoot(restaurantId);
      void queryClient.cancelQueries({ queryKey: customersRoot });

      const cachedQueries = queryClient
        .getQueryCache()
        .findAll({ queryKey: customersRoot });

      if (cachedQueries.length === 0) {
        void queryClient.invalidateQueries({ queryKey: customersRoot });
        return;
      }

      for (const cachedQuery of cachedQueries) {
        const cachedPage = cachedQuery.queryKey.at(-1);
        const pageNumber = typeof cachedPage === "number" ? cachedPage : page;

        queryClient.setQueryData<PaginatedChatCustomersResponse>(
          cachedQuery.queryKey,
          (prev) => patchChatCustomersFromPusher(prev, payload, pageNumber),
        );
      }
    },
    [page, queryClient, restaurantId],
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
