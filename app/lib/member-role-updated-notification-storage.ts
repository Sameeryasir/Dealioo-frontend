import type { MemberRoleUpdatedPusherPayload } from "@/app/lib/pusher-member-role-updated";

const STORAGE_PREFIX = "retention:member-role-updated-notify:";
export const MEMBER_ROLE_UPDATED_NOTIFY_EVENT =
  "retention:member-role-updated-notify";

export type MemberRoleUpdatedNotification = {
  businessId: number;
  businessName: string;
  previousRole: string;
  role: string;
  updatedAt: string;
};

function storageKey(userId: number, businessId: number): string {
  return `${STORAGE_PREFIX}${userId}:${businessId}`;
}

function emitChanged(businessId: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(MEMBER_ROLE_UPDATED_NOTIFY_EVENT, {
      detail: { businessId },
    }),
  );
}

export function readMemberRoleUpdatedNotification(
  userId: number,
  businessId: number,
): MemberRoleUpdatedNotification | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(storageKey(userId, businessId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<MemberRoleUpdatedNotification>;
    const businessIdValue = Number(parsed.businessId);
    if (
      !Number.isFinite(businessIdValue) ||
      businessIdValue < 1 ||
      typeof parsed.businessName !== "string" ||
      typeof parsed.role !== "string" ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null;
    }
    return {
      businessId: businessIdValue,
      businessName: parsed.businessName,
      previousRole:
        typeof parsed.previousRole === "string" ? parsed.previousRole : "",
      role: parsed.role,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function writeMemberRoleUpdatedNotification(
  userId: number,
  payload: MemberRoleUpdatedPusherPayload,
): void {
  if (typeof localStorage === "undefined") return;
  const row: MemberRoleUpdatedNotification = {
    businessId: payload.businessId,
    businessName: payload.businessName,
    previousRole: payload.previousRole,
    role: payload.role,
    updatedAt: payload.updatedAt,
  };
  localStorage.setItem(
    storageKey(userId, payload.businessId),
    JSON.stringify(row),
  );
  emitChanged(payload.businessId);
}

export function clearMemberRoleUpdatedNotification(
  userId: number,
  businessId: number,
): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(storageKey(userId, businessId));
  emitChanged(businessId);
}
