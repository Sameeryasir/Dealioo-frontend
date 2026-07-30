"use client";

import { useEffect } from "react";
import { getApiBaseUrl } from "@/app/lib/api";

/**
 * Success path only — forwards code/state to the Nest OAuth endpoint.
 * Changed: prefer NEXT_PUBLIC_API_URL so ngrok pages hit Nest, not a dead same-origin wait.
 * Why: stuck "Connecting Facebook…" with no network call when client never left this page.
 */
export function FacebookOAuthSuccessRedirect() {
  useEffect(() => {
    // Prefer explicit backend URL from env; fall back to getApiBaseUrl (same-origin /api rewrite).
    const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
    const apiBase = (fromEnv || getApiBaseUrl()).replace(/\/$/, "");
    const qs = window.location.search.replace(/^\?/, "");
    const target = qs
      ? `${apiBase}/facebook/callback/oauth?${qs}`
      : `${apiBase}/facebook/callback/oauth`;

    window.location.replace(target);
  }, []);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-50">
      <p className="text-sm text-zinc-600">Connecting Facebook…</p>
    </main>
  );
}
