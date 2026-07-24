import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type FacebookAdCampaignInsight = {
  spend: string | null;
  impressions: string | null;
  reach: string | null;
  clicks: string | null;
};

export type FacebookAdCampaign = {
  id: string;
  name: string;
  status: string | null;
  effectiveStatus: string | null;
  dailyBudget: string | null;
  insights: FacebookAdCampaignInsight | null;
};

export type FacebookAdCampaignStats = {
  adAccountName: string | null;
  currency: string | null;
  datePreset: string;
  campaigns: FacebookAdCampaign[];
};

const FACEBOOK_CAMPAIGN_STATS_TIMEOUT_MS = 45_000;

export async function getFacebookAdCampaignStats(
  restaurantId: number,
  options?: {
    includeInsights?: boolean;
    refresh?: boolean;
  },
): Promise<FacebookAdCampaignStats> {
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Business is required.");
  }

  const params = new URLSearchParams();
  if (options?.includeInsights === false) {
    params.set("insights", "0");
  }
  if (options?.refresh) {
    params.set("refresh", "1");
  }

  const query = params.toString();
  const path = `${getApiBaseUrl()}/facebook/ads/campaign-stats/${encodeURIComponent(String(restaurantId))}${
    query ? `?${query}` : ""
  }`;

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
