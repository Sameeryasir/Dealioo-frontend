"use client";

import { useEffect } from "react";
import { getApiBaseUrl } from "@/app/lib/api";

export function FacebookOAuthSuccessRedirect() {
  useEffect(() => {
    const qs = window.location.search.replace(/^\?/, "");
    const hostname = window.location.hostname;
    const isLocal =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]";

    const apiBase = (
      isLocal
        ? process.env.NEXT_PUBLIC_API_URL?.trim() || getApiBaseUrl()
        : `${window.location.origin}/api`
    ).replace(/\/$/, "");

    const target = qs
      ? `${apiBase}/facebook/callback/oauth?${qs}`
      : `${apiBase}/facebook/callback/oauth`;

    window.location.replace(target);
  }, []);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-50">
      <p className="text-sm text-zinc-600">Connecting Meta account…</p>
    </main>
  );
}
