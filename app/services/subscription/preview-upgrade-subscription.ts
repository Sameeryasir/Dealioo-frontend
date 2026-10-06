import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type PreviewUpgradeSubscriptionInput = {
  planSlug: string;
  billingCycle: "monthly" | "annual";
};

export type PreviewUpgradeSubscriptionResult = {
  currentPlanName: string;
  currentPlanSlug: string;
  currentBillingCycle: "monthly" | "annual";
  targetPlanName: string;
  targetPlanSlug: string;
  targetBillingCycle: "monthly" | "annual";
  oldPriceId: string;
  newPriceId: string;
  amountDueCents: number;
  amountDueFormatted: string;
  currency: string;
  prorationDate: number;
  summary: string;
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

export async function previewUpgradeSubscription(
  input: PreviewUpgradeSubscriptionInput,
): Promise<PreviewUpgradeSubscriptionResult> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/billing/upgrade-preview`,
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
        "Could not preview this plan change.",
      ),
    );
  }

  const data: unknown = await res.json();
  const row =
    data && typeof data === "object" ? (data as Record<string, unknown>) : null;
  if (!row || typeof row.summary !== "string") {
    throw new Error("Could not preview this plan change.");
  }

  return {
    currentPlanName:
      typeof row.currentPlanName === "string" ? row.currentPlanName : "",
    currentPlanSlug:
      typeof row.currentPlanSlug === "string" ? row.currentPlanSlug : "",
    currentBillingCycle:
      row.currentBillingCycle === "annual" ? "annual" : "monthly",
    targetPlanName:
      typeof row.targetPlanName === "string" ? row.targetPlanName : "",
    targetPlanSlug:
      typeof row.targetPlanSlug === "string" ? row.targetPlanSlug : "",
    targetBillingCycle:
      row.targetBillingCycle === "annual" ? "annual" : "monthly",
    oldPriceId: typeof row.oldPriceId === "string" ? row.oldPriceId : "",
    newPriceId: typeof row.newPriceId === "string" ? row.newPriceId : "",
    amountDueCents:
      typeof row.amountDueCents === "number" ? row.amountDueCents : 0,
    amountDueFormatted:
      typeof row.amountDueFormatted === "string"
        ? row.amountDueFormatted
        : "$0.00",
    currency: typeof row.currency === "string" ? row.currency : "usd",
    prorationDate:
      typeof row.prorationDate === "number" ? row.prorationDate : 0,
    summary: row.summary,
  };
}
