import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type UpgradeUserSubscriptionInput = {
  planSlug: string;
  billingCycle: "monthly" | "annual";
};

export type UpgradeUserSubscriptionResult = {
  success: true;
  subscriptionId: string;
  customerId: string | null;
  oldPriceId: string;
  newPriceId: string;
  status: string;
  latestInvoice: string | null;
  paymentIntentClientSecret: string | null;
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

export async function upgradeUserSubscription(
  input: UpgradeUserSubscriptionInput,
): Promise<UpgradeUserSubscriptionResult> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/billing/upgrade`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        planSlug: input.planSlug,
        billingCycle: input.billingCycle,
      }),
    },
    60_000,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiMessageFromResponse(
        res,
        "Could not upgrade your subscription.",
      ),
    );
  }

  const data: unknown = await res.json();
  if (!data || typeof data !== "object" || (data as { success?: unknown }).success !== true) {
    throw new Error("Could not upgrade your subscription.");
  }

  const row = data as Record<string, unknown>;
  return {
    success: true,
    subscriptionId:
      typeof row.subscriptionId === "string" ? row.subscriptionId : "",
    customerId: typeof row.customerId === "string" ? row.customerId : null,
    oldPriceId: typeof row.oldPriceId === "string" ? row.oldPriceId : "",
    newPriceId: typeof row.newPriceId === "string" ? row.newPriceId : "",
    status: typeof row.status === "string" ? row.status : "",
    latestInvoice:
      typeof row.latestInvoice === "string" ? row.latestInvoice : null,
    paymentIntentClientSecret:
      typeof row.paymentIntentClientSecret === "string"
        ? row.paymentIntentClientSecret
        : null,
  };
}
