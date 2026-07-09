import type { VerifyOtpUser, VerifyOtpUserRole } from "@/app/services/auth/verify-otp";

function parseId(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Number.parseInt(value.trim(), 10);
  }
  return undefined;
}

function parseRole(value: unknown): VerifyOtpUserRole | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = parseId(row.id);
  const name = typeof row.name === "string" ? row.name.trim() : "";
  if (id == null || !name) return null;
  return { id, name };
}

export function parseAuthUser(value: unknown): VerifyOtpUser | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = parseId(row.id);
  const name = typeof row.name === "string" ? row.name.trim() : "";
  const email = typeof row.email === "string" ? row.email.trim() : "";
  const role = parseRole(row.role);

  if (id == null || !name || !email || !role) return null;

  return {
    id,
    name,
    email,
    phone:
      typeof row.phone === "string"
        ? row.phone
        : row.phone == null
          ? ""
          : String(row.phone),
    avatar: typeof row.avatar === "string" ? row.avatar : row.avatar ?? null,
    firstName:
      typeof row.firstName === "string"
        ? row.firstName
        : typeof row.first_name === "string"
          ? row.first_name
          : null,
    lastName:
      typeof row.lastName === "string"
        ? row.lastName
        : typeof row.last_name === "string"
          ? row.last_name
          : null,
    provider:
      typeof row.provider === "string" && row.provider.trim()
        ? row.provider.trim()
        : "LOCAL",
    emailVerified: row.emailVerified === true || row.email_verified === true,
    phoneVerified: row.phoneVerified === true || row.phone_verified === true,
    isActive: row.isActive !== false && row.is_active !== false,
    createdAt:
      typeof row.createdAt === "string"
        ? row.createdAt
        : typeof row.created_at === "string"
          ? row.created_at
          : new Date().toISOString(),
    updatedAt:
      typeof row.updatedAt === "string"
        ? row.updatedAt
        : typeof row.updated_at === "string"
          ? row.updated_at
          : new Date().toISOString(),
    lastLoginAt:
      typeof row.lastLoginAt === "string"
        ? row.lastLoginAt
        : typeof row.last_login_at === "string"
          ? row.last_login_at
          : null,
    role,
    twoFactorEnabled:
      row.twoFactorEnabled === true || row.two_factor_enabled === true,
    isTwoFactorVerified:
      row.isTwoFactorVerified === true ||
      row.is_two_factor_verified === true,
  };
}

export type UpdateProfilePayload = {
  name?: string;
  email?: string;
  phone?: string;
};
