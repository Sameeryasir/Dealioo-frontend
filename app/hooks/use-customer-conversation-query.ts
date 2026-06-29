"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRestaurantChatPusher } from "@/app/hooks/use-restaurant-chat-pusher";
import type { ChatMessagePusherPayload } from "@/app/lib/pusher-chat";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { patchConversationFromPusher } from "@/app/services/chat/chat-query-cache";
import { chatQueryKeys } from "@/app/services/chat/chat-query-keys";
import {
  getCustomerConversation,
  type CustomerConversationDetail,
} from "@/app/services/chat/get-restaurant-conversation";

export function useCustomerConversationQuery(
  restaurantId: number,
  customerId: number,
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: chatQueryKeys.conversation(restaurantId, customerId),
    queryFn: () => getCustomerConversation(restaurantId, customerId),
    enabled: restaurantId >= 1 && customerId >= 1,
  });

  const applyPusherMessage = useCallback(
    (payload: ChatMessagePusherPayload) => {
      if (
        payload.restaurantId !== restaurantId ||
        payload.customerId !== customerId
      ) {
        return;
      }

      queryClient.setQueryData<CustomerConversationDetail>(
        chatQueryKeys.conversation(restaurantId, customerId),
        (prev) => patchConversationFromPusher(prev, payload, customerId),
      );
    },
    [customerId, queryClient, restaurantId],
  );

  useRestaurantChatPusher(restaurantId, applyPusherMessage);

  return {
    conversation: query.data ?? null,
    loading: query.isLoading,
    refreshing: query.isFetching && !query.isLoading,
    error: query.error
      ? getApiErrorMessage(query.error, "Could not load this conversation.")
      : null,
    refetch: query.refetch,
  };
}
