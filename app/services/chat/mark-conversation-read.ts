import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export async function markConversationRead(
  businessId: number,
  conversationId: number,
): Promise<{ lastReadAt: string }> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(businessId) || !isPositiveInt(conversationId)) {
    throw new Error("Valid business and conversation ids are required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/chat/business/${encodeURIComponent(String(businessId))}/conversation/${encodeURIComponent(String(conversationId))}/mark-read`,
    { method: "POST" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not mark conversation as read."),
    );
  }

  return (await res.json()) as { lastReadAt: string };
}
