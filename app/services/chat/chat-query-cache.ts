import type { ChatMessagePusherPayload } from "@/app/lib/pusher-chat";
import type {
  ChatCustomer,
  PaginatedChatCustomersResponse,
} from "@/app/services/chat/get-restaurant-chat-customers";
import type {
  ConversationMessage,
  CustomerConversationDetail,
} from "@/app/services/chat/get-restaurant-conversation";

function buildChatCustomerRow(
  payload: ChatMessagePusherPayload,
  existing?: ChatCustomer | null,
): ChatCustomer {
  return {
    customerId: payload.customerId,
    customerName: payload.customerName,
    customerEmail: payload.customerEmail,
    messageCount: payload.messageCount,
    lastMessagePreview: payload.lastMessagePreview,
    lastMessageChannel: payload.lastMessageChannel,
    lastMessageAt: payload.lastMessageAt,
    lastAutomationName: existing?.lastAutomationName ?? null,
  };
}

export function patchChatCustomersFromPusher(
  prev: PaginatedChatCustomersResponse | undefined,
  payload: ChatMessagePusherPayload,
  page: number,
): PaginatedChatCustomersResponse | undefined {
  if (!prev) {
    return prev;
  }

  const existingIndex = prev.data.findIndex(
    (row) => row.customerId === payload.customerId,
  );
  const updatedRow = buildChatCustomerRow(
    payload,
    existingIndex >= 0 ? prev.data[existingIndex] : null,
  );

  if (existingIndex >= 0) {
    const nextData = [...prev.data];
    nextData.splice(existingIndex, 1);
    nextData.unshift(updatedRow);

    return {
      ...prev,
      data: nextData,
    };
  }

  if (page !== 1) {
    return prev;
  }

  return {
    ...prev,
    data: [updatedRow, ...prev.data],
  };
}

export function patchConversationFromPusher(
  prev: CustomerConversationDetail | undefined,
  payload: ChatMessagePusherPayload,
  customerId: number,
): CustomerConversationDetail | undefined {
  if (payload.customerId !== customerId) {
    return prev;
  }

  const existingMessages = prev?.messages ?? [];
  if (existingMessages.some((message) => message.id === payload.message.id)) {
    return prev;
  }

  return {
    customerId,
    customerName: payload.customerName ?? prev?.customerName ?? null,
    customerEmail: payload.customerEmail ?? prev?.customerEmail ?? null,
    messages: [...existingMessages, payload.message],
  };
}

export function appendConversationMessage(
  prev: CustomerConversationDetail | undefined,
  message: ConversationMessage,
  guest: Pick<ChatCustomer, "customerId" | "customerName" | "customerEmail">,
): CustomerConversationDetail {
  const existingMessages = prev?.messages ?? [];
  if (existingMessages.some((row) => row.id === message.id)) {
    return (
      prev ?? {
        customerId: guest.customerId,
        customerName: guest.customerName,
        customerEmail: guest.customerEmail,
        messages: existingMessages,
      }
    );
  }

  return {
    customerId: guest.customerId,
    customerName: prev?.customerName ?? guest.customerName,
    customerEmail: prev?.customerEmail ?? guest.customerEmail,
    messages: [...existingMessages, message],
  };
}

export function patchChatCustomersAfterSend(
  prev: PaginatedChatCustomersResponse | undefined,
  guest: ChatCustomer,
  message: ConversationMessage,
  page: number,
): PaginatedChatCustomersResponse | undefined {
  if (!prev) {
    return prev;
  }

  const payload: ChatMessagePusherPayload = {
    restaurantId: 0,
    customerId: guest.customerId,
    customerName: guest.customerName,
    customerEmail: guest.customerEmail,
    message,
    lastMessagePreview: message.body.slice(0, 80),
    lastMessageChannel: message.kind === "error" ? "email" : message.kind,
    lastMessageAt: message.sentAt,
    messageCount: guest.messageCount + 1,
  };

  return patchChatCustomersFromPusher(prev, payload, page);
}
