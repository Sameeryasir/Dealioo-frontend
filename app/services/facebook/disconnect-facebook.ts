import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type DisconnectFacebookResponse = {
  disconnected: true;
};

export async function disconnectFacebook(
  accessToken: string,
  restaurantId: number,
): Promise<DisconnectFacebookResponse> {
  if (!accessToken.trim()) {
    throw new Error("You're signed out. Sign in again to disconnect Facebook.");
  }
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Business is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook/disconnect/${encodeURIComponent(String(restaurantId))}`,
    { method: "POST" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not remove Facebook account."),
    );
  }

  return res.json() as Promise<DisconnectFacebookResponse>;
}
