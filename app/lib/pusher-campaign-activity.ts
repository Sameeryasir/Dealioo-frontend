import { isPusherConfigured } from "@/app/lib/pusher-execution";

export { isPusherConfigured };

export const PUSHER_CAMPAIGN_ACTIVITY_EVENT = {
  UPDATED: "activity-campaign-updated",
} as const;

export const PUSHER_PRIVATE_CHANNEL_PREFIX = "private-";

export function pusherBusinessActivityChannel(businessId: number): string {
  return `${PUSHER_PRIVATE_CHANNEL_PREFIX}business-activity-${businessId}`;
}

export type CampaignActivityEventType =
  | "campaign_created"
  | "campaign_updated"
  | "campaign_deleted";

export type CampaignActivityPusherPayload = {
  businessId: number;
  eventType: CampaignActivityEventType;
  campaignId: number;
  campaignName: string;
  description: string;
  actorUserId: number | null;
  actorName: string | null;
  occurredAt: string;
};

export function parseCampaignActivityPusherPayload(
  data: unknown,
): CampaignActivityPusherPayload | null {
  let row: Record<string, unknown> | null = null;
  if (typeof data === "string") {
    try {
      const parsed: unknown = JSON.parse(data);
      if (parsed && typeof parsed === "object") {
        row = parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  } else if (data && typeof data === "object") {
    row = data as Record<string, unknown>;
  }
  if (!row) return null;

  const businessId = Number(row.businessId);
  const campaignId = Number(row.campaignId);
  const eventType = row.eventType;
  const campaignName =
    typeof row.campaignName === "string" ? row.campaignName.trim() : "";
  const description =
    typeof row.description === "string" ? row.description.trim() : "";
  const occurredAt =
    typeof row.occurredAt === "string" ? row.occurredAt.trim() : "";
  const actorUserIdRaw = row.actorUserId;
  const actorUserId =
    actorUserIdRaw == null || actorUserIdRaw === ""
      ? null
      : Number(actorUserIdRaw);
  const actorName =
    typeof row.actorName === "string" ? row.actorName.trim() : null;

  if (
    !Number.isFinite(businessId) ||
    businessId < 1 ||
    !Number.isFinite(campaignId) ||
    campaignId < 1 ||
    (eventType !== "campaign_created" &&
      eventType !== "campaign_updated" &&
      eventType !== "campaign_deleted") ||
    !campaignName ||
    !occurredAt
  ) {
    return null;
  }

  return {
    businessId,
    eventType,
    campaignId,
    campaignName,
    description: description || campaignName,
    actorUserId:
      actorUserId != null && Number.isFinite(actorUserId) && actorUserId > 0
        ? actorUserId
        : null,
    actorName: actorName || null,
    occurredAt,
  };
}
