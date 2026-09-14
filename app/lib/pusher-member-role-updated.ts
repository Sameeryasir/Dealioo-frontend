import { isPusherConfigured } from "@/app/lib/pusher-execution";

export { isPusherConfigured };

export const PUSHER_MEMBER_ROLE_UPDATED_EVENT = {
  UPDATED: "member-role-updated",
} as const;

export type MemberRoleUpdatedPusherPayload = {
  businessId: number;
  businessName: string;
  userId: number;
  previousRole: string;
  role: string;
  updatedAt: string;
};

export function parseMemberRoleUpdatedPusherPayload(
  data: unknown,
): MemberRoleUpdatedPusherPayload | null {
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
  const userId = Number(row.userId);
  const businessName =
    typeof row.businessName === "string" ? row.businessName.trim() : "";
  const previousRole =
    typeof row.previousRole === "string" ? row.previousRole.trim() : "";
  const role = typeof row.role === "string" ? row.role.trim() : "";
  const updatedAt =
    typeof row.updatedAt === "string" ? row.updatedAt.trim() : "";

  if (
    !Number.isFinite(businessId) ||
    businessId < 1 ||
    !Number.isFinite(userId) ||
    userId < 1 ||
    !businessName ||
    !role ||
    !updatedAt
  ) {
    return null;
  }

  return {
    businessId,
    businessName,
    userId,
    previousRole: previousRole || role,
    role,
    updatedAt,
  };
}
