import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";

export type CreateCampaignPayload = {
  restaurantId: number;
  campaignName: string;
  websiteUrl: string;
  image: File;
  offer: string;
  price: number;
};

/** Reads `id` from common POST /campaign/create JSON shapes so we can deep-link after create. */
export function extractCampaignIdFromCreateResponse(
  body: unknown,
): number | undefined {
  if (!body || typeof body !== "object") return undefined;
  const o = body as Record<string, unknown>;
  if (typeof o.id === "number" && Number.isFinite(o.id) && o.id >= 1) {
    return o.id;
  }
  const data = o.data;
  if (data && typeof data === "object") {
    const id = (data as Record<string, unknown>).id;
    if (typeof id === "number" && Number.isFinite(id) && id >= 1) return id;
  }
  return undefined;
}

export async function createCampaign(
  accessToken: string,
  payload: CreateCampaignPayload,
): Promise<unknown> {
  if (!accessToken.trim()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!Number.isFinite(payload.restaurantId) || payload.restaurantId < 1) {
    throw new Error("Restaurant is required.");
  }
  if (!payload.campaignName.trim()) {
    throw new Error("Campaign name is required.");
  }
  if (!payload.websiteUrl.trim()) {
    throw new Error("Website URL is required.");
  }
  if (!(payload.image instanceof File)) {
    throw new Error("Image file is required.");
  }
  if (!payload.offer.trim()) {
    throw new Error("Offer is required.");
  }
  if (!Number.isFinite(payload.price)) {
    throw new Error("Price is required.");
  }

  const form = new FormData();
  form.append("restaurantId", String(payload.restaurantId));
  form.append("campaignName", payload.campaignName.trim());
  form.append("websiteUrl", payload.websiteUrl.trim());
  form.append("image", payload.image, payload.image.name);
  form.append("offer", payload.offer.trim());
  form.append("price", String(payload.price));

  const res = await fetch(`${getApiBaseUrl()}/campaign/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!res.ok) {
    throw new Error(await parseApiErrorMessage(res, "Could not create campaign."));
  }

  return res.json() as Promise<unknown>;
}
