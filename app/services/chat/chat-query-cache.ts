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
    createdAt: existing?.createdAt ?? payload.lastMessageAt,
  };
}

export function getLatestCustomerIdByCreatedAt(
  customers: PaginatedChatCustomersResponse,
): number | null {
  if (customers.data.length === 0) {
    return null;
  }

  let latest: ChatCustomer | null = null;

  for (const row of customers.data) {
    if (!row.createdAt) {
      return null;
    }

    if (
      !latest ||
      new Date(row.createdAt).getTime() > new Date(latest.createdAt).getTime()
    ) {
      latest = row;
    }
  }

  return latest?.customerId ?? null;
}

export function mergeCustomersAfterSync(
  previous: PaginatedChatCustomersResponse,
  incoming: ChatCustomer[],
): PaginatedChatCustomersResponse {
  if (incoming.length === 0) {
    return previous;
  }

  const existingIds = new Set(previous.data.map((row) => row.customerId));
  const newRows = incoming.filter((row) => !existingIds.has(row.customerId));

  if (newRows.length === 0) {
    return previous;
  }

  const merged = [...newRows, ...previous.data].sort(
    (left, right) =>
      new Date(right.lastMessageAt).getTime() -
      new Date(left.lastMessageAt).getTime(),
  );

  return {
    ...previous,
    data: merged.slice(0, previous.meta.limit),
    meta: {
      ...previous.meta,
      total: previous.meta.total + newRows.length,
    },
  };
}

export function patchChatCustomersFromPusher(
  prev: PaginatedChatCustomersResponse | undefined,
  payload: ChatMessagePusherPayload,
  page: number,
): PaginatedChatCustomersResponse | undefined {
  if (!prev) {
    if (page !== 1) {
      return prev;
    }

    return {
      data: [buildChatCustomerRow(payload)],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    };
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

export function mergeConversationAfterSync(
  previous: CustomerConversationDetail | null | undefined,
  incoming: CustomerConversationDetail,
): CustomerConversationDetail {
  if (!previous) {
    return incoming;
  }

  const existingIds = new Set(previous.messages.map((message) => message.id));
  const newMessages = incoming.messages.filter(
    (message) => !existingIds.has(message.id),
  );

  if (newMessages.length === 0) {
    return {
      ...previous,
      customerName: incoming.customerName ?? previous.customerName,
      customerEmail: incoming.customerEmail ?? previous.customerEmail,
    };
  }

  return {
    customerId: incoming.customerId,
    customerName: incoming.customerName ?? previous.customerName,
    customerEmail: incoming.customerEmail ?? previous.customerEmail,
    messages: [...previous.messages, ...newMessages],
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
