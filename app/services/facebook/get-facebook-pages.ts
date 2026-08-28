import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type FacebookPage = {
  id: string;
  name: string | null;
  pictureUrl?: string | null;
};

const inflightByBusinessId = new Map<number, Promise<FacebookPage[]>>();
const cacheByBusinessId = new Map<
  number,
  { at: number; pages: FacebookPage[] }
>();
const CACHE_TTL_MS = 30_000;

export async function getFacebookPages(
  restaurantId: number,
): Promise<FacebookPage[]> {
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Business is required.");
  }

  const cached = cacheByBusinessId.get(restaurantId);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.pages;
  }

  const existing = inflightByBusinessId.get(restaurantId);
  if (existing) {
    return existing;
  }

  const request = fetchFacebookPages(restaurantId)
    .then((pages) => {
      cacheByBusinessId.set(restaurantId, { at: Date.now(), pages });
      return pages;
    })
    .finally(() => {
      if (inflightByBusinessId.get(restaurantId) === request) {
        inflightByBusinessId.delete(restaurantId);
      }
    });

  inflightByBusinessId.set(restaurantId, request);
  return request;
}

async function fetchFacebookPages(
  restaurantId: number,
): Promise<FacebookPage[]> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook/pages/${encodeURIComponent(String(restaurantId))}`,
    { method: "GET" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load Facebook pages."),
    );
  }

  return res.json() as Promise<FacebookPage[]>;
}
