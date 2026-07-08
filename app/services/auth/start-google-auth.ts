"use client";

import { getApiBaseUrl } from "@/app/lib/api";

export type GoogleAuthMode = "login" | "signup";

/**
 * Starts Google OAuth by sending the browser to the Nest Passport endpoint.
 * mode=login only signs in existing users; mode=signup only creates new users.
 */
export function startGoogleAuth(mode: GoogleAuthMode = "login"): void {
  const apiBase = getApiBaseUrl().replace(/\/$/, "");
  window.location.assign(
    `${apiBase}/auth/google?mode=${encodeURIComponent(mode)}`,
  );
}
