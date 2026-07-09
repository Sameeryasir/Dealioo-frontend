import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type FacebookAdAccount = {
  id: string;
  accountId: string | null;
  name: string | null;
  accountStatus: number | null;
  currency: string | null;
};

export async function getFacebookAdAccounts(
  restaurantId: number,
): Promise<FacebookAdAccount[]> {
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Business is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook/ad-accounts/${encodeURIComponent(String(restaurantId))}`,
    { method: "GET" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load Facebook ad accounts."),
    );
  }

  return res.json() as Promise<FacebookAdAccount[]>;
}
