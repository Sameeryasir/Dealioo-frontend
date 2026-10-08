import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export type FunnelGuestAdSourcePoint = {
  month: string;
  meta: number;
  google: number;
};

export type FunnelGuestAdSourceBucket = {
  meta: number;
  google: number;
  other: number;
  unknown: number;
  total: number;
  data: FunnelGuestAdSourcePoint[];
};

export type FunnelGuestAdSources = FunnelGuestAdSourceBucket & {
  funnelId: number;
  payments: FunnelGuestAdSourceBucket;
  pageViews: FunnelGuestAdSourceBucket;
  /** Paid funnel_payment amounts in cents, split by guest ad_source */
  revenue: FunnelGuestAdSourceBucket;
};

function emptyBucket(): FunnelGuestAdSourceBucket {
  return {
    meta: 0,
    google: 0,
    other: 0,
    unknown: 0,
    total: 0,
    data: [],
  };
}

function parseBucket(raw: unknown): FunnelGuestAdSourceBucket {
  if (!raw || typeof raw !== "object") return emptyBucket();
  const json = raw as Partial<FunnelGuestAdSourceBucket>;
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

export async function getFunnelGuestAdSources(
  funnelId: number,
  range?: { from?: string; to?: string; timezone?: string },
): Promise<FunnelGuestAdSources> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(funnelId)) {
    throw new Error("Valid funnel id is required.");
  }

  const q = new URLSearchParams();
  if (range?.from) q.set("from", range.from);
  if (range?.to) q.set("to", range.to);
  if (range?.timezone?.trim()) q.set("timezone", range.timezone.trim());
  const query = q.toString();

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/funnel-event/funnel/${encodeURIComponent(String(funnelId))}/guest-ad-sources${
      query ? `?${query}` : ""
    }`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load guest ad sources."),
    );
  }

  const json = (await res.json()) as Partial<FunnelGuestAdSources> & {
    payments?: unknown;
    pageViews?: unknown;
    revenue?: unknown;
  };
  const signups = parseBucket(json);

  return {
    funnelId: Number(json.funnelId) || funnelId,
    ...signups,
    payments: parseBucket(json.payments),
    pageViews: parseBucket(json.pageViews),
    revenue: parseBucket(json.revenue),
  };
}
