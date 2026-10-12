import {
  getApiBaseUrl,
  parseApiErrorMessage,
} from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";
import type { FunnelAnalyticsMonthly } from "@/app/services/funnel/get-analytics-overview-monthly";
import type { FunnelStatsMonthly } from "@/app/services/funnel/get-funnel-stats-monthly";
import type { FunnelGuestAdSources } from "@/app/services/funnel-event/get-funnel-guest-ad-sources";

export type FunnelDashboardOverview = {
  funnelId: number;
  stats: FunnelStatsMonthly;
  analytics: FunnelAnalyticsMonthly;
  adSources: FunnelGuestAdSources;
  previous: {
    from: string;
    to: string;
    stats: FunnelStatsMonthly;
    analytics: FunnelAnalyticsMonthly;
  } | null;
};

function emptyAdBucket() {
  return {
    meta: 0,
    google: 0,
    other: 0,
    unknown: 0,
    total: 0,
    data: [] as Array<{ month: string; meta: number; google: number }>,
  };
}

function parseAdBucket(raw: unknown) {
  if (!raw || typeof raw !== "object") return emptyAdBucket();
  const json = raw as Partial<ReturnType<typeof emptyAdBucket>>;
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
    other: Number(json.other) || 0,
    unknown: Number(json.unknown) || 0,
    total: Number(json.total) || 0,
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

  const json = (await res.json()) as {
    funnelId?: number;
    stats?: FunnelStatsMonthly;
    analytics?: FunnelAnalyticsMonthly;
    adSources?: Partial<FunnelGuestAdSources> & {
      payments?: unknown;
      pageViews?: unknown;
      revenue?: unknown;
    };
    previous?: {
      from?: string;
      to?: string;
      stats?: FunnelStatsMonthly;
      analytics?: FunnelAnalyticsMonthly;
    } | null;
  };

  const signups = parseAdBucket(json.adSources);
  const adSources: FunnelGuestAdSources = {
    funnelId: Number(json.funnelId) || funnelId,
    ...signups,
    payments: parseAdBucket(json.adSources?.payments),
    pageViews: parseAdBucket(json.adSources?.pageViews),
    revenue: parseAdBucket(json.adSources?.revenue),
  };

  return {
    funnelId: Number(json.funnelId) || funnelId,
    stats: (json.stats ?? {
      funnelId,
      months: 0,
      currency: null,
      data: [],
    }) as FunnelStatsMonthly,
    analytics: (json.analytics ?? {
      funnelId,
      months: 0,
      data: [],
    }) as FunnelAnalyticsMonthly,
    adSources,
    previous:
      json.previous?.stats && json.previous?.analytics
        ? {
            from: String(json.previous.from ?? ""),
            to: String(json.previous.to ?? ""),
            stats: json.previous.stats,
            analytics: json.previous.analytics,
          }
        : null,
  };
}
