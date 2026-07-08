import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";

export function initialsFromUser(user: VerifyOtpUser | null): string {
  if (!user?.name?.trim()) return "?";
  const parts = user.name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const a = parts[0][0];
  const b = parts[parts.length - 1][0];
  return `${a}${b}`.toUpperCase();
}

export function userAvatarUrl(user: VerifyOtpUser | null): string | null {
  const url = user?.avatar?.trim();
  return url ? url : null;
}
