"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";

function FacebookConnectSuccessInner() {
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get("restaurantId");

  const campaignsHref =
    restaurantId && /^\d+$/.test(restaurantId)
      ? `/restaurant/${restaurantId}/dashboard/campaigns`
      : "/dashboard";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#1877F2] text-white">
          <Check className="size-7" strokeWidth={2.5} aria-hidden />
        </span>
        <h1 className="mt-5 text-xl font-semibold text-zinc-900">
          Facebook connected
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Your Facebook account is linked to this business. You can run ads and
          use your funnel tracking link in Meta Ads Manager.
        </p>
        <Link
          href={campaignsHref}
          className="mt-6 inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Back to campaigns
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
      <FacebookConnectSuccessInner />
    </Suspense>
  );
}
