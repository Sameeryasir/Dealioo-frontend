import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type GoogleAdsConnectionStatus = {
  connected: boolean;
  status?: string | null;
  googleUserId: string | null;
  googleConnectedAt: string | null;
  googleTokenExpiresAt?: string | null;
  googleOauthScopes?: string[];
  missingRequiredScopes?: string[];
};

export function isGoogleAdsCustomerSelected(
  status?: string | null,
): boolean {
  const value = (status ?? "").toUpperCase();
  return (
    value === "CUSTOMER_SELECTED" ||
    value === "ACTIVE" ||
    value === "SYNCING"
  );
}

const inflightByBusinessId = new Map<
  number,
  Promise<GoogleAdsConnectionStatus>
>();

export async function getGoogleAdsConnectionStatus(
  _accessToken: string,
  restaurantId: number,
): Promise<GoogleAdsConnectionStatus> {
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Business is required.");
  }

  const existing = inflightByBusinessId.get(restaurantId);
  if (existing) {
    return existing;
  }

  const request = fetchGoogleAdsConnectionStatus(restaurantId).finally(() => {
    if (inflightByBusinessId.get(restaurantId) === request) {
      inflightByBusinessId.delete(restaurantId);
    }
  });

  inflightByBusinessId.set(restaurantId, request);
  return request;
}

async function fetchGoogleAdsConnectionStatus(
  restaurantId: number,
): Promise<GoogleAdsConnectionStatus> {
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
