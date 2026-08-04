import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type FacebookAdAccount = {
  id: string;
  accountId: string | null;
  name: string | null;
  accountStatus: number | null;
  currency: string | null;
};

const inflightByBusinessId = new Map<number, Promise<FacebookAdAccount[]>>();
const cacheByBusinessId = new Map<
  number,
  { at: number; accounts: FacebookAdAccount[] }
>();
const CACHE_TTL_MS = 60_000;

export async function getFacebookAdAccounts(
  restaurantId: number,
): Promise<FacebookAdAccount[]> {
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Business is required.");
  }

  const cached = cacheByBusinessId.get(restaurantId);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.accounts;
  }

  const existing = inflightByBusinessId.get(restaurantId);
  if (existing) {
    return existing;
  }

  const request = fetchFacebookAdAccounts(restaurantId)
    .then((accounts) => {
      cacheByBusinessId.set(restaurantId, { at: Date.now(), accounts });
      return accounts;
    })
    .finally(() => {
      if (inflightByBusinessId.get(restaurantId) === request) {
        inflightByBusinessId.delete(restaurantId);
      }
    });

  inflightByBusinessId.set(restaurantId, request);
  return request;
}

async function fetchFacebookAdAccounts(
  restaurantId: number,
): Promise<FacebookAdAccount[]> {
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
