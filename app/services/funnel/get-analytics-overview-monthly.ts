import {
  getApiBaseUrl,
  parseApiErrorMessage,
} from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export type FunnelAnalyticsMonthlyPoint = {
  month: string;
  pageViews: number;
  buttonClicks: number;
  uniqueVisitors: number;
  checkoutOpens: number;
};

export type FunnelAnalyticsMonthly = {
  funnelId: number;
  months: number;
  data: FunnelAnalyticsMonthlyPoint[];
};

export async function getAnalyticsOverviewMonthly(
  funnelId: number,
  months = 6,
): Promise<FunnelAnalyticsMonthly> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(funnelId)) {
    throw new Error("Valid funnel id is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/funnel-event/funnel/${encodeURIComponent(String(funnelId))}/analytics-overview/monthly?months=${encodeURIComponent(String(months))}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(
        res,
        "Could not load monthly behavior analytics.",
      ),
    );
  }

  return (await res.json()) as FunnelAnalyticsMonthly;
}
