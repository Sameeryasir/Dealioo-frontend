"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  appendChatConversationMessage,
  patchChatCustomersAfterSendInIndexedDb,
} from "@/app/services/chat/chat-indexed-db";
import type { ChatCustomer } from "@/app/services/chat/get-business-chat-customers";
import { sendCustomerMessage } from "@/app/services/chat/send-customer-message";

export function useSendCustomerMessage(
  businessId: number,
  guest: ChatCustomer,
) {
  return useMutation({
    mutationFn: (body: string) =>
      sendCustomerMessage(businessId, guest.customerId, body),
    onSuccess: async (message) => {
      await appendChatConversationMessage(businessId, guest, message);
      await patchChatCustomersAfterSendInIndexedDb(businessId, guest, message);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not send this message."));
    },
  });
}
