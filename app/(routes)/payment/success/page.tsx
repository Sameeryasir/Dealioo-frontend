"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { buildFunnelPaymentConfirmationPath } from "@/app/lib/funnel-public-path";
import { parsePositiveInt } from "@/app/lib/numbers";

function PaymentSuccessRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const funnelId = parsePositiveInt(searchParams.get("funnelId"));
    if (funnelId == null) return;

    const campaignId = parsePositiveInt(searchParams.get("campaignId"));
    const restaurantId = parsePositiveInt(searchParams.get("restaurantId"));
    const checkoutToken = searchParams.get("checkoutToken")?.trim() || null;
    const redirectStatus = searchParams.get("redirect_status") ?? "succeeded";

    const path = buildFunnelPaymentConfirmationPath(
      funnelId,
      { campaignId, restaurantId, checkoutToken },
      {
        redirectStatus,
        paymentConfirmed: redirectStatus === "succeeded",
      },
    );
    router.replace(path);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-100 text-sm text-zinc-500">
      Taking you to confirmation…
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-zinc-100 text-sm text-zinc-500">
          Loading…
        </div>
      }
    >
      <PaymentSuccessRedirectInner />
    </Suspense>
  );
}
