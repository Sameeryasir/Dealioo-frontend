import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import type {
  AdCreativeStepData,
  MetaCampaignDraft,
  SaveAdSetStepPayload,
  SaveCampaignStepPayload,
} from "@/app/lib/meta-campaign-builder-types";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

const PUBLISH_META_CAMPAIGN_TIMEOUT_MS = 120_000;

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

export async function publishMetaCampaignDraft(
  restaurantId: number,
  draftId: string,
): Promise<PublishMetaCampaignResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    PUBLISH_META_CAMPAIGN_TIMEOUT_MS,
  );

  try {
    const res = await authenticatedFetch(
      `${getApiBaseUrl()}/facebook-campaigns/restaurant/${encodeURIComponent(String(restaurantId))}/drafts/${encodeURIComponent(draftId)}/publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      },
    );

    if (!res.ok) {
      throw new Error(
        await parseApiErrorMessage(res, "Could not publish campaign to Meta."),
      );
    }

    const data = (await res.json()) as PublishMetaCampaignResult;

    if (
      !data.metaCampaignId ||
      !data.metaAdsetId ||
      !data.metaCreativeId ||
      !data.metaAdId
    ) {
      throw new Error(
        "Publish did not complete — Meta ad id was not returned. Your campaign was not published.",
      );
    }

    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        "Publishing timed out. Meta may still be processing — check Ads Manager before retrying.",
      );
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
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
): Promise<MetaCampaignDraft> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook-campaigns/restaurant/${encodeURIComponent(String(restaurantId))}/drafts/${encodeURIComponent(draftId)}`,
    { method: "GET" },
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
