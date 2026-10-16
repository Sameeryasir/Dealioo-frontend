import {
  getApiBaseUrl,
  parseApiErrorMessage,
} from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export type FunnelDropoffCounts = {
  funnelId: number;
  pageViews: number;
  landingViews: number;
  signupViews: number;
  paymentViews: number;
  signups: number;
  payments: number;
  earlierPayments: number;
};

export type FunnelDropoffStep = {
  stepName: string;
  stepOrder: number;
  count: number;
};

export async function getFunnelDropoff(
  funnelId: number,
  options: {
    from: string;
    to: string;
    timezone?: string;
  },
): Promise<FunnelDropoffCounts> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(funnelId)) {
    throw new Error("Valid funnel id is required.");
  }

  const q = new URLSearchParams();
  q.set("from", options.from);
  q.set("to", options.to);
  if (options.timezone?.trim()) {
    q.set("timezone", options.timezone.trim());
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/funnel-event/funnel/${encodeURIComponent(String(funnelId))}/dropoff?${q.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load funnel dropoff."),
    );
  }

  const json = (await res.json()) as Partial<FunnelDropoffCounts>;
  return {
    funnelId: Number(json.funnelId) || funnelId,
    pageViews: Number(json.pageViews) || 0,
    landingViews: Number(json.landingViews) || 0,
    signupViews: Number(json.signupViews) || 0,
    paymentViews: Number(json.paymentViews) || 0,
    signups: Number(json.signups) || 0,
    payments: Number(json.payments) || 0,
    earlierPayments: Number(json.earlierPayments) || 0,
  };
}
