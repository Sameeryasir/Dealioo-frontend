import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";

export function initialsFromUser(user: VerifyOtpUser | null): string {
  const name = user?.name?.trim();
  if (!name) return "?";
  const first = name.split(/\s+/).filter(Boolean)[0];
  if (!first) return "?";
  return first.charAt(0).toUpperCase();
}

export function userAvatarUrl(user: VerifyOtpUser | null): string | null {
  const url = user?.avatar?.trim();
  return url ? url : null;
}
