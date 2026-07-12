import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type CancelUserSubscriptionResponse = {
  cancelled: true;
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

export async function cancelUserSubscription(): Promise<CancelUserSubscriptionResponse> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/user-subscriptions/cancel`,
    {
      method: "POST",
      headers: { Accept: "application/json" },
    },
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
