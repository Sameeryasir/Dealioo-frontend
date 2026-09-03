import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type UpdateCampaignPayload = {
  campaignId: number;
  campaignName: string;
  websiteUrl: string;
  offer: string;
  description: string;
  price: number;
  image?: File | null;
};

export async function updateCampaign(
  payload: UpdateCampaignPayload,
): Promise<unknown> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!Number.isFinite(payload.campaignId) || payload.campaignId < 1) {
    throw new Error("Campaign id is required.");
  }
  if (!payload.campaignName.trim()) {
    throw new Error("Campaign name is required.");
  }
  if (!payload.websiteUrl.trim()) {
    throw new Error("Website URL is required.");
  }
  if (!payload.offer.trim()) {
    throw new Error("Offer is required.");
  }
  if (!payload.description.trim()) {
    throw new Error("Description is required.");
  }
  if (!Number.isFinite(payload.price)) {
    throw new Error("Price is required.");
  }

  const form = new FormData();
  form.append("campaignName", payload.campaignName.trim());
  form.append("websiteUrl", payload.websiteUrl.trim());
  form.append("offer", payload.offer.trim());
  form.append("description", payload.description.trim());
  form.append("price", String(payload.price));
  if (payload.image instanceof File) {
    form.append("image", payload.image, payload.image.name);
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/campaign/${encodeURIComponent(String(payload.campaignId))}`,
    {
      method: "PATCH",
      body: form,
    },
  );

  if (!res.ok) {
    throw new Error(await parseApiErrorMessage(res, "Could not update campaign."));
  }

  return res.json() as Promise<unknown>;
}
