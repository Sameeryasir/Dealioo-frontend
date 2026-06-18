import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export async function deleteFacebookCampaign(
  restaurantId: number,
  metaCampaignId: string,
): Promise<{ deleted: true; metaCampaignId: string }> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook-campaigns/restaurant/${encodeURIComponent(String(restaurantId))}/meta/${encodeURIComponent(metaCampaignId)}`,
    { method: "DELETE" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not delete Facebook campaign."),
    );
  }

  return res.json() as Promise<{ deleted: true; metaCampaignId: string }>;
}
