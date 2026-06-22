import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type GoogleAdsConnectionStatus = {
  connected: boolean;
  status?: string | null;
  googleUserId: string | null;
  googleConnectedAt: string | null;
  googleCustomerId: string | null;
  googleTokenExpiresAt?: string | null;
  googleOauthScopes?: string[];
  missingRequiredScopes?: string[];
};

export async function getGoogleAdsConnectionStatus(
  accessToken: string,
  restaurantId: number,
): Promise<GoogleAdsConnectionStatus> {
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Restaurant is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/google-ads/status/${encodeURIComponent(String(restaurantId))}`,
    { method: "GET" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(
        res,
        "Could not load Google Ads connection status.",
      ),
    );
  }

  return res.json() as Promise<GoogleAdsConnectionStatus>;
}
