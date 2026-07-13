"use client";

import { useEffect } from "react";
import { getApiBaseUrl } from "@/app/lib/api";

/** Success path only — forwards code/state to the Nest OAuth endpoint. */
export function FacebookOAuthSuccessRedirect() {
  useEffect(() => {
    const apiBase = getApiBaseUrl().replace(/\/$/, "");
    const qs = window.location.search.replace(/^\?/, "");
    window.location.replace(
      qs
        ? `${apiBase}/facebook/callback/oauth?${qs}`
        : `${apiBase}/facebook/callback/oauth`,
    );
  }, []);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-50">
      <p className="text-sm text-zinc-600">Connecting Facebook…</p>
    </main>
  );
}
