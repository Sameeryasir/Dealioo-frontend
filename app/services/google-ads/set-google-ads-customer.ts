import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

const GOOGLE_ADS_REQUEST_TIMEOUT_MS = 45_000;

export async function setGoogleAdsCustomer(
  restaurantId: number,
  customerId: string,
  managerCustomerId?: string | null,
): Promise<{ googleCustomerId: string }> {
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Business is required.");
  }
  if (!customerId.trim()) {
    throw new Error("Please choose a Google Ads account.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/google-ads/customer/${encodeURIComponent(String(restaurantId))}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: customerId.trim(),
        ...(managerCustomerId?.trim()
          ? { managerCustomerId: managerCustomerId.trim() }
          : {}),
      }),
    },
    GOOGLE_ADS_REQUEST_TIMEOUT_MS,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not save Google Ads account."),
    );
  }

  return res.json() as Promise<{ googleCustomerId: string }>;
}
