"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { hasAuthSession, markAuthSession } from "@/app/lib/auth-session";
import { refreshAccessToken } from "@/app/lib/refresh-access-token";

function GoogleCallbackRedirectInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        if (!hasAuthSession()) {
          const restored = await refreshAccessToken();
          if (restored) markAuthSession();
        } else {
          markAuthSession();
        }
      } catch {
        /* ignore */
      }

      if (cancelled) return;

      const qs = searchParams.toString();
      const target = qs
        ? `/api/google-ads/callback/oauth?${qs}`
        : `/api/google-ads/callback/oauth`;
      window.location.replace(target);
    };

    void run();

    return () => {
      cancelled = true;
    };
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
