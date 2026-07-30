import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export type CustomerActivityType =
  | "ONLINE_SIGNUP"
  | "ONLINE_PURCHASE"
  | "IN_STORE_PURCHASE"
  | "REDEMPTION"
  | "REFUND";

export type CustomerActivityTimelineItem = {
  id: string;
  activityType: CustomerActivityType | string;
  label: string;
  source: string;
  amount: number | null;
  currency: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
};

export type CustomerTimelineResponse = {
  customerId: number;
  businessId: number;
  timeline: CustomerActivityTimelineItem[];
};

export async function getCustomerTimeline(params: {
  businessId: number;
  customerId: number;
  campaignId?: number | null;
}): Promise<CustomerTimelineResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(params.businessId) || !isPositiveInt(params.customerId)) {
    throw new Error("Valid business and customer ids are required.");
  }

  const q = new URLSearchParams();
  if (params.campaignId != null && isPositiveInt(params.campaignId)) {
    q.set("campaignId", String(params.campaignId));
  }

  const query = q.toString();
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/activity/business/${encodeURIComponent(String(params.businessId))}/customers/${encodeURIComponent(String(params.customerId))}/timeline${query ? `?${query}` : ""}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load customer timeline."),
    );
  }

  return (await res.json()) as CustomerTimelineResponse;
}

export function customerActivityLabel(
  activityType: string,
  fallback?: string | null,
): string {
  if (fallback?.trim()) return fallback.trim();
  switch (activityType) {
    case "ONLINE_SIGNUP":
      return "Signed up for deal";
    case "ONLINE_PURCHASE":
      return "Purchased online";
    case "IN_STORE_PURCHASE":
      return "Purchased in store";
    case "REDEMPTION":
      return "Redeemed coupon";
    case "REFUND":
      return "Refund";
    default:
      return activityType.replaceAll("_", " ").toLowerCase();
  }
}
