import { isPusherConfigured } from "@/app/lib/pusher-execution";
import type {
  BusinessMemberListItem,
  BusinessMemberPermission,
} from "@/app/services/member/types";

export { isPusherConfigured };

export const PUSHER_MEMBERS_EVENT = {
  JOINED: "member-joined",
} as const;

export const PUSHER_PRIVATE_CHANNEL_PREFIX = "private-";

export function pusherBusinessMembersChannel(businessId: number): string {
  return `${PUSHER_PRIVATE_CHANNEL_PREFIX}business-members-${businessId}`;
}

export type MemberJoinedPusherPayload = {
  businessId: number;
  invitationId: number;
  member: {
    id: number;
    userId: number;
    name: string;
    email: string;
    role: string;
    status: "active";
    permissions: string[];
  };
};

function isPermissionList(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

export function parseMemberJoinedPusherPayload(
  data: unknown,
): MemberJoinedPusherPayload | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;

  const businessId = Number(row.businessId);
  const invitationId = Number(row.invitationId);
  const memberRaw =
    row.member && typeof row.member === "object"
      ? (row.member as Record<string, unknown>)
      : null;

  if (
    !Number.isFinite(businessId) ||
    businessId < 1 ||
    !Number.isFinite(invitationId) ||
    invitationId < 1 ||
    !memberRaw
  ) {
    return null;
  }

  const id = Number(memberRaw.id);
  const userId = Number(memberRaw.userId);
  const name = typeof memberRaw.name === "string" ? memberRaw.name.trim() : "";
  const email =
    typeof memberRaw.email === "string" ? memberRaw.email.trim() : "";
  const role = typeof memberRaw.role === "string" ? memberRaw.role.trim() : "";
  const permissions = isPermissionList(memberRaw.permissions)
    ? memberRaw.permissions
    : null;

  if (
    !Number.isFinite(id) ||
    id < 1 ||
    !Number.isFinite(userId) ||
    userId < 1 ||
    !email ||
    !role ||
    !permissions ||
    memberRaw.status !== "active"
  ) {
    return null;
  }

  return {
    businessId,
    invitationId,
    member: {
      id,
      userId,
      name: name || email,
      email,
      role,
      status: "active",
      permissions,
    },
  };
}

export function memberJoinedToListItem(
  payload: MemberJoinedPusherPayload,
): BusinessMemberListItem {
  return {
    id: payload.member.id,
    userId: payload.member.userId,
    name: payload.member.name,
    email: payload.member.email,
    role: payload.member.role,
    status: "active",
    permissions: payload.member.permissions as BusinessMemberPermission[],
  };
}
