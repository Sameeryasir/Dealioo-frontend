"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  appendConversationMessage,
  patchChatCustomersAfterSend,
} from "@/app/services/chat/chat-query-cache";
import { chatQueryKeys } from "@/app/services/chat/chat-query-keys";
import type { ChatCustomer, PaginatedChatCustomersResponse } from "@/app/services/chat/get-restaurant-chat-customers";
import type { CustomerConversationDetail } from "@/app/services/chat/get-restaurant-conversation";
import { sendCustomerMessage } from "@/app/services/chat/send-customer-message";

export function useSendCustomerMessage(
  restaurantId: number,
  guest: ChatCustomer,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) =>
      sendCustomerMessage(restaurantId, guest.customerId, body),
    onSuccess: (message) => {
      queryClient.setQueryData<CustomerConversationDetail>(
        chatQueryKeys.conversation(restaurantId, guest.customerId),
        (prev) => appendConversationMessage(prev, message, guest),
      );

      const customersRoot = chatQueryKeys.customersRoot(restaurantId);
      const cachedQueries = queryClient
        .getQueryCache()
        .findAll({ queryKey: customersRoot });

      for (const cachedQuery of cachedQueries) {
        const cachedPage = cachedQuery.queryKey.at(-1);
        const pageNumber = typeof cachedPage === "number" ? cachedPage : 1;

        queryClient.setQueryData<PaginatedChatCustomersResponse>(
          cachedQuery.queryKey,
          (prev) => patchChatCustomersAfterSend(prev, guest, message, pageNumber),
        );
      }
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not send this message."));
    },
  });
}
