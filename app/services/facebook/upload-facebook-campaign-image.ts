import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

const UPLOAD_FACEBOOK_CAMPAIGN_IMAGE_TIMEOUT_MS = 60_000;

export async function uploadFacebookCampaignImage(
  restaurantId: number,
  file: File,
): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook-campaigns/business/${encodeURIComponent(String(restaurantId))}/ad-image`,
    {
      method: "POST",
      body: formData,
    },
    UPLOAD_FACEBOOK_CAMPAIGN_IMAGE_TIMEOUT_MS,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not upload ad image."),
    );
  }

  return res.json() as Promise<{ imageUrl: string }>;
}
