import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export async function deleteGoogleAdsCampaign(
  restaurantId: number,
  googleCampaignId: string,
): Promise<{ deleted: true; googleCampaignId: string }> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/google-ads/ads/campaigns/${encodeURIComponent(String(restaurantId))}/${encodeURIComponent(googleCampaignId)}`,
    { method: "DELETE" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not delete Google Ads campaign."),
    );
  }

  return res.json() as Promise<{ deleted: true; googleCampaignId: string }>;
}
