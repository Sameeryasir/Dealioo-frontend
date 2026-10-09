import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { DEFAULT_ADS_INSIGHTS_PERIOD } from "@/app/lib/ads-insights-period";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

const GOOGLE_ADS_REQUEST_TIMEOUT_MS = 60_000;

export type GoogleAdsCampaignInsight = {
  spend: string | null;
  impressions: string | null;
  clicks: string | null;
  conversions: string | null;
  conversionValue: string | null;
};

export type GoogleAdsCampaign = {
  id: string;
  name: string;
  status: string | null;
  effectiveStatus: string | null;
  budgetId?: string | null;
  dailyBudget: string | null;
  insights: GoogleAdsCampaignInsight | null;
};

export type GoogleAdsCampaignStats = {
  customerId: string | null;
  customerName: string | null;
  currency: string | null;
  datePreset: string;
  campaigns: GoogleAdsCampaign[];
  fetchedAt?: string | null;
  fromCache?: boolean;
  isStale?: boolean;
};

const inflightByKey = new Map<string, Promise<GoogleAdsCampaignStats>>();

type GoogleAdsCampaignStatsOptions = {
  refresh?: boolean;
  period?: string;
};

function statsCacheKey(
  restaurantId: number,
  options?: GoogleAdsCampaignStatsOptions,
): string {
  const period = options?.period?.trim() || DEFAULT_ADS_INSIGHTS_PERIOD;
  return `${restaurantId}:refresh=${options?.refresh ? "1" : "0"}:period=${period}`;
}

export async function getGoogleAdsCampaignStats(
  restaurantId: number,
  options?: GoogleAdsCampaignStatsOptions,
): Promise<GoogleAdsCampaignStats> {
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Business is required.");
  }

  const key = statsCacheKey(restaurantId, options);
  const existing = inflightByKey.get(key);
  if (existing) {
    return existing;
  }

  const request = fetchGoogleAdsCampaignStats(restaurantId, options).finally(
    () => {
      if (inflightByKey.get(key) === request) {
        inflightByKey.delete(key);
      }
    },
  );

  inflightByKey.set(key, request);
  return request;
}

async function fetchGoogleAdsCampaignStats(
  restaurantId: number,
  options?: GoogleAdsCampaignStatsOptions,
): Promise<GoogleAdsCampaignStats> {
  const params = new URLSearchParams();
  if (options?.refresh) {
    params.set("refresh", "1");
  }
  if (options?.period?.trim()) {
    params.set("period", options.period.trim());
  }
  const query = params.toString();
  const path = `${getApiBaseUrl()}/google-ads/ads/campaign-stats/${encodeURIComponent(String(restaurantId))}${
    query ? `?${query}` : ""
  }`;

  const res = await authenticatedFetch(
    path,
    { method: "GET" },
    GOOGLE_ADS_REQUEST_TIMEOUT_MS,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(
        res,
        "Could not load Google Ads campaign stats.",
      ),
    );
  }

  return res.json() as Promise<GoogleAdsCampaignStats>;
}
