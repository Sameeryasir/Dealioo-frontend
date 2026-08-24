import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type BusinessTracking = {
  id: string;
  businessId: number;
  pixelId: string | null;
  googleTagManagerId: string | null;
  googleAdsSignupConversionLabel: string | null;
  googleAdsPurchaseConversionLabel: string | null;
  googleAdsLeadConversionLabel: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  hasAccessToken: boolean;
};

export type UpsertBusinessTrackingInput = {
  pixelId?: string;
  googleTagManagerId?: string;
  googleAdsSignupConversionLabel?: string;
  googleAdsPurchaseConversionLabel?: string;
  googleAdsLeadConversionLabel?: string;
  isActive?: boolean;
  accessToken?: string;
};

const TRACKING_CACHE_TTL_MS = 30_000;

const inflightByBusinessId = new Map<number, Promise<BusinessTracking | null>>();
const cacheByBusinessId = new Map<
  number,
  { at: number; data: BusinessTracking | null }
>();

function setTrackingCache(businessId: number, data: BusinessTracking | null) {
  cacheByBusinessId.set(businessId, { at: Date.now(), data });
}

export async function getBusinessTracking(
  businessId: number,
  options?: { forceRefresh?: boolean },
): Promise<BusinessTracking | null> {
  if (!Number.isFinite(businessId) || businessId < 1) {
    throw new Error("Business is required.");
  }

  if (!options?.forceRefresh) {
    const cached = cacheByBusinessId.get(businessId);
    if (cached && Date.now() - cached.at < TRACKING_CACHE_TTL_MS) {
      return cached.data;
    }

    const existing = inflightByBusinessId.get(businessId);
    if (existing) {
      return existing;
    }
  }

  const request = fetchBusinessTracking(businessId)
    .then((data) => {
      setTrackingCache(businessId, data);
      return data;
    })
    .finally(() => {
      if (inflightByBusinessId.get(businessId) === request) {
        inflightByBusinessId.delete(businessId);
      }
    });

  inflightByBusinessId.set(businessId, request);
  return request;
}

async function fetchBusinessTracking(
  businessId: number,
): Promise<BusinessTracking | null> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/business-tracking/${encodeURIComponent(String(businessId))}`,
    {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    },
    20_000,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load ads tracking settings."),
    );
  }

  return (await res.json()) as BusinessTracking | null;
}

export async function saveBusinessTracking(
  businessId: number,
  body: UpsertBusinessTrackingInput,
): Promise<BusinessTracking> {
  if (!Number.isFinite(businessId) || businessId < 1) {
    throw new Error("Business is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/business-tracking/${encodeURIComponent(String(businessId))}`,
    {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
    20_000,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not save ads tracking settings."),
    );
  }

  const saved = (await res.json()) as BusinessTracking;
  setTrackingCache(businessId, saved);
  return saved;
}
