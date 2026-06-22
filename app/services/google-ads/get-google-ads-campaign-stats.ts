import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type GoogleAdsCampaignInsight = {
  spend: string | null;
  impressions: string | null;
  clicks: string | null;
  conversions: string | null;
};

export type GoogleAdsCampaign = {
  id: string;
  name: string;
  status: string | null;
  effectiveStatus: string | null;
  dailyBudget: string | null;
  insights: GoogleAdsCampaignInsight | null;
};

export type GoogleAdsCampaignStats = {
  customerId: string | null;
  customerName: string | null;
  currency: string | null;
  datePreset: string;
  campaigns: GoogleAdsCampaign[];
};

export async function getGoogleAdsCampaignStats(
  restaurantId: number,
): Promise<GoogleAdsCampaignStats> {
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Restaurant is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/google-ads/ads/campaign-stats/${encodeURIComponent(String(restaurantId))}`,
    { method: "GET" },
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
