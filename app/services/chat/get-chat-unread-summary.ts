import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export type ChatUnreadSummary = {
  hasUnread: boolean;
  unreadCount: number;
  chatsLastViewedAt: string | null;
};

export async function getChatUnreadSummary(
  restaurantId: number,
): Promise<ChatUnreadSummary> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(restaurantId)) {
    throw new Error("Invalid business id.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/chat/restaurant/${encodeURIComponent(String(restaurantId))}/unread-summary`,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load chat unread summary."),
    );
  }

  return (await res.json()) as ChatUnreadSummary;
}
