import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import type {
  AdCreativeStepData,
  MetaCampaignDraft,
  SaveAdSetStepPayload,
  SaveCampaignStepPayload,
} from "@/app/lib/meta-campaign-builder-types";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

const PUBLISH_META_CAMPAIGN_TIMEOUT_MS = 180_000;

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

  return {
    draftId: draft.id,
    trackingId: draft.id,
    metaCampaignId: draft.metaCampaignId,
    metaAdsetId: draft.metaAdsetId,
    metaCreativeId: draft.metaCreativeId,
    metaAdId: draft.metaAdId,
    status: "PAUSED",
    adsManagerUrl: "",
    message: "Campaign published successfully to Meta (paused).",
  };
}

async function pollDraftAfterPublishIssue(
  restaurantId: number,
  draftId: string,
): Promise<PublishMetaCampaignResult | null> {
  const attempts = 20;
  const delayMs = 3000;

  for (let i = 0; i < attempts; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    try {
      const draft = await getMetaCampaignDraft(restaurantId, draftId, 15_000);
      const result = mapDraftToResult(draft);
      if (result) return result;
      if (draft.status === "failed") {
        throw new Error(
          draft.errorMessage ??
            "Publish failed on Meta. Review the error and try again.",
        );
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("Publish failed")) {
        throw err;
      }
    }
  }

  return null;
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
): Promise<PublishMetaCampaignResult> {
  const url = `${getApiBaseUrl()}/facebook-campaigns/restaurant/${encodeURIComponent(String(restaurantId))}/drafts/${encodeURIComponent(draftId)}/publish`;

  console.group("[MetaPublish] Frontend publish trigger");
  console.log("Request URL:", url);
  console.log("Audit context:", {
    restaurantId,
    draftId,
    campaign: auditContext?.campaignName,
    adSet: auditContext?.adSetName,
    creative: auditContext?.creativeName,
  });

  try {
    const res = await authenticatedFetch(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      PUBLISH_META_CAMPAIGN_TIMEOUT_MS,
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

    const data = (await res.json()) as PublishMetaCampaignResult;
    console.log("Response Body (success):", data);
    console.groupEnd();

    if (
      !data.metaCampaignId ||
      !data.metaAdsetId ||
      !data.metaCreativeId ||
      !data.metaAdId
    ) {
      throw new Error(
        "Publish did not complete — Meta ad id was not returned.",
      );
    }

    return data;
  } catch (error) {
    if (
      (error instanceof DOMException && error.name === "AbortError") ||
      (error instanceof Error && error.message.includes("Request timed out"))
    ) {
      const recovered = await pollDraftAfterPublishIssue(restaurantId, draftId);
      if (recovered) {
        return recovered;
      }
      throw new Error(
        "Publishing timed out. Meta may still be processing — check Ads Manager or use Check status.",
      );
    }
    throw error;
  }
}

export async function saveCampaignStep(
  restaurantId: number,
  payload: SaveCampaignStepPayload,
): Promise<MetaCampaignDraft> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook-campaigns/restaurant/${encodeURIComponent(String(restaurantId))}/drafts/campaign-step`,
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

export async function getMetaCampaignDraft(
  restaurantId: number,
  draftId: string,
  timeoutMs?: number,
): Promise<MetaCampaignDraft> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook-campaigns/restaurant/${encodeURIComponent(String(restaurantId))}/drafts/${encodeURIComponent(draftId)}`,
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

export async function listMetaCampaignDrafts(
  restaurantId: number,
): Promise<MetaCampaignDraft[]> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook-campaigns/restaurant/${encodeURIComponent(String(restaurantId))}/drafts`,
    { method: "GET" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load campaign drafts."),
    );
  }

  return res.json() as Promise<MetaCampaignDraft[]>;
}

export async function saveAdSetStep(
  restaurantId: number,
  payload: SaveAdSetStepPayload,
): Promise<MetaCampaignDraft> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook-campaigns/restaurant/${encodeURIComponent(String(restaurantId))}/drafts/adset-step`,
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
  payload: AdCreativeStepData,
): Promise<MetaCampaignDraft> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook-campaigns/restaurant/${encodeURIComponent(String(restaurantId))}/drafts/ad-creative-step`,
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