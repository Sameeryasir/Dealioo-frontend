"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useFunnelTemplatePagesFromStorage } from "@/app/components/crm-template-editor/funnel-template-storage";
import { TemplatePreview } from "@/app/components/crm-template-editor/TemplatePreview";
import type { FunnelStripePaymentContext } from "@/app/components/funnel/FunnelStripePaymentForm";
import { useFunnelGuestRoute } from "@/app/hooks/use-funnel-guest-route";
import { getFunnelCheckoutEmail } from "@/app/lib/funnel-checkout-storage";
import { parseNonNegativeInt, parsePositiveInt } from "@/app/lib/numbers";

function FunnelCampaignPaymentPageInner() {
  const searchParams = useSearchParams();
  const { funnelIdSegment, funnelId, restaurantId } = useFunnelGuestRoute();
  const [checkoutEmail] = useState(() => getFunnelCheckoutEmail());

  const pages = useFunnelTemplatePagesFromStorage(funnelIdSegment);
  const payment = pages.payment;
  const landing = pages.landing;

  const paymentStripeCheckout = useMemo((): FunnelStripePaymentContext | null => {
    const email = checkoutEmail?.trim();
    if (!email || funnelId == null || restaurantId == null) {
      return null;
    }

    const applicationFeeAmount =
      parsePositiveInt(searchParams.get("applicationFeeAmount")) ??
      parseNonNegativeInt(
        process.env.NEXT_PUBLIC_FUNNEL_PAYMENT_APPLICATION_FEE,
        200,
      );
    const currency =
      searchParams.get("currency")?.trim().toLowerCase() || "usd";

    return {
      funnelId,
      restaurantId,
      applicationFeeAmount,
      currency,
      customerEmail: email,
    };
  }, [funnelId, restaurantId, checkoutEmail, searchParams]);

  const showSetupHint =
    Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()) &&
    paymentStripeCheckout == null &&
    funnelIdSegment.length > 0;

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-100">
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-[390px] flex-none px-3 py-6 pb-12 sm:px-4">
          {showSetupHint ? (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              {!checkoutEmail?.trim()
                ? "Complete signup first so we have your email."
                : "Add ?restaurantId=… to the URL or set NEXT_PUBLIC_FUNNEL_PAYMENT_RESTAURANT_ID."}
            </div>
          ) : null}
          <TemplatePreview
            page={payment}
            landingPage={landing}
            interactiveForms
            paymentStripeCheckout={paymentStripeCheckout}
          />
        </div>
      </main>
    </div>
  );
}

export default function FunnelCampaignPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-zinc-100 text-sm text-zinc-500">
          Loading…
        </div>
      }
    >
      <FunnelCampaignPaymentPageInner />
    </Suspense>
  );
}
