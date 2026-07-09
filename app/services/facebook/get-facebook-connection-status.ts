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
};

export async function getFacebookConnectionStatus(
  accessToken: string,
  restaurantId: number,
): Promise<MetaConnectionStatus> {
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Business is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook/status/${encodeURIComponent(String(restaurantId))}`,
    { method: "GET" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(
        res,
        "Could not load Facebook connection status.",
      ),
    );
  }

  return res.json() as Promise<MetaConnectionStatus>;
}
