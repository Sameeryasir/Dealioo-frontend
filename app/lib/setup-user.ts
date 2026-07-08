import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";

const STORAGE_KEY = "user";

function assertClient(): boolean {
  return typeof window !== "undefined";
}

function isVerifyOtpUser(value: unknown): value is VerifyOtpUser {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  const role = o.role;
  if (!role || typeof role !== "object") return false;
  const r = role as Record<string, unknown>;
  return (
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

export function setSetupUser(user: VerifyOtpUser): void {
  if (!assertClient()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function mergeSetupUser(partial: Partial<VerifyOtpUser>): void {
  if (!assertClient()) return;
  const existing = getSetupUser();
  if (!existing) return;
  setSetupUser({ ...existing, ...partial });
}

export function getSetupUser(): VerifyOtpUser | null {
  if (!assertClient()) return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isVerifyOtpUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearSetupUser(): void {
  if (!assertClient()) return;
  localStorage.removeItem(STORAGE_KEY);
}
