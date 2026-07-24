import { uploadMetaCampaignMedia } from "@/app/services/facebook/upload-meta-campaign-media";

export type UploadFacebookCampaignImageResponse = {
  imageUrl: string;
  
  imageHash?: string;
  mediaId?: string;
  metaImageUrl?: string;
};

export async function uploadFacebookCampaignImage(
  restaurantId: number,
  file: File,
  options?: { draftId?: string },
): Promise<UploadFacebookCampaignImageResponse> {
  const result = await uploadMetaCampaignMedia(restaurantId, file, {
    draftId: options?.draftId,
    mediaType: "image",
  });

  return {
    imageUrl: result.url,
    imageHash: result.imageHash,
    mediaId: result.mediaId,
    metaImageUrl: result.url,
  };
}
