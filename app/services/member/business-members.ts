import axios from "axios";
import { parseApiMessage } from "@/app/lib/api";
import { authAxios } from "@/app/lib/auth-axios";
import { hasAuthSession } from "@/app/lib/auth-session";
import { isPositiveInt } from "@/app/lib/numbers";
import { createBusinessInvitation } from "@/app/services/invitation/business-invitations";
import type {
  BusinessMemberListItem,
  BusinessMembersResponse,
  BusinessMemberPermission,
  BusinessMemberStatus,
} from "@/app/services/member/types";
import { BUSINESS_MEMBER_PERMISSIONS } from "@/app/services/member/types";

function readApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response?.data?.message != null) {
    return parseApiMessage(error.response.data.message, fallback);
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return fallback;
}

function parseMemberStatus(value: unknown): BusinessMemberStatus {
  if (value === "owner" || value === "active" || value === "pending") {
    return value;
  }
  return "active";
}

function parseMemberPermissions(value: unknown): BusinessMemberPermission[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(BUSINESS_MEMBER_PERMISSIONS);
  return value
    .filter((item): item is string => typeof item === "string")
    .filter((item): item is BusinessMemberPermission => allowed.has(item));
}

function parseMemberItem(raw: unknown): BusinessMemberListItem | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;

  const email =
    typeof row.email === "string"
      ? row.email
      : typeof row.Email === "string"
        ? row.Email
        : "";

  if (!email.trim()) return null;

  const idRaw = row.id;
  const id =
    idRaw == null
      ? null
      : typeof idRaw === "number" && Number.isFinite(idRaw)
        ? idRaw
        : null;

  const userIdRaw = row.userId ?? row.user_id;
  const userId =
    typeof userIdRaw === "number" && Number.isFinite(userIdRaw)
      ? userIdRaw
      : 0;

  const name =
    typeof row.name === "string"
      ? row.name
      : typeof row.Name === "string"
        ? row.Name
        : email.split("@")[0] || email;

  const role =
    typeof row.role === "string"
      ? row.role
      : typeof row.Role === "string"
        ? row.Role
        : "Staff";

  const status = parseMemberStatus(row.status ?? row.Status);

  const invitedAt =
    typeof row.invitedAt === "string"
      ? row.invitedAt
      : typeof row.invited_at === "string"
        ? row.invited_at
        : undefined;

  const expiresAt =
    typeof row.expiresAt === "string"
      ? row.expiresAt
      : typeof row.expires_at === "string"
        ? row.expires_at
        : undefined;

  const permissions = parseMemberPermissions(row.permissions);

  return {
    id,
    userId,
    name,
    email,
    role,
    status,
    permissions,
    invitedAt,
    expiresAt,
  };
}

export async function getBusinessMembers(
  businessId: number,
): Promise<BusinessMembersResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(businessId)) {
    throw new Error("Valid business id is required.");
  }

  const response = await authAxios.get<unknown>("/members", {
    params: { businessId },
  });

  const payload = response.data;
  const membersRaw =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>).members
      : null;

  const members = Array.isArray(membersRaw)
    ? membersRaw
        .map(parseMemberItem)
        .filter((item): item is BusinessMemberListItem => item != null)
    : [];

  return { members };
}

export type BusinessMembershipAccess = {
  businessId: number;
  access: "owner" | "member" | "super_admin";
  role: string;
  permissions: BusinessMemberPermission[];
};

export async function getMyBusinessMembershipAccess(
  businessId: number,
): Promise<BusinessMembershipAccess> {
  if (!isPositiveInt(businessId)) {
    throw new Error("Invalid business.");
  }
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }

  const response = await authAxios.get<unknown>("/members/me", {
    params: { businessId },
  });
  const data = (response.data ?? {}) as Record<string, unknown>;
  const accessRaw = data.access;
  const access =
    accessRaw === "owner" ||
    accessRaw === "member" ||
    accessRaw === "super_admin"
      ? accessRaw
      : "member";

  return {
    businessId:
      typeof data.businessId === "number" && Number.isFinite(data.businessId)
        ? data.businessId
        : businessId,
    access,
    role: typeof data.role === "string" ? data.role : "Staff",
    permissions: parseMemberPermissions(data.permissions),
  };
}

export async function inviteBusinessMember(input: {
  businessId: number;
  email: string;
  role: string;
  permissions: BusinessMemberPermission[];
}): Promise<{ message: string; inviteId: number }> {
  const result = await createBusinessInvitation(input);
  return { message: result.message, inviteId: result.invitationId };
}

export async function removeBusinessMember(
  memberId: number,
): Promise<{ message: string }> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }

  try {
    const response = await authAxios.delete<unknown>(`/members/${memberId}`);
    const data = response.data as Record<string, unknown> | null;
    const message =
      typeof data?.message === "string"
        ? data.message
        : "Member removed successfully.";

    return { message };
  } catch (error) {
    throw new Error(readApiErrorMessage(error, "Could not remove the member."));
  }
}
