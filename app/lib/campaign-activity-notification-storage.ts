import type { CampaignActivityPusherPayload } from "@/app/lib/pusher-campaign-activity";

const STORAGE_PREFIX = "retention:campaign-activity-notify:";
export const CAMPAIGN_ACTIVITY_NOTIFY_EVENT =
  "retention:campaign-activity-notify";

export type CampaignActivityNotification = {
  businessId: number;
  eventType: CampaignActivityPusherPayload["eventType"];
  campaignId: number;
  campaignName: string;
  description: string;
  actorUserId: number | null;
  actorName: string | null;
  updatedAt: string;
};

function storageKey(userId: number, businessId: number): string {
  return `${STORAGE_PREFIX}${userId}:${businessId}`;
}

function emitChanged(businessId: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(CAMPAIGN_ACTIVITY_NOTIFY_EVENT, {
      detail: { businessId },
    }),
  );
}

export function readCampaignActivityNotification(
  userId: number,
  businessId: number,
): CampaignActivityNotification | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(storageKey(userId, businessId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CampaignActivityNotification>;
    const businessIdValue = Number(parsed.businessId);
    const campaignId = Number(parsed.campaignId);
    if (
      !Number.isFinite(businessIdValue) ||
      businessIdValue < 1 ||
      !Number.isFinite(campaignId) ||
      campaignId < 1 ||
      (parsed.eventType !== "campaign_created" &&
        parsed.eventType !== "campaign_updated" &&
        parsed.eventType !== "campaign_deleted") ||
      typeof parsed.campaignName !== "string" ||
      typeof parsed.description !== "string" ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null;
    }
    return {
      businessId: businessIdValue,
      eventType: parsed.eventType,
      campaignId,
      campaignName: parsed.campaignName,
      description: parsed.description,
      actorUserId:
        parsed.actorUserId != null && Number(parsed.actorUserId) > 0
          ? Number(parsed.actorUserId)
          : null,
      actorName:
        typeof parsed.actorName === "string" ? parsed.actorName : null,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function writeCampaignActivityNotification(
  userId: number,
  payload: CampaignActivityPusherPayload,
): void {
  if (typeof localStorage === "undefined") return;
  const row: CampaignActivityNotification = {
    businessId: payload.businessId,
    eventType: payload.eventType,
    campaignId: payload.campaignId,
    campaignName: payload.campaignName,
    description: payload.description,
    actorUserId: payload.actorUserId,
    actorName: payload.actorName,
    updatedAt: payload.occurredAt,
  };
  localStorage.setItem(
    storageKey(userId, payload.businessId),
    JSON.stringify(row),
  );
  emitChanged(payload.businessId);
}

export function clearCampaignActivityNotification(
  userId: number,
  businessId: number,
): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(storageKey(userId, businessId));
  emitChanged(businessId);
}
