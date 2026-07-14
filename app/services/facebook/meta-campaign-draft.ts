import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import type {
  AdCreativeStepData,
  MetaCampaignDraft,
  SaveAdSetStepPayload,
  SaveCampaignStepPayload,
} from "@/app/lib/meta-campaign-builder-types";
import {
  buildMetaAdsManagerUrl,
} from "@/app/lib/meta-campaign-builder-types";
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

function mapDraftToResult(draft: MetaCampaignDraft): PublishMetaCampaignResult | null {
  if (
    !draft.metaCampaignId ||
    !draft.metaAdsetId ||
    !draft.metaCreativeId ||
    !draft.metaAdId
  ) {
    return null;
  }

  if (
    draft.publishStatus !== "PUBLISHED" &&
    draft.status !== "published"
  ) {
    return null;
  }

  const deliveryStatus = draft.campaignData?.status ?? "PAUSED";

  return {
    draftId: draft.id,
    trackingId: draft.id,
    metaCampaignId: draft.metaCampaignId,
    metaAdsetId: draft.metaAdsetId,
    metaCreativeId: draft.metaCreativeId,
    metaAdId: draft.metaAdId,
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

export async function pollMetaPublishUntilDone(
  restaurantId: number,
  draftId: string,
  onProgress?: (draft: MetaCampaignDraft) => void,
): Promise<PublishMetaCampaignResult> {
  let consecutiveFailed = 0;

  for (let i = 0; i < PUBLISH_POLL_ATTEMPTS; i += 1) {
    const draft = await getMetaCampaignDraft(restaurantId, draftId, 15_000);
    onProgress?.(draft);

    const result = mapDraftToResult(draft);
    if (result) {
      return enrichPublishResult(restaurantId, result);
    }

    const looksFailed =
      draft.publishStatus === "FAILED" || draft.status === "failed";
    if (looksFailed) {
      consecutiveFailed += 1;
      // Allow BullMQ retries to flip the draft back to publishing before giving up.
      if (consecutiveFailed >= 4) {
        throw new Error(
          draft.errorMessage?.trim() ||
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
  const url = `${getApiBaseUrl()}/facebook-campaigns/business/${encodeURIComponent(String(restaurantId))}/drafts/${encodeURIComponent(draftId)}/publish`;

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

  if (enqueued.publishStatus === "FAILED") {
    throw new Error(enqueued.message || "Publish failed.");
  }

  return pollMetaPublishUntilDone(restaurantId, draftId, onProgress);
}

export async function saveCampaignStep(
  restaurantId: number,
  payload: SaveCampaignStepPayload,
): Promise<MetaCampaignDraft> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook-campaigns/business/${encodeURIComponent(String(restaurantId))}/drafts/campaign-step`,
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
    `${getApiBaseUrl()}/facebook-campaigns/business/${encodeURIComponent(String(restaurantId))}/drafts/adset-step`,
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
    `${getApiBaseUrl()}/facebook-campaigns/business/${encodeURIComponent(String(restaurantId))}/drafts/ad-creative-step`,
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
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook-campaigns/business/${encodeURIComponent(String(restaurantId))}/drafts`,
    { method: "GET" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load Meta campaign drafts."),
    );
  }

  return res.json() as Promise<MetaCampaignDraft[]>;
}

export async function getMetaCampaignDraft(
  restaurantId: number,
  draftId: string,
  timeoutMs = 30_000,
): Promise<MetaCampaignDraft> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook-campaigns/business/${encodeURIComponent(String(restaurantId))}/drafts/${encodeURIComponent(draftId)}`,
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
