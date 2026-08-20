import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

const GOOGLE_ADS_REQUEST_TIMEOUT_MS = 45_000;

export type GoogleAdsBusinessProfile = {
  customerId: string | null;
  businessName: string | null;
  businessCategory: string | null;
  websiteUrl: string | null;
};

/**
 * Change summary: loads business name from connected Google Ads.
 * Why: Campaign information prefills business name from Ads (phone reverted).
 * Related: GET /google-ads/ads/business-profile/:businessId
 */
export async function getGoogleAdsBusinessProfile(
  businessId: number,
  _options?: { force?: boolean },
): Promise<GoogleAdsBusinessProfile> {
  if (!Number.isFinite(businessId) || businessId < 1) {
    throw new Error("Business is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/google-ads/ads/business-profile/${encodeURIComponent(String(businessId))}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    },
    GOOGLE_ADS_REQUEST_TIMEOUT_MS,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(
        res,
        "Could not load Google Ads business profile.",
      ),
    );
  }

  return res.json() as Promise<GoogleAdsBusinessProfile>;
}
