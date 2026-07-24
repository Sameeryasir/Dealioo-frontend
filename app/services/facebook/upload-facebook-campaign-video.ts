import { uploadMetaCampaignMedia } from "@/app/services/facebook/upload-meta-campaign-media";

export async function uploadFacebookCampaignVideo(
  restaurantId: number,
  file: File,
  options?: { draftId?: string },
): Promise<{ videoUrl: string; mediaId?: string }> {
  const result = await uploadMetaCampaignMedia(restaurantId, file, {
    draftId: options?.draftId,
    mediaType: "video",
  });

  return {
    videoUrl: result.url,
    mediaId: result.mediaId,
  };
}
