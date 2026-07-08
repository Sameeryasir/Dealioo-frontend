"use client";

import { getApiBaseUrl } from "@/app/lib/api";

export type GoogleAuthMode = "login" | "signup";

export function startGoogleAuth(mode: GoogleAuthMode = "login"): void {
  const apiBase = getApiBaseUrl().replace(/\/$/, "");
  window.location.href = `${apiBase}/auth/google?mode=${encodeURIComponent(mode)}`;
}
