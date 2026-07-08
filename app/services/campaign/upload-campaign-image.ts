import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

const UPLOAD_CAMPAIGN_IMAGE_TIMEOUT_MS = 60_000;

export async function uploadCampaignImage(
  file: File,
): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/campaign/upload-image`,
    {
      method: "POST",
      body: formData,
    },
    UPLOAD_CAMPAIGN_IMAGE_TIMEOUT_MS,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not upload image."),
    );
  }

  return res.json() as Promise<{ imageUrl: string }>;
}
