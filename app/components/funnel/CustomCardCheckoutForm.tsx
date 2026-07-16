"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import {
  PaymentElement,
  useCheckoutElements,
} from "@stripe/react-stripe-js/checkout";
import { Loader2 } from "lucide-react";
import type { PaymentTemplatePage } from "@/app/components/crm-template-editor/template-types";
import { getOrCreateVisitorId } from "@/app/lib/funnel-visitor-id";
import { buildFunnelPaymentConfirmationPath } from "@/app/lib/funnel-public-path";
import { trackFunnelEvent } from "@/app/services/funnel/track-funnel-event";
import { checkoutFormRootClass } from "@/app/components/payment-templates/shared/checkout-form-classes";
import type { CheckoutFormStyles } from "@/app/components/payment-templates/shared/checkout-form-styles";

export type CustomCardCheckoutFormProps = {
  funnelId: number;
  campaignId?: number | null;
  businessId: number;
  customerEmail: string;
  customerId?: number;
  checkoutToken?: string | null;
  funnelPaymentId?: number | null;
  page: PaymentTemplatePage;
  formStyles: CheckoutFormStyles;
  submitLabel?: string;
};

function errorMessageFromUnknown(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  if (
    err &&
    typeof err === "object" &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    const message = (err as { message: string }).message.trim();
    if (message) return message;
  }
  return "Payment failed. Please check your details and try again.";
}

export function CustomCardCheckoutForm({
  funnelId,
  campaignId,
  businessId,
  customerEmail,
  customerId,
  checkoutToken,
  funnelPaymentId,
  page,
  formStyles,
  submitLabel,
}: CustomCardCheckoutFormProps) {
  const checkoutState = useCheckoutElements();
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const buttonStyle = {
    backgroundColor: page.checkoutTheme.buttonColor,
    borderRadius: page.checkoutTheme.borderRadius,
    boxShadow: page.checkoutTheme.shadow,
  };

  const confirmationPath = buildFunnelPaymentConfirmationPath(
    funnelId,
    { campaignId, businessId, checkoutToken },
    { redirectStatus: "succeeded", paymentConfirmed: true },
  );

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (checkoutState.type === "loading") {
      setFormError("Payment form is still loading. Please wait a moment.");
      return;
    }
    if (checkoutState.type === "error") {
      setFormError(
        checkoutState.error.message || "Could not load checkout. Try again.",
      );
      return;
    }


    const successUrl = new URL(confirmationPath, window.location.origin).toString();
    setBusy(true);

    try {


      const result = await checkoutState.checkout.confirm({
        redirect: "if_required",
      });

      if (result.type === "error") {
        const message = result.error.message ?? "Payment failed.";
        const alreadyPaid = /already succeeded|already paid/i.test(message);
        if (alreadyPaid) {
          window.location.assign(successUrl);
          return;
        }
        setFormError(message);
        return;
      }


      if (funnelPaymentId != null) {
        void trackFunnelEvent({
          eventType: "payment",
          funnelId,
          funnelPaymentId,
          paymentStatus: "paid",
          visitorId: getOrCreateVisitorId(),
          ...(customerId != null ? { customerId } : {}),
        }).catch((trackErr) => {
          console.warn("[Funnel] payment track failed", trackErr);
        });
      }

      window.location.assign(successUrl);
    } catch (err) {

      console.error("[Funnel] checkout.confirm failed", err);
      setFormError(errorMessageFromUnknown(err));
    } finally {
      setBusy(false);
    }
  };

  const checkoutReady = checkoutState.type === "success";
  const checkoutLoadError =
    checkoutState.type === "error"
      ? checkoutState.error.message || "Could not load checkout. Try again."
      : null;

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className={`${checkoutFormRootClass} ${formStyles.fieldsContainerClass}`}
    >
      <div className={formStyles.rowClass}>
        <label className={formStyles.labelClass}>
          {page.paymentNameOnCardPlaceholder
            ? "Payment details"
            : "Card details"}
        </label>
        {checkoutState.type === "loading" ? (
          <div className="flex items-center gap-2 py-4 text-sm text-zinc-500">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading card form…
          </div>
        ) : null}
        {checkoutReady ? (
          <PaymentElement
            options={{
              layout: "tabs",
              paymentMethodOrder: ["card"],
              wallets: {
                applePay: "never",
                googlePay: "never",
                link: "never",
              },
              fields: {
                billingDetails: {
                  name: "auto",
                  email: "never",
                  phone: page.showPhoneField ? "auto" : "never",
                  address: page.showAddressField ? "auto" : "never",
                },
              },
            }}
          />
        ) : null}
      </div>

      {checkoutLoadError || formError ? (
        <p className="text-xs font-medium text-red-600" role="alert">
          {checkoutLoadError || formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy || !checkoutReady}
        style={buttonStyle}
        className="mt-1 w-full cursor-pointer py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Submitting payment…
          </span>
        ) : (
          submitLabel || page.buttonText || "Complete payment"
        )}
      </button>
    </form>
  );
}
