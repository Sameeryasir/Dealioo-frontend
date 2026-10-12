import {
  getApiBaseUrl,
  parseApiErrorMessage,
} from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export type FunnelDashboardChartSeries = {
  meta: number;
  google: number;
  data: Array<{ month: string; meta: number; google: number }>;
};

export type FunnelDashboardCharts = {
  funnelId: number;
  uniqueVisitors: FunnelDashboardChartSeries;
  signups: FunnelDashboardChartSeries;
  payments: FunnelDashboardChartSeries;
  revenue: FunnelDashboardChartSeries;
};

function emptySeries(): FunnelDashboardChartSeries {
  return { meta: 0, google: 0, data: [] };
}

function parseSeries(raw: unknown): FunnelDashboardChartSeries {
  if (!raw || typeof raw !== "object") return emptySeries();
  const json = raw as Partial<FunnelDashboardChartSeries>;
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

export async function getFunnelDashboardCharts(
  funnelId: number,
  options: {
    from: string;
    to: string;
    timezone?: string;
  },
): Promise<FunnelDashboardCharts> {
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
    `${getApiBaseUrl()}/funnel-event/funnel/${encodeURIComponent(String(funnelId))}/dashboard-charts?${q.toString()}`,
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
        "Could not load campaign dashboard charts.",
      ),
    );
  }

  const json = (await res.json()) as Partial<FunnelDashboardCharts>;
  return {
    funnelId: Number(json.funnelId) || funnelId,
    uniqueVisitors: parseSeries(json.uniqueVisitors),
    signups: parseSeries(json.signups),
    payments: parseSeries(json.payments),
    revenue: parseSeries(json.revenue),
  };
}
