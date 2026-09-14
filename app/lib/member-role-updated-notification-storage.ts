import type { MemberRoleUpdatedPusherPayload } from "@/app/lib/pusher-member-role-updated";
import { getPermissionLabel } from "@/app/lib/member-permissions";

const STORAGE_PREFIX = "retention:member-role-updated-notify:";
export const MEMBER_ROLE_UPDATED_NOTIFY_EVENT =
  "retention:member-role-updated-notify";

export type MemberRoleUpdatedNotification = {
  businessId: number;
  businessName: string;
  previousRole: string;
  role: string;
  grantedPermissions: string[];
  removedPermissions: string[];
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

function parsePermissionList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") continue;
    const key = item.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function formatPermissionLabels(keys: string[]): string {
  const labels = keys.map((key) => {
    if (key === "full_access") return "Full access";
    if (key === "members") return "Members";
    if (key === "settings") return "Settings";
    return getPermissionLabel(key);
  });
  if (labels.length <= 4) {
    return labels.join(", ");
  }
  const shown = labels.slice(0, 3).join(", ");
  return `${shown}, and ${labels.length - 3} more`;
}

export function formatMemberRoleUpdatedBody(
  notify: Pick<
    MemberRoleUpdatedNotification,
    "previousRole" | "role" | "grantedPermissions" | "removedPermissions"
  >,
): string {
  const roleChanged =
    notify.previousRole.trim().toLowerCase() !==
    notify.role.trim().toLowerCase();
  const granted = Array.isArray(notify.grantedPermissions)
    ? notify.grantedPermissions
    : [];
  const removed = Array.isArray(notify.removedPermissions)
    ? notify.removedPermissions
    : [];
  const parts: string[] = [];

  if (roleChanged) {
    parts.push(`Your role was changed to ${notify.role}.`);
  }
  if (granted.length > 0) {
    parts.push(`Granted: ${formatPermissionLabels(granted)}.`);
  }
  if (removed.length > 0) {
    parts.push(`Removed: ${formatPermissionLabels(removed)}.`);
  }

  if (parts.length > 0) {
    return parts.join(" ");
  }

  return "Your permissions for this business were updated.";
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
      grantedPermissions: parsePermissionList(parsed.grantedPermissions),
      removedPermissions: parsePermissionList(parsed.removedPermissions),
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
    grantedPermissions: Array.isArray(payload.grantedPermissions)
      ? payload.grantedPermissions
      : [],
    removedPermissions: Array.isArray(payload.removedPermissions)
      ? payload.removedPermissions
      : [],
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
