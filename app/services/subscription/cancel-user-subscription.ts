import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type CancelUserSubscriptionInput = {
  reason: string;
  comment?: string;
};

export type CancelUserSubscriptionResponse = {
  success: true;
  alreadyScheduled?: boolean;
  subscriptionStatus: string;
  cancelAtPeriodEnd: boolean;
  cancellationDate: string | null;
};

async function parseApiMessageFromResponse(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const data: unknown = await res.json();
    if (data && typeof data === "object" && "message" in data) {
      return parseApiMessage(
        (data as { message: unknown }).message,
        fallback,
      );
    }
  } catch {
  }
  return fallback;
}

export async function cancelUserSubscription(
  input: CancelUserSubscriptionInput = { reason: "user_requested" },
): Promise<CancelUserSubscriptionResponse> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/user-subscriptions/cancel`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: input.reason.trim() || "user_requested",
        ...(input.comment?.trim()
          ? { comment: input.comment.trim() }
          : {}),
      }),
    },
    60_000,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiMessageFromResponse(
        res,
        "Could not cancel your subscription.",
      ),
    );
  }

  return res.json() as Promise<CancelUserSubscriptionResponse>;
}
