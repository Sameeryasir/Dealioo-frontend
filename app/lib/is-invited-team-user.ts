import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { getSetupUser } from "@/app/lib/setup-user";

function normalizeRoleName(roleName: string | null | undefined): string {
  return roleName?.trim().toLowerCase() ?? "";
}

function isInvitedTeamRoleName(roleName: string | null | undefined): boolean {
  const role = normalizeRoleName(roleName);
  return role === "manager" || role === "staff";
}

function getRoleNameFromAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  const token = getSetupAccessToken().trim();
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);
    const payload = JSON.parse(json) as { role?: unknown };
    return typeof payload.role === "string" && payload.role.trim()
      ? payload.role.trim()
      : null;
  } catch {
    return null;
  }
}

function getRoleNameFromRawStoredUser(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { role?: { name?: unknown } };
    const name = parsed?.role?.name;
    return typeof name === "string" && name.trim() ? name.trim() : null;
  } catch {
    return null;
  }
}

export function getStoredUserRoleName(): string | null {
  const fromValidatedUser = getSetupUser()?.role?.name?.trim();
  if (fromValidatedUser) return fromValidatedUser;

  const fromRawUser = getRoleNameFromRawStoredUser();
  if (fromRawUser) return fromRawUser;

  return getRoleNameFromAccessToken();
}

export function isManagerUser(): boolean {
  return normalizeRoleName(getStoredUserRoleName()) === "manager";
}

export function isStaffUser(): boolean {
  return normalizeRoleName(getStoredUserRoleName()) === "staff";
}

export function isInvitedTeamUser(): boolean {
  return isInvitedTeamRoleName(getStoredUserRoleName());
}
