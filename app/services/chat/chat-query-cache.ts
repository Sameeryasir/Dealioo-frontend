import type { ChatMessagePusherPayload } from "@/app/lib/pusher-chat";
import {
  sanitizeChatMessageBody,
  sanitizeChatMessagePreview,
} from "@/app/lib/strip-email-signoff-for-chat";
import type {
  ChatCustomer,
  PaginatedChatCustomersResponse,
} from "@/app/services/chat/get-business-chat-customers";
import type {
  ConversationMessage,
  CustomerConversationDetail,
} from "@/app/services/chat/get-business-conversation";

export function messageExistsById(
  messages: ConversationMessage[],
  messageId: number,
): boolean {
  return messages.some((message) => message.id === messageId);
}

export function insertMessageIfAbsent(
  messages: ConversationMessage[],
  message: ConversationMessage,
): ConversationMessage[] {
  if (messageExistsById(messages, message.id)) {
    return messages;
  }

  return [...messages, message];
}

export function getLatestMessageId(
  messages: ConversationMessage[],
): number | null {
  if (messages.length === 0) {
    return null;
  }

  return messages[messages.length - 1]!.id;
}

function sanitizeStoredMessage(message: ConversationMessage): ConversationMessage {
  return {
    ...message,
    body: sanitizeChatMessageBody(message.body),
  };
}

function sanitizeStoredCustomerRow(row: ChatCustomer): ChatCustomer {
  return {
    ...row,
    lastMessagePreview: sanitizeChatMessagePreview(row.lastMessagePreview),
  };
}

function sanitizeStoredCustomers(
  customers: PaginatedChatCustomersResponse,
): PaginatedChatCustomersResponse {
  return {
    ...customers,
    data: customers.data.map(sanitizeStoredCustomerRow),
  };
}

function sanitizeStoredConversation(
  conversation: CustomerConversationDetail,
): CustomerConversationDetail {
  return {
    ...conversation,
    messages: conversation.messages.map(sanitizeStoredMessage),
  };
}

function buildChatCustomerRow(
  payload: ChatMessagePusherPayload,
  existing?: ChatCustomer | null,
): ChatCustomer {
  return sanitizeStoredCustomerRow({
    customerId: payload.customerId,
    customerName: payload.customerName,
    customerEmail: payload.customerEmail,
    messageCount: payload.messageCount,
    lastMessagePreview: payload.lastMessagePreview,
    lastMessageChannel: payload.lastMessageChannel,
    lastMessageAt: payload.lastMessageAt,
    lastAutomationName: existing?.lastAutomationName ?? null,
    createdAt: existing?.createdAt ?? payload.lastMessageAt,
  });
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
  const sanitizedIncoming = sanitizeStoredConversation(incoming);

  if (!previous) {
    return sanitizedIncoming;
  }

  const sanitizedPrevious = sanitizeStoredConversation(previous);
  const newMessages = sanitizedIncoming.messages.filter(
    (message) => !messageExistsById(sanitizedPrevious.messages, message.id),
  );

  if (newMessages.length === 0) {
    return {
      ...sanitizedPrevious,
      customerName: sanitizedIncoming.customerName ?? sanitizedPrevious.customerName,
      customerEmail: sanitizedIncoming.customerEmail ?? sanitizedPrevious.customerEmail,
    };
  }

  return {
    customerId: sanitizedIncoming.customerId,
    customerName: sanitizedIncoming.customerName ?? sanitizedPrevious.customerName,
    customerEmail: sanitizedIncoming.customerEmail ?? sanitizedPrevious.customerEmail,
    messages: [...sanitizedPrevious.messages, ...newMessages],
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
  if (messageExistsById(existingMessages, payload.message.id)) {
    return prev;
  }

  return {
    customerId,
    customerName: payload.customerName ?? prev?.customerName ?? null,
    customerEmail: payload.customerEmail ?? prev?.customerEmail ?? null,
    messages: insertMessageIfAbsent(
      existingMessages,
      sanitizeStoredMessage(payload.message),
    ),
  };
}

export function appendConversationMessage(
  prev: CustomerConversationDetail | undefined,
  message: ConversationMessage,
  guest: Pick<ChatCustomer, "customerId" | "customerName" | "customerEmail">,
): CustomerConversationDetail {
  const existingMessages = prev?.messages ?? [];
  if (messageExistsById(existingMessages, message.id)) {
    return (
      prev ?? {
        customerId: guest.customerId,
        customerName: guest.customerName,
        customerEmail: guest.customerEmail,
        messages: existingMessages,
      }
    );
  }

  return sanitizeStoredConversation({
    customerId: guest.customerId,
    customerName: prev?.customerName ?? guest.customerName,
    customerEmail: prev?.customerEmail ?? guest.customerEmail,
    messages: insertMessageIfAbsent(
      existingMessages,
      sanitizeStoredMessage(message),
    ),
  });
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
    message: sanitizeStoredMessage(message),
    lastMessagePreview: sanitizeChatMessagePreview(message.body).slice(0, 80),
    lastMessageChannel: message.kind === "error" ? "email" : message.kind,
    lastMessageAt: message.sentAt,
    messageCount: guest.messageCount + 1,
  };

  return patchChatCustomersFromPusher(prev, payload, page);
}
