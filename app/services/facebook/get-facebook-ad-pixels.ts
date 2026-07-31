import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type FacebookAdPixel = {
  id: string;
  name: string | null;
};

const PIXEL_FETCH_TIMEOUT_MS = 45_000;
const PIXEL_CACHE_TTL_MS = 30_000;

const inflightByBusinessId = new Map<number, Promise<FacebookAdPixel[]>>();
const cacheByBusinessId = new Map<
  number,
  { at: number; pixels: FacebookAdPixel[] }
>();

export async function getFacebookAdPixels(
  restaurantId: number,
  options?: { forceRefresh?: boolean },
): Promise<FacebookAdPixel[]> {
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Business is required.");
  }

  if (!options?.forceRefresh) {
    const cached = cacheByBusinessId.get(restaurantId);
    if (cached && Date.now() - cached.at < PIXEL_CACHE_TTL_MS) {
      return cached.pixels;
    }

    const existing = inflightByBusinessId.get(restaurantId);
    if (existing) {
      return existing;
    }
  }

  const request = fetchFacebookAdPixels(restaurantId)
    .then((pixels) => {
      cacheByBusinessId.set(restaurantId, { at: Date.now(), pixels });
      return pixels;
    })
    .finally(() => {
      if (inflightByBusinessId.get(restaurantId) === request) {
        inflightByBusinessId.delete(restaurantId);
      }
    });

  inflightByBusinessId.set(restaurantId, request);
  return request;
}

async function fetchFacebookAdPixels(
  restaurantId: number,
): Promise<FacebookAdPixel[]> {
  const url = `${getApiBaseUrl()}/facebook/ad-pixels/${encodeURIComponent(String(restaurantId))}`;

  const res = await authenticatedFetch(
    url,
    { method: "GET" },
    PIXEL_FETCH_TIMEOUT_MS,
  );

  if (!res.ok) {
    const message = await parseApiErrorMessage(
      res,
      "Could not load Meta pixels.",
    );
    throw new Error(message);
  }

  return (await res.json()) as FacebookAdPixel[];
}
