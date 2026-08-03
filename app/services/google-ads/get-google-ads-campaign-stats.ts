import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

const GOOGLE_ADS_REQUEST_TIMEOUT_MS = 45_000;

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

const inflightByBusinessId = new Map<number, Promise<GoogleAdsCampaignStats>>();

export async function getGoogleAdsCampaignStats(
  restaurantId: number,
): Promise<GoogleAdsCampaignStats> {
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Business is required.");
  }

  const existing = inflightByBusinessId.get(restaurantId);
  if (existing) {
    return existing;
  }

  const request = fetchGoogleAdsCampaignStats(restaurantId).finally(() => {
    if (inflightByBusinessId.get(restaurantId) === request) {
      inflightByBusinessId.delete(restaurantId);
    }
  });

  inflightByBusinessId.set(restaurantId, request);
  return request;
}

async function fetchGoogleAdsCampaignStats(
  restaurantId: number,
): Promise<GoogleAdsCampaignStats> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/google-ads/ads/campaign-stats/${encodeURIComponent(String(restaurantId))}`,
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
