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
    conversationId: payload.conversationId || existing?.conversationId || 0,
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

export function getLatestConversationIdByCreatedAt(
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

  return latest?.conversationId ?? null;
}

export function getLatestCustomerIdByCreatedAt(
  customers: PaginatedChatCustomersResponse,
): number | null {
  return getLatestConversationIdByCreatedAt(customers);
}

export function compareChatCustomersByRecentActivity(
  left: ChatCustomer,
  right: ChatCustomer,
): number {
  const timeDelta =
    new Date(right.lastMessageAt).getTime() -
    new Date(left.lastMessageAt).getTime();
  if (timeDelta !== 0) {
    return timeDelta;
  }
  return left.customerId - right.customerId;
}

export function sortChatCustomersByRecentActivity(
  rows: ChatCustomer[],
): ChatCustomer[] {
  return [...rows].sort(compareChatCustomersByRecentActivity);
}

function isSameChatCustomerSidebarRow(
  left: ChatCustomer,
  right: ChatCustomer,
): boolean {
  return (
    left.customerId === right.customerId &&
    left.conversationId === right.conversationId &&
    left.lastMessageAt === right.lastMessageAt &&
    left.lastMessagePreview === right.lastMessagePreview &&
    left.messageCount === right.messageCount &&
    left.lastMessageChannel === right.lastMessageChannel
  );
}

export function areChatCustomerListsEquivalent(
  left: ChatCustomer[],
  right: ChatCustomer[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((row, index) => isSameChatCustomerSidebarRow(row, right[index]!));
}

function isPusherPayloadAlreadyApplied(
  row: ChatCustomer,
  payload: ChatMessagePusherPayload,
): boolean {
  return (
    row.conversationId === payload.conversationId &&
    row.lastMessageAt === payload.lastMessageAt &&
    row.messageCount === payload.messageCount &&
    row.lastMessagePreview ===
      sanitizeChatMessagePreview(payload.lastMessagePreview)
  );
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

  // Keep every already-loaded row (infinite scroll may hold multiple pages).
  const merged = sortChatCustomersByRecentActivity([
    ...newRows,
    ...previous.data,
  ]);

  return {
    ...previous,
    data: merged,
    meta: {
      ...previous.meta,
      total: previous.meta.total + newRows.length,
    },
  };
}

/**
 * Append the next page of guests onto the list already on screen.
 * Dedupes by customerId so sync/Pusher overlaps do not create duplicates.
 */
export function appendChatCustomersPage(
  previous: PaginatedChatCustomersResponse | null,
  nextPage: PaginatedChatCustomersResponse,
): PaginatedChatCustomersResponse {
  if (!previous) {
    return nextPage;
  }

  const existingIds = new Set(previous.data.map((row) => row.customerId));
  const appended = nextPage.data.filter(
    (row) => !existingIds.has(row.customerId),
  );

  return {
    data: [...previous.data, ...appended],
    meta: {
      ...nextPage.meta,
      // meta.page = highest page loaded so far (for infinite scroll)
      page: Math.max(previous.meta.page, nextPage.meta.page),
    },
  };
}

/**
 * Apply a page-1 IndexedDB update without dropping later pages already loaded.
 */
export function mergePageOneIntoLoadedCustomers(
  previous: PaginatedChatCustomersResponse | null,
  pageOne: PaginatedChatCustomersResponse,
): PaginatedChatCustomersResponse {
  if (!previous || previous.data.length === 0) {
    return pageOne;
  }

  const byCustomerId = new Map(
    previous.data.map((row) => [row.customerId, row] as const),
  );

  for (const row of pageOne.data) {
    byCustomerId.set(row.customerId, row);
  }

  return {
    data: sortChatCustomersByRecentActivity([...byCustomerId.values()]),
    meta: {
      ...previous.meta,
      total: pageOne.meta.total,
      totalPages: pageOne.meta.totalPages,
      limit: pageOne.meta.limit,
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
    (row) =>
      row.customerId === payload.customerId ||
      (payload.conversationId > 0 &&
        row.conversationId === payload.conversationId),
  );
  const existingRow = existingIndex >= 0 ? prev.data[existingIndex]! : null;

  if (existingRow && isPusherPayloadAlreadyApplied(existingRow, payload)) {
    return prev;
  }

  const updatedRow = buildChatCustomerRow(payload, existingRow);

  if (existingIndex >= 0) {
    const nextData = sortChatCustomersByRecentActivity(
      prev.data.map((row, index) =>
        index === existingIndex ? updatedRow : row,
      ),
    );

    if (areChatCustomerListsEquivalent(prev.data, nextData)) {
      return prev;
    }

    return {
      ...prev,
      data: nextData,
    };
  }

  if (page !== 1) {
    return prev;
  }

  const nextData = sortChatCustomersByRecentActivity([updatedRow, ...prev.data]);

  return {
    ...prev,
    data: nextData,
  };
}

export function mergeConversationAfterSync(
  previous: CustomerConversationDetail | null | undefined,
  incoming: Pick<CustomerConversationDetail, "customerId" | "messages"> &
    Partial<Pick<CustomerConversationDetail, "customerName" | "customerEmail" | "conversationId">>,
): CustomerConversationDetail {
  const sanitizedIncomingMessages = incoming.messages.map(sanitizeStoredMessage);

  if (!previous) {
    return {
      conversationId: incoming.conversationId,
      customerId: incoming.customerId,
      customerName: incoming.customerName ?? null,
      customerEmail: incoming.customerEmail ?? null,
      messages: sanitizedIncomingMessages,
    };
  }

  const sanitizedPrevious = sanitizeStoredConversation(previous);
  const newMessages = sanitizedIncomingMessages.filter(
    (message) => !messageExistsById(sanitizedPrevious.messages, message.id),
  );

  if (newMessages.length === 0) {
    return {
      ...sanitizedPrevious,
      conversationId: incoming.conversationId ?? sanitizedPrevious.conversationId,
      customerName: incoming.customerName ?? sanitizedPrevious.customerName,
      customerEmail: incoming.customerEmail ?? sanitizedPrevious.customerEmail,
    };
  }

  return {
    conversationId: incoming.conversationId ?? sanitizedPrevious.conversationId,
    customerId: incoming.customerId,
    customerName: incoming.customerName ?? sanitizedPrevious.customerName,
    customerEmail: incoming.customerEmail ?? sanitizedPrevious.customerEmail,
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
    businessId: 0,
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
