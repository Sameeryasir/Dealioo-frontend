import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export async function setFacebookAdAccount(
  restaurantId: number,
  adAccountId: string,
): Promise<{ metaAdAccountId: string }> {
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Business is required.");
  }
  if (!adAccountId.trim()) {
    throw new Error("Please choose an ad account.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook/ad-account/${encodeURIComponent(String(restaurantId))}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adAccountId: adAccountId.trim() }),
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not save ad account."),
    );
  }

  return res.json() as Promise<{ metaAdAccountId: string }>;
}
