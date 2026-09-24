"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function GoogleCallbackRedirectInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Same-origin /api rewrite (like Facebook) so the OAuth tab keeps this host's
    // signed-in cookie. Do not bounce to an absolute API URL / FRONTEND_URL[0].
    const qs = searchParams.toString();
    const target = qs
      ? `/api/google-ads/callback/oauth?${qs}`
      : `/api/google-ads/callback/oauth`;
    window.location.replace(target);
  }, [searchParams]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-50">
      <p className="text-sm text-zinc-600">Connecting Google Ads…</p>
    </main>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-zinc-50">
          <p className="text-sm text-zinc-600">Loading…</p>
        </main>
      }
    >
      <GoogleCallbackRedirectInner />
    </Suspense>
  );
}
