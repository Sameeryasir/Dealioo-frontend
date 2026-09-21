import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";

const USER_COOKIE = "dealioo_user";
const LEGACY_STORAGE_KEY = "user";
const TEN_DAYS_SECONDS = 60 * 60 * 24 * 10;

function assertClient(): boolean {
  return typeof window !== "undefined";
}

function isVerifyOtpUserPlan(value: unknown): value is NonNullable<
  VerifyOtpUser["plan"]
> {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.planId === "string" &&
    typeof o.planSlug === "string" &&
    typeof o.planName === "string" &&
    (o.billingCycle === "monthly" || o.billingCycle === "annual") &&
    typeof o.status === "string" &&
    (typeof o.startedAt === "string" || o.startedAt === null)
  );
}

function isVerifyOtpUser(value: unknown): value is VerifyOtpUser {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  const role = o.role;
  if (!role || typeof role !== "object") return false;
  const r = role as Record<string, unknown>;
  const planOk =
    o.plan === undefined || o.plan === null || isVerifyOtpUserPlan(o.plan);
  return (
    planOk &&
    typeof o.id === "number" &&
    typeof o.name === "string" &&
    typeof o.email === "string" &&
    (typeof o.phone === "string" || o.phone == null) &&
    (typeof o.avatar === "string" || o.avatar == null || o.avatar === undefined) &&
    typeof o.emailVerified === "boolean" &&
    typeof o.phoneVerified === "boolean" &&
    typeof o.isActive === "boolean" &&
    typeof o.createdAt === "string" &&
    typeof o.updatedAt === "string" &&
    typeof r.id === "number" &&
    typeof r.name === "string"
  );
}

function readCookie(name: string): string {
  if (!assertClient()) return "";
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(prefix)) continue;
    try {
      return decodeURIComponent(trimmed.slice(prefix.length));
    } catch {
      return trimmed.slice(prefix.length);
    }
  }
  return "";
}

function writeUserCookie(raw: string): void {
  document.cookie = `${USER_COOKIE}=${encodeURIComponent(raw)}; Path=/; Max-Age=${TEN_DAYS_SECONDS}; SameSite=Lax`;
}

function clearUserCookie(): void {
  document.cookie = `${USER_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function clearLegacyUserStorage(): void {
  if (!assertClient()) return;
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
}

function parseStoredUser(raw: string): VerifyOtpUser | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isVerifyOtpUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setSetupUser(user: VerifyOtpUser): void {
  if (!assertClient()) return;
  clearLegacyUserStorage();
  writeUserCookie(JSON.stringify(user));
}

export function mergeSetupUser(partial: Partial<VerifyOtpUser>): void {
  if (!assertClient()) return;
  const existing = getSetupUser();
  if (!existing) return;
  setSetupUser({ ...existing, ...partial });
}

export function getSetupUser(): VerifyOtpUser | null {
  if (!assertClient()) return null;

  const fromCookie = parseStoredUser(readCookie(USER_COOKIE));
  if (fromCookie) return fromCookie;

  const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY) ?? "";
  const fromLegacy = parseStoredUser(legacyRaw);
  if (!fromLegacy) return null;
  writeUserCookie(JSON.stringify(fromLegacy));
  clearLegacyUserStorage();
  return fromLegacy;
}

export function clearSetupUser(): void {
  if (!assertClient()) return;
  clearUserCookie();
  clearLegacyUserStorage();
}
