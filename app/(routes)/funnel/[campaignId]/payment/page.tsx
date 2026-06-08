"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FunnelPreviewSkeleton } from "@/app/components/crm-template-editor/FunnelPreviewSkeleton";
import { useFunnelTemplatePagesFromStorage } from "@/app/components/crm-template-editor/funnel-template-storage";
import { TemplatePreview } from "@/app/components/crm-template-editor/TemplatePreview";
import type { FunnelStripePaymentContext } from "@/app/components/funnel/FunnelStripePaymentForm";
import { FunnelGuestPageShell } from "@/app/components/funnel/FunnelGuestPageShell";
import { useCampaignPricing } from "@/app/hooks/use-campaign-pricing";
import { useFunnelGuestRoute } from "@/app/hooks/use-funnel-guest-route";
import { getFunnelCheckoutEmail } from "@/app/lib/funnel-checkout-storage";

function FunnelCampaignPaymentPageInner() {
  const searchParams = useSearchParams();
  const { funnelIdSegment, funnelId, campaignId, restaurantId } =
    useFunnelGuestRoute();
  const [checkoutEmail] = useState(() => getFunnelCheckoutEmail());

  const campaignPricing = useCampaignPricing(campaignId, restaurantId);

  const { pages, isLoading } = useFunnelTemplatePagesFromStorage(funnelIdSegment);
  const payment = pages.payment;
  const landing = pages.landing;

  const paymentStripeCheckout = useMemo((): FunnelStripePaymentContext | null => {
    const email = checkoutEmail?.trim();
    if (!email || funnelId == null || restaurantId == null) {
      return null;
    }

    const currency =
      searchParams.get("currency")?.trim().toLowerCase() || "usd";

    return {
      funnelId,
      restaurantId,
      currency,
      customerEmail: email,
      campaignId,
    };
  }, [funnelId, restaurantId, campaignId, checkoutEmail, searchParams]);

  const showSetupHint =
    Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()) &&
    paymentStripeCheckout == null &&
    funnelIdSegment.length > 0;

  if (isLoading) {
    return <FunnelPreviewSkeleton />;
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
      {showSetupHint ? (
        <div className="shrink-0 border-b border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-950">
          {!checkoutEmail?.trim()
            ? "Complete signup first so we have your email."
            : "Add ?restaurantId=… to the URL or set NEXT_PUBLIC_FUNNEL_PAYMENT_RESTAURANT_ID."}
        </div>
      ) : null}
      <TemplatePreview
        page={payment}
        landingPage={landing}
        interactiveForms
        fullPageShellChrome
        paymentStripeCheckout={paymentStripeCheckout}
        campaignPricing={campaignPricing}
        trackingFunnelId={funnelId}
      />
    </div>
  );
}

export default function FunnelCampaignPaymentPage() {
  return (
    <FunnelGuestPageShell>
      <Suspense fallback={<FunnelPreviewSkeleton />}>
        <FunnelCampaignPaymentPageInner />
      </Suspense>
    </FunnelGuestPageShell>
  );
}
