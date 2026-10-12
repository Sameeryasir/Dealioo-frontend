import {
  getApiBaseUrl,
  parseApiErrorMessage,
} from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";
import type { FunnelDashboardCharts } from "@/app/services/funnel/get-funnel-dashboard-charts";
import type { FunnelDashboardKpis } from "@/app/services/funnel/get-funnel-dashboard-kpis";

export type FunnelDashboardOverview = FunnelDashboardKpis & {
  charts: Omit<FunnelDashboardCharts, "funnelId">;
};

function emptyChartSeries() {
  return { meta: 0, google: 0, data: [] as Array<{ month: string; meta: number; google: number }> };
}

function parseChartSeries(raw: unknown) {
  if (!raw || typeof raw !== "object") return emptyChartSeries();
  const json = raw as Partial<ReturnType<typeof emptyChartSeries>>;
  const data = Array.isArray(json.data)
    ? json.data.map((row) => ({
        month: String(row?.month ?? ""),
        meta: Number(row?.meta) || 0,
        google: Number(row?.google) || 0,
      }))
    : [];
  return {
    meta: Number(json.meta) || 0,
    google: Number(json.google) || 0,
    data,
  };
}

export async function getFunnelDashboardOverview(
  funnelId: number,
  options: {
    from: string;
    to: string;
    previousFrom?: string;
    previousTo?: string;
    timezone?: string;
  },
): Promise<FunnelDashboardOverview> {
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
    `${getApiBaseUrl()}/funnel-event/funnel/${encodeURIComponent(String(funnelId))}/dashboard-overview?${q.toString()}`,
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
        "Could not load campaign dashboard overview.",
      ),
    );
  }

  const json = (await res.json()) as Partial<FunnelDashboardOverview> & {
    charts?: Partial<FunnelDashboardOverview["charts"]>;
  };

  return {
    funnelId: Number(json.funnelId) || funnelId,
    currency: json.currency ?? null,
    signups: Number(json.signups) || 0,
    payments: Number(json.payments) || 0,
    revenue: Number(json.revenue) || 0,
    uniqueVisitors: Number(json.uniqueVisitors) || 0,
    adSources: {
      meta: Number(json.adSources?.meta) || 0,
      google: Number(json.adSources?.google) || 0,
      payments: {
        meta: Number(json.adSources?.payments?.meta) || 0,
        google: Number(json.adSources?.payments?.google) || 0,
      },
      revenue: {
        meta: Number(json.adSources?.revenue?.meta) || 0,
        google: Number(json.adSources?.revenue?.google) || 0,
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
    charts: {
      signups: parseChartSeries(json.charts?.signups),
      payments: parseChartSeries(json.charts?.payments),
      revenue: parseChartSeries(json.charts?.revenue),
    },
  };
}
