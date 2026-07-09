import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

const UPLOAD_VIDEO_TIMEOUT_MS = 120_000;

export async function uploadFacebookCampaignVideo(
  restaurantId: number,
  file: File,
): Promise<{ videoUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook-campaigns/business/${encodeURIComponent(String(restaurantId))}/ad-video`,
    {
      method: "POST",
      body: formData,
    },
    UPLOAD_VIDEO_TIMEOUT_MS,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not upload ad video."),
    );
  }

  return res.json() as Promise<{ videoUrl: string }>;
}
