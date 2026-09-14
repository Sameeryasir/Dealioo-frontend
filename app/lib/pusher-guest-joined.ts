import { isPusherConfigured } from "@/app/lib/pusher-execution";

export { isPusherConfigured };

export const PUSHER_GUEST_JOINED_EVENT = {
  JOINED: "guest-joined",
} as const;

export const PUSHER_PRIVATE_CHANNEL_PREFIX = "private-";

export function pusherBusinessActivityChannel(businessId: number): string {
  return `${PUSHER_PRIVATE_CHANNEL_PREFIX}business-activity-${businessId}`;
}

export type GuestJoinedPusherPayload = {
  businessId: number;
  customerId: number;
  guestName: string;
  guestEmail: string | null;
  funnelId: number;
  campaignId: number | null;
  campaignName: string | null;
  occurredAt: string;
};

export function parseGuestJoinedPusherPayload(
  data: unknown,
): GuestJoinedPusherPayload | null {
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
  const customerId = Number(row.customerId);
  const funnelId = Number(row.funnelId);
  const guestName =
    typeof row.guestName === "string" ? row.guestName.trim() : "";
  const guestEmailRaw = row.guestEmail;
  const guestEmail =
    typeof guestEmailRaw === "string" && guestEmailRaw.trim()
      ? guestEmailRaw.trim()
      : null;
  const campaignIdRaw = row.campaignId;
  const campaignId =
    campaignIdRaw == null || campaignIdRaw === ""
      ? null
      : Number(campaignIdRaw);
  const campaignNameRaw = row.campaignName;
  const campaignName =
    typeof campaignNameRaw === "string" && campaignNameRaw.trim()
      ? campaignNameRaw.trim()
      : null;
  const occurredAt =
    typeof row.occurredAt === "string" ? row.occurredAt.trim() : "";

  if (
    !Number.isFinite(businessId) ||
    businessId < 1 ||
    !Number.isFinite(customerId) ||
    customerId < 1 ||
    !Number.isFinite(funnelId) ||
    funnelId < 1 ||
    !guestName ||
    !occurredAt
  ) {
    return null;
  }

  return {
    businessId,
    customerId,
    guestName,
    guestEmail,
    funnelId,
    campaignId:
      campaignId != null && Number.isFinite(campaignId) && campaignId > 0
        ? campaignId
        : null,
    campaignName,
    occurredAt,
  };
}
