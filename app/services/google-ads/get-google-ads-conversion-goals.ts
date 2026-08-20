import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

const GOOGLE_ADS_REQUEST_TIMEOUT_MS = 45_000;
const CACHE_TTL_MS = 60_000;

export type GoogleAdsConversionGoal = {
  category: string;
  origin: string;
  name: string;
  sourceLabel: string;
  actionCount: number;
  accountDefault: boolean;
};

export type GoogleAdsConversionGoalsResponse = {
  customerId: string | null;
  goals: GoogleAdsConversionGoal[];
};

const inflightByBusinessId = new Map<
  number,
  Promise<GoogleAdsConversionGoalsResponse>
>();

const cacheByBusinessId = new Map<
  number,
  { expiresAt: number; data: GoogleAdsConversionGoalsResponse }
>();

export async function getGoogleAdsConversionGoals(
  businessId: number,
): Promise<GoogleAdsConversionGoalsResponse> {
  if (!Number.isFinite(businessId) || businessId < 1) {
    throw new Error("Business is required.");
  }

  const cached = cacheByBusinessId.get(businessId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const existing = inflightByBusinessId.get(businessId);
  if (existing) {
    return existing;
  }

  const request = fetchGoogleAdsConversionGoals(businessId)
    .then((data) => {
      cacheByBusinessId.set(businessId, {
        data,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
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

async function fetchGoogleAdsConversionGoals(
  businessId: number,
): Promise<GoogleAdsConversionGoalsResponse> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/google-ads/ads/conversion-goals/${encodeURIComponent(String(businessId))}`,
    { method: "GET" },
    GOOGLE_ADS_REQUEST_TIMEOUT_MS,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(
        res,
        "Could not load Google Ads conversion goals.",
      ),
    );
  }

  return res.json() as Promise<GoogleAdsConversionGoalsResponse>;
}
