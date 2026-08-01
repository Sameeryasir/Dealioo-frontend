import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import type {
  AdCreativeDraft,
  AgeRangeId,
  CampaignGoalId,
  GenderId,
  GoogleAdsLocationRef,
  GoogleCampaignBuilderDraft,
  KeywordMatchType,
  LeadContactMethodId,
  PresenceOptionId,
  RadiusUnitId,
  SalesChannelId,
  SitelinkDraft,
  SuggestedKeyword,
  TrafficActionId,
} from "@/app/components/google-ads/campaign-builder/types";

export const DRAFT_CONFLICT_MESSAGE =
  "This draft has been modified elsewhere. Please refresh.";

export class GoogleDraftConflictError extends Error {
  readonly status = 409;
  readonly currentVersion?: number;

  constructor(message: string, currentVersion?: number) {
    super(message);
    this.name = "GoogleDraftConflictError";
    this.currentVersion = currentVersion;
  }
}

export type GoogleCampaignStepSaveResponse = {
  id: string;
  businessId: number;
  currentStep: number;
  completedSteps: number[];
  version: number;
  lastSavedAt: string | null;
  goal?: CampaignGoalId;
  campaignName?: string | null;
  businessName?: string | null;
  websiteUrl?: string;
  businessCategory?: string;
  logoFileName?: string;
};

export type GoogleCampaignDraftResumeResponse = {
  id: string;
  businessId: number;
  status: string;
  currentStep: number;
  completedSteps: number[];
  version: number;
  lastSavedAt: string | null;
  campaignName: string | null;
  goal: CampaignGoalId | null;
  draftData: Partial<GoogleCampaignBuilderDraft> | null;
};

function draftsBase(businessId: number): string {
  return `${getApiBaseUrl()}/google-ads/business/${encodeURIComponent(String(businessId))}/drafts`;
}

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `idem_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function throwIfNotOk(res: Response, fallback: string): Promise<void> {
  if (res.ok) return;
  if (res.status === 409) {
    let currentVersion: number | undefined;
    try {
      const body = (await res.json()) as {
        message?: string;
        currentVersion?: number;
      };
      currentVersion = body.currentVersion;
      throw new GoogleDraftConflictError(
        body.message || DRAFT_CONFLICT_MESSAGE,
        currentVersion,
      );
    } catch (err) {
      if (err instanceof GoogleDraftConflictError) throw err;
      throw new GoogleDraftConflictError(DRAFT_CONFLICT_MESSAGE);
    }
  }
  throw new Error(await parseApiErrorMessage(res, fallback));
}

async function postDraftStep<TPayload extends Record<string, unknown>>(
  businessId: number,
  path: string,
  payload: TPayload,
  fallbackError: string,
): Promise<GoogleCampaignStepSaveResponse> {
  if (!Number.isFinite(businessId) || businessId < 1) {
    throw new Error("Business is required.");
  }

  const res = await authenticatedFetch(`${draftsBase(businessId)}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": createIdempotencyKey(),
    },
    body: JSON.stringify(payload),
  });

  await throwIfNotOk(res, fallbackError);
  return res.json() as Promise<GoogleCampaignStepSaveResponse>;
}

export async function saveGoogleGoalStep(
  businessId: number,
  payload: {
    goal: CampaignGoalId;
    draftId?: string;
    expectedVersion?: number;
  },
): Promise<GoogleCampaignStepSaveResponse> {
  if (!payload.goal) throw new Error("Marketing goal is required.");
  return postDraftStep(
    businessId,
    "goal-step",
    {
      goal: payload.goal,
      draftId: payload.draftId?.trim() || undefined,
      expectedVersion: payload.draftId ? payload.expectedVersion : undefined,
    },
    "Could not save marketing goal.",
  );
}

export async function saveGoogleGoalDetailsStep(
  businessId: number,
  payload: {
    draftId: string;
    expectedVersion: number;
    salesChannel?: SalesChannelId | null;
    websiteUrl?: string;
    businessLocation?: string;
    businessPhone?: string;
    leadContactMethods?: LeadContactMethodId[];
    landingPageUrl?: string;
    trafficAction?: TrafficActionId | null;
    businessName?: string;
    businessCategory?: string;
    businessAddress?: string;
    businessHours?: string;
    appName?: string;
    goalDetailSubstep?: number;
  },
) {
  return postDraftStep(
    businessId,
    "goal-details-step",
    {
      ...payload,
      salesChannel: payload.salesChannel ?? undefined,
      trafficAction: payload.trafficAction ?? undefined,
    },
    "Could not save goal details.",
  );
}

export async function saveGoogleCampaignInfoStep(
  businessId: number,
  payload: {
    draftId: string;
    expectedVersion: number;
    campaignName: string;
    businessName: string;
    websiteUrl?: string;
    businessCategory?: string;
    logoFileName?: string;
    logoPreviewUrl?: string;
    extensionBusinessName?: string;
  },
) {
  return postDraftStep(
    businessId,
    "campaign-info-step",
    {
      ...payload,
      logoPreviewUrl: payload.logoPreviewUrl?.startsWith("blob:")
        ? undefined
        : payload.logoPreviewUrl,
    },
    "Could not save campaign info.",
  );
}

export function saveGoogleBudgetStep(
  businessId: number,
  payload: {
    draftId: string;
    expectedVersion: number;
    dailyBudget: number;
    startDate?: string;
    endDate?: string;
  },
) {
  return postDraftStep(
    businessId,
    "budget-step",
    payload,
    "Could not save budget.",
  );
}

export function saveGoogleLocationsStep(
  businessId: number,
  payload: {
    draftId: string;
    expectedVersion: number;
    targetLocations: GoogleAdsLocationRef[];
    excludedLocationTargets?: GoogleAdsLocationRef[];
    countries?: string[];
    regions?: string[];
    cities?: string[];
    excludedLocations?: string[];
    radiusEnabled?: boolean;
    radiusCenter?: GoogleAdsLocationRef | null;
    radiusLat?: number | null;
    radiusLng?: number | null;
    radiusValue?: number;
    radiusUnit?: RadiusUnitId;
    radiusTargeting?: string;
    presenceOption?: PresenceOptionId;
  },
) {
  return postDraftStep(
    businessId,
    "locations-step",
    payload,
    "Could not save locations.",
  );
}

export function saveGoogleLanguagesStep(
  businessId: number,
  payload: {
    draftId: string;
    expectedVersion: number;
    languages: string[];
  },
) {
  return postDraftStep(
    businessId,
    "languages-step",
    payload,
    "Could not save languages.",
  );
}

export function saveGoogleAudienceStep(
  businessId: number,
  payload: {
    draftId: string;
    expectedVersion: number;
    ageRanges: AgeRangeId[];
    gender?: GenderId;
    householdIncome?: string;
    interests?: string[];
  },
) {
  return postDraftStep(
    businessId,
    "audience-step",
    payload,
    "Could not save audience.",
  );
}

export function saveGoogleKeywordsStep(
  businessId: number,
  payload: {
    draftId: string;
    expectedVersion: number;
    businessType: string;
    suggestedKeywords?: SuggestedKeyword[];
    customKeywords?: string[];
    negativeKeywords?: string[];
    keywordMatchType?: KeywordMatchType;
  },
) {
  return postDraftStep(
    businessId,
    "keywords-step",
    payload,
    "Could not save keywords.",
  );
}

export function saveGoogleAdsStep(
  businessId: number,
  payload: {
    draftId: string;
    expectedVersion: number;
    ads: AdCreativeDraft[];
    adsGenerated?: boolean;
  },
) {
  return postDraftStep(businessId, "ads-step", payload, "Could not save ads.");
}

export function saveGoogleExtrasStep(
  businessId: number,
  payload: {
    draftId: string;
    expectedVersion: number;
    extensionBusinessName?: string;
    phoneNumber?: string;
    callouts?: string[];
    structuredSnippetHeader?: string;
    structuredSnippetValues?: string[];
    useLocationExtension?: boolean;
    sitelinks?: SitelinkDraft[];
    assetsGenerated?: boolean;
  },
) {
  return postDraftStep(
    businessId,
    "extras-step",
    payload,
    "Could not save extras.",
  );
}

export async function getGoogleCampaignDraft(
  businessId: number,
  draftId: string,
): Promise<GoogleCampaignDraftResumeResponse> {
  const res = await authenticatedFetch(
    `${draftsBase(businessId)}/${encodeURIComponent(draftId.trim())}`,
    { method: "GET" },
  );
  await throwIfNotOk(res, "Could not load campaign draft.");
  return res.json() as Promise<GoogleCampaignDraftResumeResponse>;
}

export async function updateGoogleDraftProgress(
  businessId: number,
  draftId: string,
  payload: {
    expectedVersion: number;
    currentStep: number;
    goalDetailSubstep?: number;
  },
): Promise<{ id: string; currentStep: number; lastSavedAt: string | null; version?: number }> {
  const res = await authenticatedFetch(
    `${draftsBase(businessId)}/${encodeURIComponent(draftId.trim())}/progress`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": createIdempotencyKey(),
      },
      body: JSON.stringify(payload),
      keepalive: true,
    },
  );
  await throwIfNotOk(res, "Could not save draft progress.");
  return res.json() as Promise<{
    id: string;
    currentStep: number;
    lastSavedAt: string | null;
    version?: number;
  }>;
}

export async function publishGoogleCampaignDraft(
  businessId: number,
  payload: { draftId: string; expectedVersion: number },
): Promise<{
  draftId: string;
  status: string;
  version: number;
  message: string;
}> {
  const res = await authenticatedFetch(`${draftsBase(businessId)}/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await throwIfNotOk(res, "Could not publish campaign draft.");
  return res.json() as Promise<{
    draftId: string;
    status: string;
    version: number;
    message: string;
  }>;
}
