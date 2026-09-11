import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export type BusinessChatsUnreadResponse = {
  hasUnread: boolean;
  chatsLastViewedAt: string | null;
};

export async function getBusinessChatsUnread(
  businessId: number,
): Promise<BusinessChatsUnreadResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(businessId)) {
    throw new Error("Invalid business id.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/chat/business/${encodeURIComponent(String(businessId))}/unread`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load chat unread state."),
    );
  }

  return (await res.json()) as BusinessChatsUnreadResponse;
}
