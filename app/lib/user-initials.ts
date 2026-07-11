import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";

export function initialsFromUser(user: VerifyOtpUser | null): string {
  const name = user?.name?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  const email = user?.email?.trim();
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return "?";
}

export function userAvatarUrl(user: VerifyOtpUser | null): string | null {
  const url = user?.avatar?.trim();
  return url ? url : null;
}
