"use client";

import { getApiBaseUrl } from "@/app/lib/api";

export type GoogleAuthMode = "login" | "signup";

export function startGoogleAuth(mode: GoogleAuthMode = "login"): void {
  const apiBase = getApiBaseUrl().replace(/\/$/, "");
  const returnOrigin = window.location.origin;
  const params = new URLSearchParams({
    mode,
    returnOrigin,
  });
  window.location.href = `${apiBase}/auth/google?${params.toString()}`;
}
