import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type GoogleTagManagerContainer = {
  id: string;
  name: string | null;
  accountId: string | null;
  containerId: string | null;
};

const GTM_FETCH_TIMEOUT_MS = 45_000;
const GTM_CACHE_TTL_MS = 30_000;

const inflightByBusinessId = new Map<
  number,
  Promise<GoogleTagManagerContainer[]>
>();
const cacheByBusinessId = new Map<
  number,
  { at: number; containers: GoogleTagManagerContainer[] }
>();

export async function getGoogleTagManagerContainers(
  businessId: number,
  options?: { forceRefresh?: boolean },
): Promise<GoogleTagManagerContainer[]> {
  if (!Number.isFinite(businessId) || businessId < 1) {
    throw new Error("Business is required.");
  }

  if (!options?.forceRefresh) {
    const cached = cacheByBusinessId.get(businessId);
    if (cached && Date.now() - cached.at < GTM_CACHE_TTL_MS) {
      return cached.containers;
    }

    const existing = inflightByBusinessId.get(businessId);
    if (existing) {
      return existing;
    }
  }

  const request = fetchGoogleTagManagerContainers(businessId)
    .then((containers) => {
      cacheByBusinessId.set(businessId, { at: Date.now(), containers });
      return containers;
    })
    .finally(() => {
      if (inflightByBusinessId.get(businessId) === request) {
        inflightByBusinessId.delete(businessId);
      }
    });

  inflightByBusinessId.set(businessId, request);
  return request;
}

async function fetchGoogleTagManagerContainers(
  businessId: number,
): Promise<GoogleTagManagerContainer[]> {
  const url = `${getApiBaseUrl()}/google-ads/gtm-containers/${encodeURIComponent(String(businessId))}`;

  const res = await authenticatedFetch(
    url,
    { method: "GET" },
    GTM_FETCH_TIMEOUT_MS,
  );

  if (!res.ok) {
    const message = await parseApiErrorMessage(
      res,
      "Could not load Google Tag Manager containers.",
    );
    throw new Error(message);
  }

  return (await res.json()) as GoogleTagManagerContainer[];
}
