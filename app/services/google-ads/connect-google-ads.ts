import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type GoogleAdsConnectResponse = {
  url: string;
};

export async function connectGoogleAds(
  accessToken: string,
  restaurantId: number,
): Promise<GoogleAdsConnectResponse> {
  if (!accessToken.trim()) {
    throw new Error("You're signed out. Sign in again to connect Google Ads.");
  }
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Business is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/google-ads/connect/${encodeURIComponent(String(restaurantId))}`,
    { method: "POST" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not start Google Ads connection."),
    );
  }

  const body = (await res.json()) as GoogleAdsConnectResponse;
  if (!body.url?.trim()) {
    throw new Error("Google connect URL was not returned by the server.");
  }

  return body;
}
