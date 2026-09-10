import { isPusherConfigured } from "@/app/lib/pusher-execution";

export { isPusherConfigured };

export const PUSHER_MEMBER_ACCESS_REMOVED_EVENT = {
  REMOVED: "member-access-removed",
} as const;

export const PUSHER_PRIVATE_CHANNEL_PREFIX = "private-";

export function pusherUserChannel(userId: number): string {
  return `${PUSHER_PRIVATE_CHANNEL_PREFIX}user-${userId}`;
}

export type MemberAccessRemovedPusherPayload = {
  businessId: number;
  businessName: string;
  userId: number;
  kind: "member" | "invite";
  removedAt: string;
};

export function parseMemberAccessRemovedPusherPayload(
  data: unknown,
): MemberAccessRemovedPusherPayload | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;

  const businessId = Number(row.businessId);
  const userId = Number(row.userId);
  const businessName =
    typeof row.businessName === "string" ? row.businessName.trim() : "";
  const kind = row.kind === "invite" || row.kind === "member" ? row.kind : null;
  const removedAt =
    typeof row.removedAt === "string" ? row.removedAt.trim() : "";

  if (
    !Number.isFinite(businessId) ||
    businessId < 1 ||
    !Number.isFinite(userId) ||
    userId < 1 ||
    !businessName ||
    !kind ||
    !removedAt
  ) {
    return null;
  }

  return {
    businessId,
    businessName,
    userId,
    kind,
    removedAt,
  };
}
