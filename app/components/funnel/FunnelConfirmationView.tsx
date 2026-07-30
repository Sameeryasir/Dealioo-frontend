"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { TemplatePreview } from "@/app/components/crm-template-editor/TemplatePreview";
import { FunnelPreviewSkeleton } from "@/app/components/crm-template-editor/FunnelPreviewSkeleton";
import { useFunnelTemplatePagesFromStorage } from "@/app/components/crm-template-editor/funnel-template-storage";
import { PaymentConfirmedSprinkles } from "@/app/components/funnel/PaymentConfirmedSprinkles";
import { usePaymentStatusPoll } from "@/app/hooks/use-payment-status-poll";
import { useCheckoutContext } from "@/app/contexts/checkout-context";
import { getOrCreateVisitorId } from "@/app/lib/funnel-visitor-id";
import { trackFunnelEvent } from "@/app/services/funnel/track-funnel-event";

export function FunnelConfirmationView({
  funnelId,
  templateStorageKey,
}: {
  funnelId: number | null;
  templateStorageKey: string;
}) {
  const trackedRef = useRef(false);
  const { session, ready } = useCheckoutContext();

  const paymentId = session?.funnelPaymentId ?? null;

  const { isPaid, isFailed, isConfirming } = usePaymentStatusPoll({
    paymentId,
    enabled: ready && paymentId != null,
  });

  const confirmedByServer = isPaid;
  const celebrate = confirmedByServer;

  const { pages, isLoading } = useFunnelTemplatePagesFromStorage(
    templateStorageKey,
  );

  useEffect(() => {
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
    celebrate,
    confirmedByServer,
    funnelId,
    paymentId,
    session?.customerId,
  ]);

  if (!ready || isLoading) {
    return <FunnelPreviewSkeleton />;
  }

  return (
    <>
      <PaymentConfirmedSprinkles active={celebrate} />

      {/* Live status overlay — never uses a timeout warning */}
      {paymentId != null && isConfirming ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4"
          role="status"
          aria-live="polite"
        >
          <div className="max-w-md rounded-2xl bg-white px-4 py-3 text-center shadow-lg ring-1 ring-black/10">
            <p className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              Payment received
            </p>
            <p className="mt-2 flex items-center justify-center gap-2 text-sm font-medium text-zinc-900">
              <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
              Confirming your payment with Stripe…
            </p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600">
              We&apos;re confirming your payment with Stripe.
              <br />
              This usually takes only a few seconds.
              <br />
              Please do not refresh the page or make another payment.
            </p>
          </div>
        </div>
      ) : null}

      {paymentId != null && confirmedByServer ? (
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

      {paymentId != null && isFailed ? (
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

      <TemplatePreview
        page={pages.confirmation}
        landingPage={pages.landing}
        fullPageShellChrome
        trackingFunnelId={funnelId}
      />
    </>
  );
}
