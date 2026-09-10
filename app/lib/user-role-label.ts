import { getStoredUserRoleName } from "@/app/lib/is-invited-team-user";

const PLATFORM_ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  "super admin": "Super Admin",
  member: "Member",
};

const BUSINESS_ONLY_ROLES = new Set([
  "owner",
  "manager",
  "staff",
  "scanner",
]);

export function getUserRoleLabel(): string | null {
  const raw = getStoredUserRoleName()?.trim();
  if (!raw) return null;

  const normalized = raw.toLowerCase();
  const platformLabel = PLATFORM_ROLE_LABELS[normalized];
  if (platformLabel) return platformLabel;

  if (BUSINESS_ONLY_ROLES.has(normalized)) {
    return "Member";
  }

  return raw;
}
