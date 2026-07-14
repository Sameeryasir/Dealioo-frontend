import {
  getApiBaseUrl,
  parseApiErrorMessage,
} from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export type FunnelAnalyticsOverview = {
  funnelId: number;
  pageViews: number;
  buttonClicks: number;
  uniqueVisitors: number;
  checkoutOpens: number;
};

export async function getAnalyticsOverview(
  funnelId: number,
): Promise<FunnelAnalyticsOverview> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(funnelId)) {
    throw new Error("Valid funnel id is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/funnel-event/funnel/${encodeURIComponent(String(funnelId))}/analytics-overview`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load analytics overview."),
    );
  }

  return (await res.json()) as FunnelAnalyticsOverview;
}
