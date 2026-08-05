import { authAxios } from "@/app/lib/auth-axios";

export type ClaimFacebookAttributionPayload = {
  fbclid?: string | null;
  fbc?: string | null;
  fbp?: string | null;
  landingUrl?: string | null;
  source?: string;
};

export type FacebookAttributionResponse = {
  hasAttribution: boolean;
  fbclid: string | null;
  fbc: string | null;
  fbp: string | null;
  capturedAt: string | null;
  source: string | null;
  landingUrl: string | null;
};

export type ClaimFacebookAttributionResult = {
  claimed: boolean;
  alreadyHad: boolean;
  attribution: FacebookAttributionResponse;
};

export async function claimProductMetaAttribution(
  payload: ClaimFacebookAttributionPayload,
): Promise<ClaimFacebookAttributionResult> {
  const { data } = await authAxios.post<ClaimFacebookAttributionResult>(
    "/product-meta-tracking/attribution/claim",
    {
      fbclid: payload.fbclid || undefined,
      fbc: payload.fbc || undefined,
      fbp: payload.fbp || undefined,
      landingUrl: payload.landingUrl || undefined,
      source: payload.source ?? "anonymous_browser_claim",
    },
  );
  return data;
}

export async function fetchProductMetaAttribution(): Promise<FacebookAttributionResponse> {
  const { data } = await authAxios.get<FacebookAttributionResponse>(
    "/product-meta-tracking/attribution",
  );
  return data;
}
