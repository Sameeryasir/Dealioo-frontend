import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";
import type { ConversationMessage } from "@/app/services/chat/get-business-conversation";

export async function sendCustomerMessage(
  restaurantId: number,
  customerId: number,
  body: string,
): Promise<ConversationMessage> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(restaurantId)) {
    throw new Error("Valid business id is required.");
  }
  if (!isPositiveInt(customerId)) {
    throw new Error("Valid customer id is required.");
  }

  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/chat/restaurant/${encodeURIComponent(String(restaurantId))}/customers/${encodeURIComponent(String(customerId))}/messages`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body: trimmed, channel: "sms" }),
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not send this message."),
    );
  }

  return (await res.json()) as ConversationMessage;
}
