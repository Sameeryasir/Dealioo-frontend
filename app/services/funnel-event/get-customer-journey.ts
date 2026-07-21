import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export type CustomerJourneyStepId = "signup" | "payment" | "qr_redeemed";

export type CustomerJourneyStepState = "complete" | "current" | "pending";

export type CustomerJourneyStep = {
  step: CustomerJourneyStepId;
  label: string;
  state: CustomerJourneyStepState;
  occurredAt: string | null;
  source: string | null;
};

export type CustomerJourneyResponse = {
  customerId: number;
  campaignId: number;
  funnelId: number | null;
  steps: CustomerJourneyStep[];
  lastUpdatedAt: string | null;
};

export async function getCustomerJourney(params: {
  businessId: number;
  customerId: number;
  campaignId: number;
  funnelId?: number | null;
  funnelPaymentId?: number | null;
}): Promise<CustomerJourneyResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (
    !isPositiveInt(params.businessId) ||
    !isPositiveInt(params.customerId) ||
    !isPositiveInt(params.campaignId)
  ) {
    throw new Error("Valid business, customer, and campaign ids are required.");
  }

  const q = new URLSearchParams({
    campaignId: String(params.campaignId),
  });
  if (params.funnelId != null && isPositiveInt(params.funnelId)) {
    q.set("funnelId", String(params.funnelId));
  }
  if (params.funnelPaymentId != null && isPositiveInt(params.funnelPaymentId)) {
    q.set("funnelPaymentId", String(params.funnelPaymentId));
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/funnel-event/business/${encodeURIComponent(String(params.businessId))}/customers/${encodeURIComponent(String(params.customerId))}/journey?${q.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load customer journey."),
    );
  }

  return (await res.json()) as CustomerJourneyResponse;
}
