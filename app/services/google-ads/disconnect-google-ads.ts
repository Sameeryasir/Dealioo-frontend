import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type DisconnectGoogleAdsResponse = {
  disconnected: true;
};

export async function disconnectGoogleAds(
  accessToken: string,
  restaurantId: number,
): Promise<DisconnectGoogleAdsResponse> {
  if (!accessToken.trim()) {
    throw new Error("You're signed out. Sign in again to disconnect Google Ads.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/google-ads/disconnect/${encodeURIComponent(String(restaurantId))}`,
    { method: "POST" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not disconnect Google Ads."),
    );
  }

  return res.json() as Promise<DisconnectGoogleAdsResponse>;
}
