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
    businessDescription?: string;
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
    idealCustomers?: string[];
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
    productsServices?: string[];
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
    businessAddress?: string;
    businessHours?: string;
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

export type EnqueueGooglePublishResponse = {
  status: "publishing";
  draftId: string;
  jobId: string;
  publishStatus: "QUEUED";
  publishStep: "queued";
  publishProgress: number;
  version: number;
  alreadyQueued: boolean;
  message: string;
};

export type GooglePublishStatus = {
  draftId: string;
  status: string;
  publishStatus: string | null;
  publishStep: string | null;
  publishProgress: number;
  jobId: string | null;
  googleBudgetId: string | null;
  googleCampaignId: string | null;
  googleAdGroupId: string | null;
  googleAdId: string | null;
  googleKeywordIds: string[];
  errorMessage: string | null;
  publishedAt: string | null;
  adsConsoleUrl: string | null;
  version: number;
};

export type PublishGoogleCampaignResult = {
  draftId: string;
  googleCampaignId: string;
  googleAdGroupId: string;
  googleAdId: string;
  publishStatus: string | null;
  adsConsoleUrl: string | null;
  message: string;
};

const PUBLISH_POLL_ATTEMPTS = 60;
const PUBLISH_POLL_MS = 2000;

export const GOOGLE_PUBLISH_PROGRESS_STEPS = [
  { key: "preparing", label: "Preparing" },
  { key: "budget", label: "Creating budget" },
  { key: "campaign", label: "Creating campaign" },
  { key: "ad_group", label: "Creating ad group" },
  { key: "keywords", label: "Adding keywords" },
  { key: "ads", label: "Creating ads" },
  { key: "done", label: "Done" },
] as const;

const PUBLISH_STEP_LABELS: Record<string, string> = {
  queued: "Preparing",
  ...Object.fromEntries(
    GOOGLE_PUBLISH_PROGRESS_STEPS.map((step) => [step.key, step.label]),
  ),
};

export function resolveGooglePublishStepIndex(
  publishStep: string | null | undefined,
): number {
  const normalized = (publishStep ?? "").toLowerCase();
  if (!normalized || normalized === "queued") return 0;
  const idx = GOOGLE_PUBLISH_PROGRESS_STEPS.findIndex(
    (step) => step.key === normalized,
  );
  return idx >= 0 ? idx : 0;
}

function isPublishSucceeded(status: GooglePublishStatus): boolean {
  const publishStatus = (status.publishStatus ?? "").toUpperCase();
  const draftStatus = (status.status ?? "").toUpperCase();
  return (
    (publishStatus === "PUBLISHED" || draftStatus === "PUBLISHED") &&
    Boolean(status.googleCampaignId) &&
    Boolean(status.googleAdGroupId) &&
    Boolean(status.googleAdId)
  );
}

function isPublishFailed(status: GooglePublishStatus): boolean {
  const publishStatus = (status.publishStatus ?? "").toUpperCase();
  const draftStatus = (status.status ?? "").toUpperCase();
  return publishStatus === "FAILED" || draftStatus === "FAILED";
}

export async function publishGoogleCampaignDraft(
  businessId: number,
  payload: { draftId: string; expectedVersion: number },
): Promise<EnqueueGooglePublishResponse> {
  const res = await authenticatedFetch(`${draftsBase(businessId)}/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await throwIfNotOk(res, "Could not publish campaign draft.");
  return res.json() as Promise<EnqueueGooglePublishResponse>;
}

export async function getGooglePublishStatus(
  businessId: number,
  draftId: string,
  timeoutMs = 15_000,
): Promise<GooglePublishStatus> {
  const res = await authenticatedFetch(
    `${draftsBase(businessId)}/${encodeURIComponent(draftId)}/publish-status`,
    { method: "GET" },
    timeoutMs,
  );
  await throwIfNotOk(res, "Could not load publish status.");
  return res.json() as Promise<GooglePublishStatus>;
}

export async function pollGooglePublishUntilDone(
  businessId: number,
  draftId: string,
  onProgress?: (status: GooglePublishStatus) => void,
): Promise<PublishGoogleCampaignResult> {
  let consecutiveFailed = 0;

  for (let i = 0; i < PUBLISH_POLL_ATTEMPTS; i += 1) {
    const status = await getGooglePublishStatus(businessId, draftId, 15_000);
    onProgress?.(status);

    if (isPublishSucceeded(status)) {
      return {
        draftId: status.draftId,
        googleCampaignId: status.googleCampaignId!,
        googleAdGroupId: status.googleAdGroupId!,
        googleAdId: status.googleAdId!,
        publishStatus: status.publishStatus,
        adsConsoleUrl: status.adsConsoleUrl,
        message: "Campaign published successfully to Google Ads (paused).",
      };
    }

    if (isPublishFailed(status)) {
      consecutiveFailed += 1;
      if (consecutiveFailed >= 4) {
        throw new Error(
          status.errorMessage?.trim() ||
            "Publish failed on Google Ads. Review the error and try again.",
        );
      }
    } else {
      consecutiveFailed = 0;
    }

    await new Promise((resolve) => setTimeout(resolve, PUBLISH_POLL_MS));
  }

  throw new Error(
    "Publish is taking longer than expected. Check Google Ads or try again.",
  );
}

export function googlePublishStepLabel(step: string | null | undefined): string {
  if (!step) return "Preparing your campaign";
  return PUBLISH_STEP_LABELS[step] ?? step;
}
