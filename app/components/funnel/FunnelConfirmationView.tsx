"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { TemplatePreview } from "@/app/components/crm-template-editor/TemplatePreview";
import { FunnelPreviewSkeleton } from "@/app/components/crm-template-editor/FunnelPreviewSkeleton";
import { FunnelMetaPixel } from "@/app/components/funnel/FunnelMetaPixel";
import { FunnelGoogleAdsTracking } from "@/app/components/funnel/FunnelGoogleAdsTracking";
import { usePublicFunnelTemplatePages } from "@/app/hooks/use-public-funnel-template-pages";
import { PaymentConfirmedSprinkles } from "@/app/components/funnel/PaymentConfirmedSprinkles";
import { usePaymentStatusPoll } from "@/app/hooks/use-payment-status-poll";
import { useCheckoutContext } from "@/app/contexts/checkout-context";
import { parseCampaignPrice } from "@/app/lib/campaign-price";
import { getOrCreateVisitorId } from "@/app/lib/funnel-visitor-id";
import { trackMetaPixelEvent } from "@/app/lib/meta-pixel";
import { trackMetaPixelPurchaseSuccess } from "@/app/lib/meta-pixel-funnel-conversions";
import { trackGoogleAdsPurchaseSuccess } from "@/app/lib/google-ads-tag";
import { readGoogleAdsFunnelTracking } from "@/app/lib/google-ads-funnel-tracking";
import { trackFunnelEvent } from "@/app/services/funnel/track-funnel-event";
import { parsePublicCampaignType } from "@/app/services/funnel/get-public-funnel";

export function FunnelConfirmationView({
  funnelId,
  templateStorageKey,
  businessId = null,
}: {
  funnelId: number | null;
  templateStorageKey: string;
  businessId?: number | null;
}) {
  const trackedRef = useRef(false);
  const metaPurchaseTrackedRef = useRef(false);
  const metaPostpaidTrackedRef = useRef(false);
  const googlePurchaseTrackedRef = useRef(false);
  const searchParams = useSearchParams();
  const { session, ready } = useCheckoutContext();

  const isDesignPreview = searchParams.get("preview") === "1";

  const { pages, isLoading, publicFunnel } = usePublicFunnelTemplatePages(
    templateStorageKey,
    businessId,
    "confirmation",
  );

  const campaignType = parsePublicCampaignType(publicFunnel?.campaignType);
  const isPostpaid = campaignType === "postpaid";
  const isPrepaid = campaignType === "prepaid";

  const paymentId = session?.funnelPaymentId ?? null;

  const { isPaid, isFailed, isConfirming } = usePaymentStatusPoll({
    paymentId,
    enabled:
      !isDesignPreview && ready && isPrepaid && paymentId != null,
  });

  const confirmedByServer = !isDesignPreview && isPrepaid && isPaid;
  const postpaidConfirmed =
    !isDesignPreview &&
    isPostpaid &&
    (searchParams.get("payment_confirmed") === "1" ||
      searchParams.get("paymentConfirmed") === "true");
  const celebrate = confirmedByServer;

  useEffect(() => {
    if (isDesignPreview) return;
    getOrCreateVisitorId();
    if (!celebrate || funnelId == null) return;
    if (trackedRef.current) return;
    if (paymentId == null) return;
    const customerId = session?.customerId;
    if (customerId == null) return;
    if (!confirmedByServer) return;

    trackedRef.current = true;

    void trackFunnelEvent({
      eventType: "payment",
      funnelId,
      funnelPaymentId: paymentId,
      paymentStatus: "paid",
      visitorId: getOrCreateVisitorId(),
      customerId,
    }).catch((err) => {
      console.warn("[Funnel] payment track failed", err);
    });
  }, [
    isDesignPreview,
    celebrate,
    confirmedByServer,
    funnelId,
    paymentId,
    session?.customerId,
  ]);

  useEffect(() => {
    if (isDesignPreview || !confirmedByServer) return;
    if (metaPurchaseTrackedRef.current) return;
    if (!publicFunnel?.pixelId) return;
    if (paymentId == null) return;

    metaPurchaseTrackedRef.current = true;

    const currency =
      searchParams.get("currency")?.trim().toUpperCase() || "USD";
    const value = parseCampaignPrice(searchParams.get("price"));

    void trackMetaPixelPurchaseSuccess({
      pixelId: publicFunnel.pixelId,
      businessId: businessId ?? publicFunnel.businessId ?? null,
      funnelId,
      paymentId,
      customerId: session?.customerId ?? null,
      value,
      currency,
      dedupeKey: `Purchase|${publicFunnel.pixelId}|${businessId ?? publicFunnel.businessId ?? ""}|${funnelId ?? ""}|${paymentId}`,
    }).catch((err) => {
      metaPurchaseTrackedRef.current = false;
      console.warn("[Funnel Meta] Purchase track failed", err);
    });
  }, [
    isDesignPreview,
    confirmedByServer,
    publicFunnel?.pixelId,
    publicFunnel?.businessId,
    businessId,
    funnelId,
    paymentId,
    session?.customerId,
    searchParams,
  ]);

  useEffect(() => {
    if (isDesignPreview || !postpaidConfirmed) return;
    if (metaPostpaidTrackedRef.current) return;
    if (!publicFunnel?.pixelId) return;

    metaPostpaidTrackedRef.current = true;

    const currency =
      searchParams.get("currency")?.trim().toUpperCase() || "USD";
    const value = parseCampaignPrice(searchParams.get("price"));

    trackMetaPixelEvent("Subscribe", {
      params: {
        ...(value != null ? { value, currency } : { currency }),
        funnel_step: "confirmation",
      },
      pixelId: publicFunnel.pixelId,
      businessId: businessId ?? publicFunnel.businessId ?? null,
      funnelId,
      dedupeKey: `Subscribe|${publicFunnel.pixelId}|${businessId ?? publicFunnel.businessId ?? ""}|${funnelId ?? ""}`,
    });
  }, [
    isDesignPreview,
    postpaidConfirmed,
    publicFunnel?.pixelId,
    publicFunnel?.businessId,
    businessId,
    funnelId,
    searchParams,
  ]);

  const googleAdsTracking = readGoogleAdsFunnelTracking(publicFunnel);

  useEffect(() => {
    if (isDesignPreview || !confirmedByServer) return;
    if (googlePurchaseTrackedRef.current) return;
    if (!googleAdsTracking.tagId) return;
    if (paymentId == null) return;

    googlePurchaseTrackedRef.current = true;

    const currency =
      searchParams.get("currency")?.trim().toUpperCase() || "USD";
    const value = parseCampaignPrice(searchParams.get("price"));
    const transactionId =
      paymentId != null ? String(paymentId) : undefined;
    const resolvedBusinessId = businessId ?? publicFunnel?.businessId ?? null;

    void trackGoogleAdsPurchaseSuccess({
      googleAdsId: googleAdsTracking.tagId,
      businessId: resolvedBusinessId,
      funnelId,
      ...(value != null ? { value, currency } : { currency }),
      ...(transactionId ? { transactionId } : {}),
      purchaseConversionLabel: googleAdsTracking.purchaseConversionLabel,
      dedupeKey: `purchase|${googleAdsTracking.tagId}|${resolvedBusinessId ?? ""}|${funnelId ?? ""}|${transactionId ?? ""}`,
    }).catch(() => {
      googlePurchaseTrackedRef.current = false;
    });
  }, [
    isDesignPreview,
    confirmedByServer,
    googleAdsTracking.tagId,
    googleAdsTracking.purchaseConversionLabel,
    publicFunnel?.businessId,
    businessId,
    funnelId,
    paymentId,
    searchParams,
  ]);

  if (!ready || isLoading || (!isDesignPreview && campaignType == null)) {
    return <FunnelPreviewSkeleton />;
  }

  return (
    <div className="relative flex min-h-full w-full flex-1 flex-col">
      <FunnelMetaPixel
        pixelId={isDesignPreview ? null : publicFunnel?.pixelId}
        businessId={businessId ?? publicFunnel?.businessId}
        funnelId={funnelId}
        stepKey="confirmation"
      />
      <FunnelGoogleAdsTracking
        googleAdsId={
          isDesignPreview ? null : publicFunnel?.googleTagManagerId
        }
        businessId={businessId ?? publicFunnel?.businessId}
        funnelId={funnelId}
        stepKey="confirmation"
      />
      <PaymentConfirmedSprinkles active={celebrate} />

      {!isDesignPreview && paymentId != null && isConfirming && !isPostpaid ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4"
          role="status"
          aria-live="polite"
        >
          <div className="max-w-md rounded-2xl bg-white px-4 py-3 text-center shadow-lg ring-1 ring-black/10">
            <p className="flex items-center justify-center gap-2 text-sm font-medium text-zinc-900">
              <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
              Checking your payment status…
            </p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600">
              We&apos;re confirming with Stripe. This usually takes a few seconds.
              <br />
              Please wait — do not pay again until this finishes.
            </p>
          </div>
        </div>
      ) : null}

      {!isDesignPreview && paymentId != null && confirmedByServer && !isPostpaid ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4"
          role="status"
          aria-live="polite"
        >
          <div className="max-w-md rounded-2xl bg-white px-4 py-3 text-center shadow-lg ring-1 ring-black/10">
            <p className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              Payment Confirmed
            </p>
            <p className="mt-1.5 text-sm font-medium text-zinc-900">
              Thank you for your purchase.
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              Your payment has been successfully confirmed.
            </p>
          </div>
        </div>
      ) : null}

      {!isDesignPreview && paymentId != null && isFailed && !isPostpaid ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4"
          role="alert"
        >
          <div className="max-w-md rounded-2xl bg-white px-4 py-3 text-center shadow-lg ring-1 ring-black/10">
            <p className="flex items-center justify-center gap-2 text-sm font-semibold text-red-600">
              <XCircle className="size-4 shrink-0" aria-hidden />
              Payment Failed
            </p>
            <p className="mt-1.5 text-sm font-medium text-zinc-900">
              We couldn&apos;t confirm your payment.
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              If you believe you were charged, please contact support.
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-0 w-full flex-1 flex-col">
        <TemplatePreview
          page={pages.confirmation}
          landingPage={pages.landing}
          editorStepPreviewChrome={isDesignPreview}
          fullPageShellChrome
          trackingFunnelId={isDesignPreview ? null : funnelId}
          campaignType={campaignType}
          skipPaymentStep={isPostpaid}
        />
      </div>
    </div>
  );
}
