"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Check } from "lucide-react";

function FacebookSuccessInner() {
  const searchParams = useSearchParams();
  const connected = searchParams.get("connected") === "true";
  const pages = searchParams.get("pages");
  const error = searchParams.get("error");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        {connected ? (
          <>
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#1877F2] text-white">
              <Check className="size-7" strokeWidth={2.5} aria-hidden />
            </span>
            <h1 className="mt-5 text-xl font-semibold text-zinc-900">
              Facebook connected
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Your account is linked
              {pages && Number(pages) > 0
                ? ` with ${pages} Facebook page${Number(pages) === 1 ? "" : "s"}.`
                : "."}
            </p>
          </>
        ) : (
          <>
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertCircle className="size-7" strokeWidth={2.5} aria-hidden />
            </span>
            <h1 className="mt-5 text-xl font-semibold text-zinc-900">
              Connection failed
            </h1>
            <p className="mt-2 text-sm text-red-700">
              {error?.trim() || "Facebook connection was not completed."}
            </p>
          </>
        )}
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}

export default function FacebookConnectSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-zinc-50">
          <p className="text-sm text-zinc-600">Loading…</p>
        </main>
      }
    >
      <FacebookSuccessInner />
    </Suspense>
  );
}
