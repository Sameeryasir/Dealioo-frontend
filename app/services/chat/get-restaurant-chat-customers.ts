import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";
import type { ConversationMessageKind } from "@/app/services/chat/get-restaurant-conversation";

export const RESTAURANT_CHAT_PAGE_SIZE = 20;

export type ChatCustomer = {
  customerId: number;
  customerName: string | null;
  customerEmail: string | null;
  messageCount: number;
  lastMessagePreview: string;
  lastMessageChannel: ConversationMessageKind;
  lastMessageAt: string;
  lastAutomationName: string | null;
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

export async function getRestaurantChatCustomers(
  restaurantId: number,
  options: { page?: number; limit?: number } = {},
): Promise<PaginatedChatCustomersResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(restaurantId)) {
    throw new Error("Valid restaurant id is required.");
  }

  const q = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? RESTAURANT_CHAT_PAGE_SIZE),
  });

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/chat/restaurant/${encodeURIComponent(String(restaurantId))}/customers?${q.toString()}`,
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
