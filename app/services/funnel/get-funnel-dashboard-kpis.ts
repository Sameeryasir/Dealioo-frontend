import {
  getApiBaseUrl,
  parseApiErrorMessage,
} from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export type FunnelDashboardKpis = {
  funnelId: number;
  currency: string | null;
  signups: number;
  payments: number;
  revenue: number;
  uniqueVisitors: number;
  newVisitors: number;
  repeatVisitors: number;
  adSources: {
    meta: number;
    google: number;
    uniqueVisitors: { meta: number; google: number; inStore: number };
    payments: { meta: number; google: number; inStore: number };
    revenue: { meta: number; google: number; inStore: number };
  };
  previous: {
    from: string;
    to: string;
    signups: number;
    payments: number;
    revenue: number;
    uniqueVisitors: number;
  } | null;
};

export async function getFunnelDashboardKpis(
  funnelId: number,
  options: {
    from: string;
    to: string;
    previousFrom?: string;
    previousTo?: string;
    timezone?: string;
  },
): Promise<FunnelDashboardKpis> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(funnelId)) {
    throw new Error("Valid funnel id is required.");
  }

  const q = new URLSearchParams();
  q.set("from", options.from);
  q.set("to", options.to);
  if (options.previousFrom?.trim() && options.previousTo?.trim()) {
    q.set("previousFrom", options.previousFrom.trim());
    q.set("previousTo", options.previousTo.trim());
  }
  if (options.timezone?.trim()) {
    q.set("timezone", options.timezone.trim());
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/funnel-event/funnel/${encodeURIComponent(String(funnelId))}/dashboard-kpis?${q.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
    45_000,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(
        res,
        "Could not load campaign dashboard KPIs.",
      ),
    );
  }

  const json = (await res.json()) as Partial<FunnelDashboardKpis>;
  return {
    funnelId: Number(json.funnelId) || funnelId,
    currency: json.currency ?? null,
    signups: Number(json.signups) || 0,
    payments: Number(json.payments) || 0,
    revenue: Number(json.revenue) || 0,
    uniqueVisitors: Number(json.uniqueVisitors) || 0,
    newVisitors: Number(json.newVisitors) || 0,
    repeatVisitors: Number(json.repeatVisitors) || 0,
    adSources: {
      meta: Number(json.adSources?.meta) || 0,
      google: Number(json.adSources?.google) || 0,
      uniqueVisitors: {
        meta: Number(json.adSources?.uniqueVisitors?.meta) || 0,
        google: Number(json.adSources?.uniqueVisitors?.google) || 0,
        inStore: Number(json.adSources?.uniqueVisitors?.inStore) || 0,
      },
      payments: {
        meta: Number(json.adSources?.payments?.meta) || 0,
        google: Number(json.adSources?.payments?.google) || 0,
        inStore: Number(json.adSources?.payments?.inStore) || 0,
      },
      revenue: {
        meta: Number(json.adSources?.revenue?.meta) || 0,
        google: Number(json.adSources?.revenue?.google) || 0,
        inStore: Number(json.adSources?.revenue?.inStore) || 0,
      },
    },
    previous:
      json.previous &&
      typeof json.previous === "object" &&
      json.previous.from != null &&
      json.previous.to != null
        ? {
            from: String(json.previous.from),
            to: String(json.previous.to),
            signups: Number(json.previous.signups) || 0,
            payments: Number(json.previous.payments) || 0,
            revenue: Number(json.previous.revenue) || 0,
            uniqueVisitors: Number(json.previous.uniqueVisitors) || 0,
          }
        : null,
  };
}
