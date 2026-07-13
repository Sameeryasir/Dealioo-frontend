"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { FACEBOOK_OAUTH_CANCELLED_MESSAGE } from "@/app/lib/facebook-oauth-popup";

function FacebookConnectErrorInner() {
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled") === "1";
  const reason =
    searchParams.get("reason")?.trim() ||
    "Facebook connection failed. Please try again.";

  useEffect(() => {
    if (!cancelled) return;
    // Not now via API redirect — close quietly, no cancel screen.
    window.opener?.postMessage(
      { type: FACEBOOK_OAUTH_CANCELLED_MESSAGE },
      "*",
    );
    try {
      window.opener?.focus();
    } catch {
      /* ignore */
    }
    window.close();
  }, [cancelled]);

  if (cancelled) {
    return <main className="min-h-dvh bg-zinc-50" aria-hidden />;
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto size-10 text-red-600" aria-hidden />
        <h1 className="mt-4 text-lg font-semibold text-zinc-900">
          Facebook connect failed
        </h1>
        <p className="mt-2 text-sm text-red-700">{reason}</p>
        <button
          type="button"
          onClick={() => window.close()}
          className="mt-6 w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white"
        >
          Close
        </button>
      </div>
    </main>
  );
}

export default function FacebookConnectErrorPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh bg-zinc-50" aria-hidden />
      }
    >
      <FacebookConnectErrorInner />
    </Suspense>
  );
}
