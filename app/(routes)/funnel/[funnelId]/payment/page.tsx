"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FunnelPreviewSkeleton } from "@/app/components/crm-template-editor/FunnelPreviewSkeleton";
import { FunnelGuestPageShell } from "@/app/components/funnel/FunnelGuestPageShell";
import { FunnelMetaPixel } from "@/app/components/funnel/FunnelMetaPixel";
import type { FunnelStripePaymentContext } from "@/app/components/funnel/FunnelStripePaymentForm";
import { usePublicFunnelTemplatePages } from "@/app/hooks/use-public-funnel-template-pages";
import { TemplatePreview } from "@/app/components/crm-template-editor/TemplatePreview";
import { useCampaignPricing } from "@/app/hooks/use-campaign-pricing";
import { useFunnelGuestRoute } from "@/app/hooks/use-funnel-guest-route";
import { useFunnelStepGuard } from "@/app/hooks/use-funnel-step-guard";
import { useCheckoutContext } from "@/app/contexts/checkout-context";
import { buildFunnelPaymentConfirmationPath } from "@/app/lib/funnel-public-path";
import { trackMetaPixelEvent } from "@/app/lib/meta-pixel";
import { parsePublicCampaignType } from "@/app/services/funnel/get-public-funnel";

function FunnelCampaignPaymentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { funnelIdSegment, funnelId, campaignId, businessId } =
    useFunnelGuestRoute();
  const { checkoutToken, session, ready, error: checkoutError } =
    useCheckoutContext();

  const isDesignPreview = searchParams.get("preview") === "1";

  const campaignPricing = useCampaignPricing(campaignId, businessId);

  const { pages, isLoading, publicFunnel } = usePublicFunnelTemplatePages(
    funnelIdSegment,
    businessId,
    "payment",
  );

  const campaignType = parsePublicCampaignType(publicFunnel?.campaignType);
  const isPostpaid = campaignType === "postpaid";
  useFunnelStepGuard(funnelId, "payment", { campaignType });

  useEffect(() => {
    if (isDesignPreview || isLoading || !isPostpaid || funnelId == null) return;
    router.replace(
      buildFunnelPaymentConfirmationPath(
        funnelId,
        {
          campaignId,
          businessId,
          campaignType: "postpaid",
        },
        { paymentConfirmed: true },
      ),
    );
  }, [
    isDesignPreview,
    isLoading,
    isPostpaid,
    funnelId,
    campaignId,
    businessId,
    router,
  ]);

  useEffect(() => {
    if (isDesignPreview || isPostpaid || isLoading || campaignType == null) {
      return;
    }
    if (!publicFunnel?.pixelId) return;

    const currency =
      searchParams.get("currency")?.trim().toUpperCase() || "USD";
    const value = campaignPricing.subtotal;
    const resolvedBusinessId = businessId ?? publicFunnel.businessId ?? null;

    trackMetaPixelEvent("InitiateCheckout", {
      params: {
        ...(value != null ? { value, currency } : { currency }),
      },
      pixelId: publicFunnel.pixelId,
      businessId: resolvedBusinessId,
      funnelId,
      dedupeKey: `InitiateCheckout|${publicFunnel.pixelId}|${resolvedBusinessId ?? ""}|${funnelId ?? ""}`,
    });
  }, [
    isDesignPreview,
    isPostpaid,
    isLoading,
    campaignType,
    publicFunnel?.pixelId,
    publicFunnel?.businessId,
    businessId,
    funnelId,
    campaignPricing.subtotal,
    searchParams,
  ]);

  const payment = pages.payment;
  const landing = pages.landing;

  const paymentStripeCheckout = useMemo((): FunnelStripePaymentContext | null => {
    if (isDesignPreview || !session || isPostpaid) return null;
    const email = session.customerEmail?.trim();
    if (!email || !checkoutToken || funnelId == null || businessId == null) {
      return null;
    }

    const currency =
      searchParams.get("currency")?.trim().toLowerCase() || "usd";

    return {
      funnelId,
      businessId,
      currency,
      customerEmail: email,
      customerId: session.customerId,
      campaignId,
      checkoutToken,
      funnelPaymentId: session.funnelPaymentId,
    };
  }, [
    isDesignPreview,
    session,
    isPostpaid,
    checkoutToken,
    funnelId,
    businessId,
    campaignId,
    searchParams,
  ]);

  const showSetupHint =
    !isDesignPreview &&
    ready &&
    Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()) &&
    paymentStripeCheckout == null &&
    funnelIdSegment.length > 0;

  const awaitingInitialCheckoutSession =
    !isDesignPreview &&
    Boolean(checkoutToken) &&
    !ready &&
    session == null;

  const awaitingCampaignType =
    !isDesignPreview && (isLoading || campaignType == null);

  return (
    <>
      <FunnelMetaPixel
        pixelId={isDesignPreview ? null : publicFunnel?.pixelId}
        businessId={businessId ?? publicFunnel?.businessId}
        funnelId={funnelId}
        stepKey="payment"
      />
      {awaitingCampaignType ||
      (!isDesignPreview && isPostpaid) ||
      awaitingInitialCheckoutSession ? (
        <FunnelPreviewSkeleton />
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          {showSetupHint ? (
            <div className="shrink-0 border-b border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-950">
              {checkoutError
                ? checkoutError
                : !checkoutToken
                  ? "Complete signup first to get your checkout link."
                  : "Add ?businessId=… to the URL or set NEXT_PUBLIC_FUNNEL_PAYMENT_BUSINESS_ID."}
            </div>
          ) : null}
          <TemplatePreview
            page={payment}
            landingPage={landing}
            interactiveForms={!isDesignPreview}
            editorStepPreviewChrome={isDesignPreview}
            fullPageShellChrome
            paymentStripeCheckout={
              isDesignPreview ? null : paymentStripeCheckout
            }
            campaignPricing={campaignPricing}
            trackingFunnelId={isDesignPreview ? null : funnelId}
            metaPixelId={isDesignPreview ? null : publicFunnel?.pixelId}
            metaBusinessId={
              isDesignPreview
                ? null
                : (businessId ?? publicFunnel?.businessId)
            }
          />
        </div>
      )}
    </>
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
