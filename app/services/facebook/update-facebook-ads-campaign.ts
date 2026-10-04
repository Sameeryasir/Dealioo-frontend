import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type UpdateFacebookAdsCampaignInput = {
  name?: string;
  status?: "ACTIVE" | "PAUSED";
  dailyBudget?: number;
};

export type UpdateFacebookAdsCampaignResult = {
  updated: true;
  metaCampaignId: string;
  name: string | null;
  status: string | null;
  dailyBudget: string | null;
};

export async function updateFacebookAdsCampaign(
  restaurantId: number,
  metaCampaignId: string,
  input: UpdateFacebookAdsCampaignInput,
): Promise<UpdateFacebookAdsCampaignResult> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook-campaigns/business/${encodeURIComponent(String(restaurantId))}/meta/${encodeURIComponent(metaCampaignId)}`,
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
        "Could not update Meta Ads campaign.",
      ),
    );
  }

  return res.json() as Promise<UpdateFacebookAdsCampaignResult>;
}

export async function updateFacebookAdsCampaignStatus(
  restaurantId: number,
  metaCampaignId: string,
  status: "ACTIVE" | "PAUSED",
): Promise<{
  updated: true;
  metaCampaignId: string;
  status: "ACTIVE" | "PAUSED";
}> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook-campaigns/business/${encodeURIComponent(String(restaurantId))}/meta/${encodeURIComponent(metaCampaignId)}/status`,
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
        "Could not update Meta Ads campaign status.",
      ),
    );
  }

  return res.json() as Promise<{
    updated: true;
    metaCampaignId: string;
    status: "ACTIVE" | "PAUSED";
  }>;
}
