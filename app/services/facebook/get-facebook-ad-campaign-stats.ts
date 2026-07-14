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

export async function getFacebookAdCampaignStats(
  restaurantId: number,
): Promise<FacebookAdCampaignStats> {
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Business is required.");
  }

  const path = `${getApiBaseUrl()}/facebook/ads/campaign-stats/${encodeURIComponent(String(restaurantId))}`;

  const res = await authenticatedFetch(path, { method: "GET" });

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load Meta ad campaign stats."),
    );
  }

  return res.json() as Promise<FacebookAdCampaignStats>;
}
