import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";
import type { ConversationMessageKind, ConversationMessage } from "@/app/services/chat/get-business-conversation";

export const RESTAURANT_CHAT_PAGE_SIZE = 20;

export type ChatCustomer = {
  conversationId: number;
  customerId: number;
  customerName: string | null;
  customerEmail: string | null;
  messageCount: number;
  lastMessagePreview: string;
  lastMessageChannel: ConversationMessageKind;
  lastMessageAt: string;
  lastAutomationName: string | null;
  createdAt: string;
};

export type PaginatedChatCustomersResponse = {
  data: ChatCustomer[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type SyncChatCustomersResponse = {
  data: ChatCustomer[];
};

export type SyncChatMessagesThread = {
  conversationId: number;
  customerId: number;
  messages: ConversationMessage[];
};

export type SyncChatMessagesResponse = {
  data: SyncChatMessagesThread[];
};

export async function getRestaurantChatCustomers(
  restaurantId: number,
  options: { page?: number; limit?: number } = {},
): Promise<PaginatedChatCustomersResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(restaurantId)) {
    throw new Error("Valid business id is required.");
  }

  const q = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? RESTAURANT_CHAT_PAGE_SIZE),
  });

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/chat/business/${encodeURIComponent(String(restaurantId))}/conversation?${q.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(
        res,
        "Could not load guest conversations.",
      ),
    );
  }

  return (await res.json()) as PaginatedChatCustomersResponse;
}

export async function syncRestaurantChatCustomers(
  restaurantId: number,
  afterConversationId: number,
): Promise<SyncChatCustomersResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(restaurantId)) {
    throw new Error("Valid business id is required.");
  }
  if (!isPositiveInt(afterConversationId)) {
    throw new Error("Valid after conversation id is required.");
  }

  const q = new URLSearchParams({
    afterConversationId: String(afterConversationId),
  });

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/chat/business/${encodeURIComponent(String(restaurantId))}/conversation/sync?${q.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(
        res,
        "Could not sync guest conversations.",
      ),
    );
  }

  return (await res.json()) as SyncChatCustomersResponse;
}

export async function syncBusinessChatMessages(
  restaurantId: number,
  afterMessageId: number,
): Promise<SyncChatMessagesResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(restaurantId)) {
    throw new Error("Valid business id is required.");
  }
  if (!Number.isFinite(afterMessageId) || afterMessageId < 0) {
    throw new Error("Valid after message id is required.");
  }

  const q = new URLSearchParams({
    afterMessageId: String(afterMessageId),
  });

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/chat/business/${encodeURIComponent(String(restaurantId))}/messages/sync?${q.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not sync chat messages."),
    );
  }

  return (await res.json()) as SyncChatMessagesResponse;
}
