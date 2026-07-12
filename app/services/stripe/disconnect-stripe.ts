import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type DisconnectStripeResponse = {
  disconnected: true;
};

export async function disconnectStripe(
  accessToken: string,
  businessId: number,
): Promise<DisconnectStripeResponse> {
  if (!accessToken.trim()) {
    throw new Error("You're signed out. Sign in again to remove Stripe.");
  }
  if (!Number.isFinite(businessId) || businessId < 1) {
    throw new Error("Business is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/stripe/disconnect/${encodeURIComponent(String(businessId))}`,
    { method: "POST" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not remove Stripe account."),
    );
  }

  return res.json() as Promise<DisconnectStripeResponse>;
}
