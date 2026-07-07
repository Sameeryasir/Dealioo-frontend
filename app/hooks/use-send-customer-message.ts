"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  appendChatConversationMessage,
  patchChatCustomersAfterSendInIndexedDb,
} from "@/app/services/chat/chat-indexed-db";
import type { ChatCustomer } from "@/app/services/chat/get-restaurant-chat-customers";
import { sendCustomerMessage } from "@/app/services/chat/send-customer-message";

export function useSendCustomerMessage(
  restaurantId: number,
  guest: ChatCustomer,
) {
  return useMutation({
    mutationFn: (body: string) =>
      sendCustomerMessage(restaurantId, guest.customerId, body),
    onSuccess: async (message) => {
      await appendChatConversationMessage(restaurantId, guest, message);
      await patchChatCustomersAfterSendInIndexedDb(restaurantId, guest, message);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not send this message."));
    },
  });
}
