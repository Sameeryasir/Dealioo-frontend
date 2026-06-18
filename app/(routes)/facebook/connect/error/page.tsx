"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";

function FacebookConnectErrorInner() {
  const searchParams = useSearchParams();
  const reason =
    searchParams.get("reason")?.trim() ||
    "Facebook connection failed. Please try again.";

  const handleClose = () => {
    window.close();
  };

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
          onClick={handleClose}
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
        <main className="flex min-h-dvh items-center justify-center bg-zinc-50">
          <p className="text-sm text-zinc-600">Loading…</p>
        </main>
      }
    >
      <FacebookConnectErrorInner />
    </Suspense>
  );
}
