import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

const UPLOAD_FACEBOOK_CAMPAIGN_IMAGE_TIMEOUT_MS = 60_000;

export type UploadFacebookCampaignImageResponse = {
  imageUrl: string;
  imageHash: string;
  metaImageUrl?: string;
};

export async function uploadFacebookCampaignImage(
  restaurantId: number,
  file: File,
): Promise<UploadFacebookCampaignImageResponse> {
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

  const json = (await res.json()) as UploadFacebookCampaignImageResponse;
  if (!json.imageUrl?.trim() || !json.imageHash?.trim()) {
    throw new Error("Meta did not return an image hash for this upload.");
  }

  return json;
}
