"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
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
  const searchParams = useSearchParams();
  const trackedRef = useRef(false);
  const { session, ready } = useCheckoutContext();

  const paymentId = session?.funnelPaymentId ?? null;

  const expectsPayment = useMemo(() => {
    if (searchParams.get("redirect_status") === "succeeded") return true;
    if (searchParams.get("payment_confirmed") === "1") return true;
    return false;
  }, [searchParams]);

  const { isPaid, loading, error, status } = usePaymentStatusPoll({
    paymentId,
    enabled: expectsPayment && ready && paymentId != null,
  });

  const celebrate = expectsPayment && (isPaid || (!loading && status === "paid"));

  const { pages, isLoading } = useFunnelTemplatePagesFromStorage(templateStorageKey);

  useEffect(() => {
    getOrCreateVisitorId();
    if (!celebrate || funnelId == null) return;
    if (trackedRef.current) return;
    if (paymentId == null) return;
    const customerId = session?.customerId;
    if (customerId == null) return;

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
  }, [celebrate, funnelId, paymentId, session?.customerId]);

  if (!ready || isLoading) {
    return <FunnelPreviewSkeleton />;
  }

  return (
    <>
      <PaymentConfirmedSprinkles active={celebrate} />
      {expectsPayment && loading ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center"
          role="status"
          aria-live="polite"
        >
          <span className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900/90 px-4 py-2 text-xs font-medium text-white shadow-lg">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Confirming your payment…
          </span>
        </div>
      ) : null}
      {expectsPayment && error ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4"
          role="alert"
        >
          <p className="max-w-md rounded-lg bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-900 ring-1 ring-amber-200">
            {error}
          </p>
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
