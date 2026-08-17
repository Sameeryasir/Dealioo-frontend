import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type StripeConnectionStatus = {
  connected: boolean;
  status?: string | null;
};

const inflightByBusinessId = new Map<number, Promise<StripeConnectionStatus>>();

export async function getStripeConnectionStatus(
  _accessToken: string,
  restaurantId: number,
): Promise<StripeConnectionStatus> {
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Business is required.");
  }

  const existing = inflightByBusinessId.get(restaurantId);
  if (existing) {
    return existing;
  }

  const request = fetchStripeConnectionStatus(restaurantId).finally(() => {
    if (inflightByBusinessId.get(restaurantId) === request) {
      inflightByBusinessId.delete(restaurantId);
    }
  });

  inflightByBusinessId.set(restaurantId, request);
  return request;
}

async function fetchStripeConnectionStatus(
  restaurantId: number,
): Promise<StripeConnectionStatus> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/stripe/status/${encodeURIComponent(String(restaurantId))}`,
    { method: "GET" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(
        res,
        "Could not load Stripe connection status.",
      ),
    );
  }

  return res.json() as Promise<StripeConnectionStatus>;
}
