import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export async function markRestaurantChatsRead(
  restaurantId: number,
): Promise<{ chatsLastViewedAt: string }> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(restaurantId)) {
    throw new Error("Invalid business id.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/chat/restaurant/${encodeURIComponent(String(restaurantId))}/mark-read`,
    { method: "POST" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not mark chats as read."),
    );
  }

  return (await res.json()) as { chatsLastViewedAt: string };
}
