import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type MetaConnectionStatus = {
  connected: boolean;
  status?: string | null;
  metaUserId: string | null;
  metaConnectedAt: string | null;
  metaAdAccountId: string | null;
  metaTokenExpiresAt?: string | null;
  metaOauthScopes?: string[];
  missingRequiredScopes?: string[];
  requestedScopes?: string[];
  requiredScopes?: string[];
};

const inflightByBusinessId = new Map<number, Promise<MetaConnectionStatus>>();

export async function getFacebookConnectionStatus(
  _accessToken: string,
  restaurantId: number,
): Promise<MetaConnectionStatus> {
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Business is required.");
  }

  const existing = inflightByBusinessId.get(restaurantId);
  if (existing) {
    return existing;
  }

  const request = fetchFacebookConnectionStatus(restaurantId).finally(() => {
    if (inflightByBusinessId.get(restaurantId) === request) {
      inflightByBusinessId.delete(restaurantId);
    }
  });

  inflightByBusinessId.set(restaurantId, request);
  return request;
}

async function fetchFacebookConnectionStatus(
  restaurantId: number,
): Promise<MetaConnectionStatus> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook/status/${encodeURIComponent(String(restaurantId))}`,
    { method: "GET" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(
        res,
        "Could not load Meta connection status.",
      ),
    );
  }

  return res.json() as Promise<MetaConnectionStatus>;
}
