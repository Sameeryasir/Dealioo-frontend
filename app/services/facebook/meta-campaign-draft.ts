import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import type {
  AdCreativeStepData,
  AdSetStepData,
  CampaignStepData,
  MetaCampaignDraft,
  SaveAdSetStepPayload,
  SaveCampaignStepPayload,
} from "@/app/lib/meta-campaign-builder-types";
import { buildMetaAdsManagerUrl } from "@/app/lib/meta-campaign-builder-types";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { getFacebookConnectionStatus } from "@/app/services/facebook/get-facebook-connection-status";

const PUBLISH_POLL_ATTEMPTS = 60;
const PUBLISH_POLL_DELAY_MS = 2_000;

export type EnqueueMetaPublishResult = {
  jobId: string;
  draftId: string;
  status: string;
  publishStatus: string;
  message: string;
};

export type MetaPublishAttempt = {
  id: string;
  step: string;
  status: string;
  metaId: string | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
};

export type MetaPublishStatus = {
  draftId: string;
  status: string;
  publishStatus: string | null;
  publishStep: string | null;
  publishProgress: number;
  jobId: string | null;
  metaCampaignId: string | null;
  metaAdsetId: string | null;
  metaCreativeId: string | null;
  metaAdId: string | null;
  errorMessage: string | null;
  publishedAt: string | null;
  attempts: MetaPublishAttempt[];
};

export type AutosaveMetaCampaignDraftPayload = {
  expectedVersion: number;
  currentStep?: number;
  completedSteps?: number[];
  campaignData?: CampaignStepData | Record<string, unknown>;
  adSetData?: AdSetStepData | Record<string, unknown>;
  adCreativeData?: AdCreativeStepData | Record<string, unknown>;
};

export type PublishMetaCampaignResult = {
  draftId: string;
  trackingId: string;
  metaCampaignId: string;
  metaAdsetId: string;
  metaCreativeId: string;
  metaAdId: string;
  status: string;
  adsManagerUrl: string;
  message: string;
  publishStatus?: string | null;
  errorMessage?: string | null;
};

export class MetaDraftConflictError extends Error {
  readonly status = 409;
  readonly currentVersion?: number;

  constructor(message: string, currentVersion?: number) {
    super(message);
    this.name = "MetaDraftConflictError";
    this.currentVersion = currentVersion;
  }
}

function draftsBase(businessId: number): string {
  return `${getApiBaseUrl()}/facebook-campaigns/business/${encodeURIComponent(String(businessId))}/drafts`;
}

function isPublishSucceeded(params: {
  publishStatus?: string | null;
  status?: string | null;
  metaCampaignId?: string | null;
  metaAdsetId?: string | null;
  metaCreativeId?: string | null;
  metaAdId?: string | null;
}): boolean {
  if (
    !params.metaCampaignId ||
    !params.metaAdsetId ||
    !params.metaCreativeId ||
    !params.metaAdId
  ) {
    return false;
  }

  const publishStatus = (params.publishStatus ?? "").toUpperCase();
  const status = (params.status ?? "").toLowerCase();
  return publishStatus === "PUBLISHED" || status === "published";
}

function isPublishFailed(params: {
  publishStatus?: string | null;
  status?: string | null;
}): boolean {
  const publishStatus = (params.publishStatus ?? "").toUpperCase();
  const status = (params.status ?? "").toLowerCase();
  return publishStatus === "FAILED" || status === "failed";
}

function mapStatusToDraftProgress(
  status: MetaPublishStatus,
): MetaCampaignDraft {
  return {
    id: status.draftId,
    businessId: 0,
    currentStep: 4,
    status: status.status,
    campaignData: null,
    adSetData: null,
    adCreativeData: null,
    metaCampaignId: status.metaCampaignId,
    metaAdsetId: status.metaAdsetId,
    metaCreativeId: status.metaCreativeId,
    metaAdId: status.metaAdId,
    errorMessage: status.errorMessage,
    version: 1,
    completedSteps: [1, 2, 3, 4],
    lastSavedAt: null,
    publishStatus: status.publishStatus,
    publishJobId: status.jobId,
    publishStep: status.publishStep,
    publishProgress: status.publishProgress,
    publishedAt: status.publishedAt,
    createdAt: "",
    updatedAt: "",
  };
}

function mapDraftToResult(
  draft: Pick<
    MetaCampaignDraft,
    | "id"
    | "metaCampaignId"
    | "metaAdsetId"
    | "metaCreativeId"
    | "metaAdId"
    | "publishStatus"
    | "status"
    | "campaignData"
    | "errorMessage"
  >,
): PublishMetaCampaignResult | null {
  if (
    !isPublishSucceeded({
      publishStatus: draft.publishStatus,
      status: draft.status,
      metaCampaignId: draft.metaCampaignId,
      metaAdsetId: draft.metaAdsetId,
      metaCreativeId: draft.metaCreativeId,
      metaAdId: draft.metaAdId,
    })
  ) {
    return null;
  }

  const deliveryStatus = draft.campaignData?.status ?? "PAUSED";

  return {
    draftId: draft.id,
    trackingId: draft.id,
    metaCampaignId: draft.metaCampaignId!,
    metaAdsetId: draft.metaAdsetId!,
    metaCreativeId: draft.metaCreativeId!,
    metaAdId: draft.metaAdId!,
    status: deliveryStatus,
    adsManagerUrl: "",
    publishStatus: draft.publishStatus,
    errorMessage: draft.errorMessage,
    message:
      deliveryStatus === "ACTIVE"
        ? "Campaign published to Meta as Active."
        : "Campaign published successfully to Meta (paused).",
  };
}

function mapStatusToResult(
  status: MetaPublishStatus,
): PublishMetaCampaignResult | null {
  if (
    !isPublishSucceeded({
      publishStatus: status.publishStatus,
      status: status.status,
      metaCampaignId: status.metaCampaignId,
      metaAdsetId: status.metaAdsetId,
      metaCreativeId: status.metaCreativeId,
      metaAdId: status.metaAdId,
    })
  ) {
    return null;
  }

  return {
    draftId: status.draftId,
    trackingId: status.draftId,
    metaCampaignId: status.metaCampaignId!,
    metaAdsetId: status.metaAdsetId!,
    metaCreativeId: status.metaCreativeId!,
    metaAdId: status.metaAdId!,
    status: "PAUSED",
    adsManagerUrl: "",
    publishStatus: status.publishStatus,
    errorMessage: status.errorMessage,
    message: "Campaign published successfully to Meta (paused).",
  };
}

async function enrichPublishResult(
  restaurantId: number,
  result: PublishMetaCampaignResult,
): Promise<PublishMetaCampaignResult> {
  if (result.adsManagerUrl?.trim()) {
    return result;
  }

  const token = getSetupAccessToken().trim();
  if (!token) {
    return result;
  }

  try {
    const connection = await getFacebookConnectionStatus(token, restaurantId);
    if (!connection.metaAdAccountId) {
      return result;
    }
    return {
      ...result,
      adsManagerUrl: buildMetaAdsManagerUrl(connection.metaAdAccountId),
    };
  } catch {
    return result;
  }
}

export async function getMetaPublishStatus(
  businessId: number,
  draftId: string,
  timeoutMs = 15_000,
): Promise<MetaPublishStatus> {
  const res = await authenticatedFetch(
    `${draftsBase(businessId)}/${encodeURIComponent(draftId)}/publish-status`,
    { method: "GET" },
    timeoutMs,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load publish status."),
    );
  }

  return res.json() as Promise<MetaPublishStatus>;
}

export async function autosaveMetaCampaignDraft(
  businessId: number,
  draftId: string,
  payload: AutosaveMetaCampaignDraftPayload,
): Promise<MetaCampaignDraft> {
  const res = await authenticatedFetch(
    `${draftsBase(businessId)}/${encodeURIComponent(draftId)}/autosave`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (res.status === 409) {
    let currentVersion: number | undefined;
    let message = "Draft was updated elsewhere. Reload and try saving again.";
    try {
      const body = (await res.json()) as {
        message?: unknown;
        currentVersion?: number;
      };
      if (typeof body.currentVersion === "number") {
        currentVersion = body.currentVersion;
      }
      if (typeof body.message === "string" && body.message.trim()) {
        message = body.message.trim();
      } else if (Array.isArray(body.message) && body.message[0]) {
        message = String(body.message[0]);
      }
    } catch {
      
    }
    throw new MetaDraftConflictError(message, currentVersion);
  }

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not autosave campaign draft."),
    );
  }

  return res.json() as Promise<MetaCampaignDraft>;
}

export async function pollMetaPublishUntilDone(
  restaurantId: number,
  draftId: string,
  onProgress?: (draft: MetaCampaignDraft) => void,
): Promise<PublishMetaCampaignResult> {
  let consecutiveFailed = 0;

  for (let i = 0; i < PUBLISH_POLL_ATTEMPTS; i += 1) {
    let progressDraft: MetaCampaignDraft;
    let success: PublishMetaCampaignResult | null = null;
    let failed = false;
    let errorMessage: string | null = null;

    try {
      const status = await getMetaPublishStatus(restaurantId, draftId, 15_000);
      progressDraft = mapStatusToDraftProgress(status);
      onProgress?.(progressDraft);
      success = mapStatusToResult(status);
      failed = isPublishFailed(status);
      errorMessage = status.errorMessage;
    } catch {
      
      const draft = await getMetaCampaignDraft(restaurantId, draftId, 15_000);
      progressDraft = draft;
      onProgress?.(draft);
      success = mapDraftToResult(draft);
      failed = isPublishFailed(draft);
      errorMessage = draft.errorMessage;
    }

    if (success) {
      
      try {
        const draft = await getMetaCampaignDraft(restaurantId, draftId, 15_000);
        const fromDraft = mapDraftToResult(draft);
        if (fromDraft) {
          return enrichPublishResult(restaurantId, fromDraft);
        }
      } catch {
        
      }
      return enrichPublishResult(restaurantId, success);
    }

    if (failed) {
      consecutiveFailed += 1;
      
      if (consecutiveFailed >= 4) {
        throw new Error(
          errorMessage?.trim() ||
            "Publish failed on Meta. Review the error and try again.",
        );
      }
    } else {
      consecutiveFailed = 0;
    }

    await new Promise((resolve) => setTimeout(resolve, PUBLISH_POLL_DELAY_MS));
  }

  throw new Error(
    "Publishing is still running. Use Check status in a moment, or open Ads Manager.",
  );
}

export async function publishMetaCampaignDraft(
  restaurantId: number,
  draftId: string,
  auditContext?: {
    campaignName?: string;
    adSetName?: string;
    creativeName?: string;
    adAccountId?: string | null;
    facebookPageId?: string | null;
  },
  onProgress?: (draft: MetaCampaignDraft) => void,
): Promise<PublishMetaCampaignResult> {
  const url = `${draftsBase(restaurantId)}/${encodeURIComponent(draftId)}/publish`;

  console.group("[MetaPublish] Frontend publish trigger");
  console.log("Request URL:", url);
  console.log("Audit context:", {
    restaurantId,
    draftId,
    campaign: auditContext?.campaignName,
    adSet: auditContext?.adSetName,
    creative: auditContext?.creativeName,
  });

  const res = await authenticatedFetch(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    30_000,
  );

  console.log("Response Status:", res.status, res.statusText);

  
  if (!res.ok) {
    const errorBody = await res.clone().text();
    console.log("Response Body (error):", errorBody);
    console.groupEnd();
    throw new Error(
      await parseApiErrorMessage(res, "Could not publish campaign to Meta."),
    );
  }

  const enqueued = (await res.json()) as EnqueueMetaPublishResult;
  console.log("Response Body (enqueued):", enqueued);
  console.groupEnd();

  if (
    enqueued.publishStatus === "FAILED" ||
    String(enqueued.publishStatus ?? "").toUpperCase() === "FAILED"
  ) {
    throw new Error(enqueued.message || "Publish failed.");
  }

  return pollMetaPublishUntilDone(restaurantId, draftId, onProgress);
}

export async function saveCampaignStep(
  restaurantId: number,
  payload: SaveCampaignStepPayload,
): Promise<MetaCampaignDraft> {
  const res = await authenticatedFetch(
    `${draftsBase(restaurantId)}/campaign-step`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not save campaign step."),
    );
  }

  return res.json() as Promise<MetaCampaignDraft>;
}

export async function saveAdSetStep(
  restaurantId: number,
  payload: SaveAdSetStepPayload & { draftId: string },
): Promise<MetaCampaignDraft> {
  const res = await authenticatedFetch(
    `${draftsBase(restaurantId)}/adset-step`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not save ad set step."),
    );
  }

  return res.json() as Promise<MetaCampaignDraft>;
}

export async function saveAdCreativeStep(
  restaurantId: number,
  payload: AdCreativeStepData & { draftId: string },
): Promise<MetaCampaignDraft> {
  const res = await authenticatedFetch(
    `${draftsBase(restaurantId)}/ad-creative-step`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not save ad creative step."),
    );
  }

  return res.json() as Promise<MetaCampaignDraft>;
}

export async function listMetaCampaignDrafts(
  restaurantId: number,
): Promise<MetaCampaignDraft[]> {
  const res = await authenticatedFetch(`${draftsBase(restaurantId)}`, {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load Meta campaign drafts."),
    );
  }

  return res.json() as Promise<MetaCampaignDraft[]>;
}

export async function deleteMetaCampaignDraft(
  restaurantId: number,
  draftId: string,
): Promise<{ deleted: true; draftId: string }> {
  const res = await authenticatedFetch(
    `${draftsBase(restaurantId)}/${encodeURIComponent(draftId)}`,
    { method: "DELETE" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not delete campaign draft."),
    );
  }

  return res.json() as Promise<{ deleted: true; draftId: string }>;
}

export async function getMetaCampaignDraft(
  restaurantId: number,
  draftId: string,
  timeoutMs = 30_000,
): Promise<MetaCampaignDraft> {
  const res = await authenticatedFetch(
    `${draftsBase(restaurantId)}/${encodeURIComponent(draftId)}`,
    { method: "GET" },
    timeoutMs,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load campaign draft."),
    );
  }

  return res.json() as Promise<MetaCampaignDraft>;
}
