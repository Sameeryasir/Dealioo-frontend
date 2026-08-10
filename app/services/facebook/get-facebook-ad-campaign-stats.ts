import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type FacebookAdCampaignAction = {
  actionType: string;
  value: string;
};

export type FacebookAdCampaignInsight = {
  spend: string | null;
  impressions: string | null;
  reach: string | null;
  clicks: string | null;
  ctr: string | null;
  cpc: string | null;
  cpm: string | null;
  frequency: string | null;
  actions: FacebookAdCampaignAction[] | null;
  costPerActionType: FacebookAdCampaignAction[] | null;
};

export type FacebookAdCampaign = {
  id: string;
  name: string;
  status: string | null;
  effectiveStatus: string | null;
  dailyBudget: string | null;
  imageUrl?: string | null;
  insights: FacebookAdCampaignInsight | null;
  dailyInsights?: FacebookAdDailyInsight[] | null;
};

export type FacebookAdDailyInsight = {
  date: string;
  spend: string | null;
  impressions: string | null;
  clicks: string | null;
};

export type FacebookAdBreakdownRow = {
  key: string;
  impressions: string | null;
  spend: string | null;
};

export type FacebookAdInsightBreakdowns = {
  age: FacebookAdBreakdownRow[];
  device: FacebookAdBreakdownRow[];
  placement: FacebookAdBreakdownRow[];
  country: FacebookAdBreakdownRow[];
};

export type FacebookAdCampaignStatsSummary = {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  activeCampaigns: number;
  totalCampaigns: number;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  frequency: number | null;
  primaryActionType: string | null;
  primaryActionValue: string | null;
  costPerResult: number | null;
};

export type FacebookAdCampaignPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  query: string | null;
};

export type FacebookAdCampaignStats = {
  adAccountName: string | null;
  currency: string | null;
  datePreset: string;
  campaigns: FacebookAdCampaign[];
  dailyInsights?: FacebookAdDailyInsight[];
  breakdowns?: FacebookAdInsightBreakdowns | null;
  fetchedAt?: string | null;
  fromCache?: boolean;
  isStale?: boolean;
  summary?: FacebookAdCampaignStatsSummary | null;
  pagination?: FacebookAdCampaignPagination | null;
};

const FACEBOOK_CAMPAIGN_STATS_TIMEOUT_MS = 45_000;
export const META_CAMPAIGN_PAGE_SIZE = 4;

const inflightByKey = new Map<string, Promise<FacebookAdCampaignStats>>();

function statsCacheKey(
  restaurantId: number,
  options?: {
    includeInsights?: boolean;
    refresh?: boolean;
    page?: number;
    pageSize?: number;
    query?: string;
  },
): string {
  const insights = options?.includeInsights === false ? "0" : "1";
  const refresh = options?.refresh ? "1" : "0";
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? META_CAMPAIGN_PAGE_SIZE;
  const query = options?.query?.trim() ?? "";
  return `${restaurantId}:insights=${insights}:refresh=${refresh}:page=${page}:size=${pageSize}:q=${query}`;
}

export async function getFacebookAdCampaignStats(
  restaurantId: number,
  options?: {
    includeInsights?: boolean;
    refresh?: boolean;
    page?: number;
    pageSize?: number;
    query?: string;
  },
): Promise<FacebookAdCampaignStats> {
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Business is required.");
  }

  const key = statsCacheKey(restaurantId, options);
  const existing = inflightByKey.get(key);
  if (existing) {
    return existing;
  }

  const request = fetchFacebookAdCampaignStats(restaurantId, options).finally(
    () => {
      if (inflightByKey.get(key) === request) {
        inflightByKey.delete(key);
      }
    },
  );

  inflightByKey.set(key, request);
  return request;
}

async function fetchFacebookAdCampaignStats(
  restaurantId: number,
  options?: {
    includeInsights?: boolean;
    refresh?: boolean;
    page?: number;
    pageSize?: number;
    query?: string;
  },
): Promise<FacebookAdCampaignStats> {
  const params = new URLSearchParams();
  if (options?.includeInsights === false) {
    params.set("insights", "0");
  }
  if (options?.refresh) {
    params.set("refresh", "1");
  }
  params.set("page", String(options?.page ?? 1));
  params.set(
    "pageSize",
    String(options?.pageSize ?? META_CAMPAIGN_PAGE_SIZE),
  );
  if (options?.query?.trim()) {
    params.set("q", options.query.trim());
  }

  const query = params.toString();
  const path = `${getApiBaseUrl()}/facebook/ads/campaign-stats/${encodeURIComponent(String(restaurantId))}?${query}`;

  const res = await authenticatedFetch(
    path,
    { method: "GET" },
    FACEBOOK_CAMPAIGN_STATS_TIMEOUT_MS,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load Meta ad campaign stats."),
    );
  }

  return res.json() as Promise<FacebookAdCampaignStats>;
}
