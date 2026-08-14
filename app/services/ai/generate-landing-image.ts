import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

const GENERATE_LANDING_IMAGE_TIMEOUT_MS = 120_000;
const CLEAR_LANDING_IMAGE_TIMEOUT_MS = 30_000;

export type GenerateLandingImageRequest = {
  prompt: string;
  businessId?: number;
  campaignId?: number;
  funnelId?: number;
};

export type GenerateLandingImageResponse = {
  success: boolean;
  imageUrl: string;
  mimeType: string;
  promptUsed: string;
  message?: string;
  schema?: Record<string, unknown>;
};

export type ClearLandingImageRequest = {
  businessId?: number;
  campaignId?: number;
  funnelId?: number;
};

export type ClearLandingImageResponse = {
  success: boolean;
  imageUrl: string;
  message?: string;
  schema?: Record<string, unknown>;
};

export async function generateLandingImageWithAi(
  body: GenerateLandingImageRequest,
): Promise<GenerateLandingImageResponse> {
  const prompt = body.prompt?.trim() ?? "";
  if (prompt.length < 3) {
    throw new Error("Describe the landing image you want (at least a few words).");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/ai/landing-image/generate`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        ...(body.businessId != null ? { businessId: body.businessId } : {}),
        ...(body.campaignId != null ? { campaignId: body.campaignId } : {}),
        ...(body.funnelId != null && body.funnelId >= 1
          ? { funnelId: body.funnelId }
          : {}),
      }),
    },
    GENERATE_LANDING_IMAGE_TIMEOUT_MS,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not generate a landing image."),
    );
  }

  return (await res.json()) as GenerateLandingImageResponse;
}

export async function clearLandingImageWithAi(
  body: ClearLandingImageRequest,
): Promise<ClearLandingImageResponse> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/ai/landing-image/clear`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...(body.businessId != null ? { businessId: body.businessId } : {}),
        ...(body.campaignId != null ? { campaignId: body.campaignId } : {}),
        ...(body.funnelId != null && body.funnelId >= 1
          ? { funnelId: body.funnelId }
          : {}),
      }),
    },
    CLEAR_LANDING_IMAGE_TIMEOUT_MS,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not remove the landing image."),
    );
  }

  return (await res.json()) as ClearLandingImageResponse;
}
