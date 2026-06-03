"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getApiBaseUrl } from "@/app/lib/api";

/**
 * Meta/Facebook OAuth redirect URI on the public frontend (ngrok).
 * Forwards Facebook's ?code= to the backend /meta/callback/oauth handler.
 */
function FacebookCallbackRedirectInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const apiBase = getApiBaseUrl().replace(/\/$/, "");
    const qs = searchParams.toString();
    const target = qs
      ? `${apiBase}/meta/callback/oauth?${qs}`
      : `${apiBase}/meta/callback/oauth`;
    window.location.replace(target);
  }, [searchParams]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-50">
      <p className="text-sm text-zinc-600">Connecting Facebook…</p>
    </main>
  );
}

export default function FacebookCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-zinc-50">
          <p className="text-sm text-zinc-600">Loading…</p>
        </main>
      }
    >
      <FacebookCallbackRedirectInner />
    </Suspense>
  );
}
