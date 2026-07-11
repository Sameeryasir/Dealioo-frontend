import {
  API_REQUEST_TIMEOUT_MS,
  getApiBaseUrl,
  parseApiErrorMessage,
} from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isValidOfferPrice, parseOfferPrice } from "@/app/lib/campaign-form";

/** Image uploads can exceed the default 5s API timeout. */
const CREATE_CAMPAIGN_TIMEOUT_MS = Math.max(API_REQUEST_TIMEOUT_MS, 120_000);

export type CreateCampaignPayload = {
  businessId: number;
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
  payload: CreateCampaignPayload,
): Promise<unknown> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  const id = payload.businessId;
  if (!Number.isFinite(id) || id == null || id < 1) {
    throw new Error("Business is required.");
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
  if (!isValidOfferPrice(String(payload.price))) {
    throw new Error("Enter a valid price.");
  }
  const price = parseOfferPrice(String(payload.price));
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Price is required.");
  }

  const form = new FormData();
  form.append("businessId", String(id));
  form.append("campaignName", payload.campaignName.trim());
  form.append("websiteUrl", payload.websiteUrl.trim());
  form.append("image", payload.image, payload.image.name);
  form.append("offer", payload.offer.trim());
  form.append("price", String(price));

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/campaign/create`,
    {
      method: "POST",
      body: form,
    },
    CREATE_CAMPAIGN_TIMEOUT_MS,
  );

  if (!res.ok) {
    throw new Error(await parseApiErrorMessage(res, "Could not create campaign."));
  }

  return res.json() as Promise<unknown>;
}
