import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type UpdateGoogleAdsCampaignInput = {
  name?: string;
  status?: "ENABLED" | "PAUSED";
  dailyBudget?: number;
};

export type UpdateGoogleAdsCampaignResult = {
  updated: true;
  googleCampaignId: string;
  name: string | null;
  status: string | null;
  dailyBudget: string | null;
};

export async function updateGoogleAdsCampaign(
  restaurantId: number,
  googleCampaignId: string,
  input: UpdateGoogleAdsCampaignInput,
): Promise<UpdateGoogleAdsCampaignResult> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/google-ads/ads/campaigns/${encodeURIComponent(String(restaurantId))}/${encodeURIComponent(googleCampaignId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(
        res,
        "Could not update Google Ads campaign.",
      ),
    );
  }

  return res.json() as Promise<UpdateGoogleAdsCampaignResult>;
}

export async function updateGoogleAdsCampaignStatus(
  restaurantId: number,
  googleCampaignId: string,
  status: "ENABLED" | "PAUSED",
): Promise<{
  updated: true;
  googleCampaignId: string;
  status: "ENABLED" | "PAUSED";
}> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/google-ads/ads/campaigns/${encodeURIComponent(String(restaurantId))}/${encodeURIComponent(googleCampaignId)}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(
        res,
        "Could not update Google Ads campaign status.",
      ),
    );
  }

  return res.json() as Promise<{
    updated: true;
    googleCampaignId: string;
    status: "ENABLED" | "PAUSED";
  }>;
}

export async function updateGoogleAdsCampaignBudget(
  restaurantId: number,
  googleCampaignId: string,
  dailyBudget: number,
): Promise<{
  updated: true;
  googleCampaignId: string;
  dailyBudget: string;
}> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/google-ads/ads/campaigns/${encodeURIComponent(String(restaurantId))}/${encodeURIComponent(googleCampaignId)}/budget`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dailyBudget }),
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(
        res,
        "Could not update Google Ads campaign budget.",
      ),
    );
  }

  return res.json() as Promise<{
    updated: true;
    googleCampaignId: string;
    dailyBudget: string;
  }>;
}
