import { isPusherConfigured } from "@/app/lib/pusher-execution";

export { isPusherConfigured };

export const PUSHER_META_PUBLISH_EVENT = {
  PROGRESS: "meta-publish-progress",
} as const;

export const PUSHER_PRIVATE_CHANNEL_PREFIX = "private-";

export function pusherBusinessMetaPublishChannel(businessId: number): string {
  return `${PUSHER_PRIVATE_CHANNEL_PREFIX}business-meta-publish-${businessId}`;
}

export type MetaPublishProgressPusherPayload = {
  businessId: number;
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
};

export function parseMetaPublishProgressPayload(
  data: unknown,
): MetaPublishProgressPusherPayload | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;

  const businessId = Number(row.businessId);
  const draftId = typeof row.draftId === "string" ? row.draftId.trim() : "";
  if (!Number.isFinite(businessId) || businessId < 1 || !draftId) {
    return null;
  }

  return {
    businessId,
    draftId,
    status: typeof row.status === "string" ? row.status : "",
    publishStatus:
      row.publishStatus == null ? null : String(row.publishStatus),
    publishStep: row.publishStep == null ? null : String(row.publishStep),
    publishProgress: Number(row.publishProgress) || 0,
    jobId: row.jobId == null ? null : String(row.jobId),
    metaCampaignId:
      row.metaCampaignId == null ? null : String(row.metaCampaignId),
    metaAdsetId: row.metaAdsetId == null ? null : String(row.metaAdsetId),
    metaCreativeId:
      row.metaCreativeId == null ? null : String(row.metaCreativeId),
    metaAdId: row.metaAdId == null ? null : String(row.metaAdId),
    errorMessage: row.errorMessage == null ? null : String(row.errorMessage),
  };
}
