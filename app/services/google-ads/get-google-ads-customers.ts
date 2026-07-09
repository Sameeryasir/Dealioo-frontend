import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type GoogleAdsCustomer = {
  id: string;
  name: string | null;
  currency: string | null;
  isManager: boolean;
  managerCustomerId: string | null;
  status: string | null;
};

export async function getGoogleAdsCustomers(
  restaurantId: number,
): Promise<GoogleAdsCustomer[]> {
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Business is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/google-ads/customers/${encodeURIComponent(String(restaurantId))}`,
    { method: "GET" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load Google Ads accounts."),
    );
  }

  return res.json() as Promise<GoogleAdsCustomer[]>;
}
