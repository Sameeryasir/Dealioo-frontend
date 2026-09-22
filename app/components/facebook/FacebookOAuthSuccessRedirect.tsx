"use client";

import { useEffect } from "react";

export function FacebookOAuthSuccessRedirect() {
  useEffect(() => {
    const qs = window.location.search.replace(/^\?/, "");
    const target = qs
      ? `/api/facebook/callback/oauth?${qs}`
      : `/api/facebook/callback/oauth`;
    window.location.replace(target);
  }, []);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-50">
      <p className="text-sm text-zinc-600">Connecting Meta account…</p>
    </main>
  );
}
