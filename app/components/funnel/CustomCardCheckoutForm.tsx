"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import {
  stripeCardDarkStyle,
  stripeCardElementStyle,
} from "@/app/components/payment-templates/shared/stripe-card-styles";
import type { PaymentTemplatePage } from "@/app/components/crm-template-editor/template-types";
import { getOrCreateVisitorId } from "@/app/lib/funnel-visitor-id";
import { buildFunnelPaymentConfirmationPath } from "@/app/lib/funnel-public-path";
import { waitForPaymentPaid } from "@/app/lib/wait-for-payment-paid";
import { trackFunnelEvent } from "@/app/services/funnel/track-funnel-event";
import { checkoutFormRootClass } from "@/app/components/payment-templates/shared/checkout-form-classes";
import type { CheckoutFormStyles } from "@/app/components/payment-templates/shared/checkout-form-styles";
import { checkoutStripeFieldShell } from "@/app/components/payment-templates/shared/checkout-form-styles";

export type CustomCardCheckoutFormProps = {
  clientSecret: string;
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

async function trackPaymentSuccessWhenConfirmed(
  funnelId: number,
  funnelPaymentId: number,
  customerId?: number,
): Promise<void> {
  const paid = await waitForPaymentPaid(funnelPaymentId);
  if (!paid) return;

  await trackFunnelEvent({
    eventType: "payment",
    funnelId,
    funnelPaymentId,
    paymentStatus: "paid",
    visitorId: getOrCreateVisitorId(),
    ...(customerId != null ? { customerId } : {}),
  });
}

export function CustomCardCheckoutForm({
  clientSecret,
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
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { isDark } = formStyles;
  const cardStyle = isDark ? stripeCardDarkStyle : stripeCardElementStyle;
  const stripeShell = checkoutStripeFieldShell(formStyles);
  const buttonStyle = {
    backgroundColor: page.checkoutTheme.buttonColor,
    borderRadius: page.checkoutTheme.borderRadius,
    boxShadow: page.checkoutTheme.shadow,
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    if (!stripe || !elements) return;

    const card = elements.getElement(CardNumberElement);
    if (!card) {
      setFormError("Card field is not ready. Please wait a moment.");
      return;
    }

    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("cardholderName") ?? "").trim();
    if (!name) {
      setFormError("Please enter the cardholder name.");
      return;
    }

    setBusy(true);
    try {
      const confirmationPath = buildFunnelPaymentConfirmationPath(
        funnelId,
        { campaignId, businessId, checkoutToken },
        { redirectStatus: "succeeded", paymentConfirmed: true },
      );
      const returnUrl = new URL(confirmationPath, window.location.origin);

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card,
            billing_details: {
              name,
              email: customerEmail,
              phone: page.showPhoneField
                ? String(fd.get("contactPhone") ?? "").trim() || undefined
                : undefined,
              address: page.showAddressField
                ? {
                    line1:
                      String(fd.get("billingLine1") ?? "").trim() || undefined,
                    country:
                      String(fd.get("billingCountry") ?? "").trim() ||
                      undefined,
                  }
                : undefined,
            },
          },
          return_url: returnUrl.toString(),
        },
      );

      if (error) {
        const alreadyPaid =
          error.code === "payment_intent_unexpected_state" ||
          /already succeeded/i.test(error.message ?? "");
        if (alreadyPaid) {
          window.location.href = returnUrl.toString();
          return;
        }
        setFormError(error.message ?? "Payment failed.");
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        setFormError(null);
        if (funnelPaymentId != null) {
          const confirmed = await waitForPaymentPaid(funnelPaymentId, {
            maxAttempts: 20,
          });
          if (!confirmed) {
            setFormError(
              "Payment is processing. Please wait a moment and refresh, or check your email for confirmation.",
            );
            return;
          }
        }
        try {
          if (funnelPaymentId != null) {
            await trackPaymentSuccessWhenConfirmed(
              funnelId,
              funnelPaymentId,
              customerId,
            );
          }
        } catch (trackErr) {
          console.warn("[Funnel] payment track failed", trackErr);
        }
        window.location.href = returnUrl.toString();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className={`${checkoutFormRootClass} ${formStyles.fieldsContainerClass}`}
    >
      <div className={formStyles.rowClass}>
        <label htmlFor="cardholderName" className={formStyles.labelClass}>
          Cardholder name
        </label>
        <input
          id="cardholderName"
          name="cardholderName"
          type="text"
          autoComplete="cc-name"
          placeholder={page.paymentNameOnCardPlaceholder || "Full name on card"}
          className={formStyles.fieldClass}
        />
      </div>

      <div className={formStyles.rowClass}>
        <label className={formStyles.labelClass}>Card number</label>
        <div className={stripeShell}>
          <CardNumberElement
            options={{ style: cardStyle, showIcon: true }}
            className="w-full min-w-0"
          />
        </div>
      </div>

      <div className="grid w-full min-w-0 grid-cols-2 gap-3">
        <div className={`min-w-0 ${formStyles.rowClass}`}>
          <label className={formStyles.labelClass}>Expiry</label>
          <div className={stripeShell}>
            <CardExpiryElement
              options={{ style: cardStyle }}
              className="w-full min-w-0"
            />
          </div>
        </div>
        <div className={`min-w-0 ${formStyles.rowClass}`}>
          <label className={formStyles.labelClass}>CVV</label>
          <div className={stripeShell}>
            <CardCvcElement
              options={{ style: cardStyle }}
              className="w-full min-w-0"
            />
          </div>
        </div>
      </div>

      {formError ? (
        <p className="text-xs font-medium text-red-600" role="alert">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy || !stripe}
        style={buttonStyle}
        className="mt-1 w-full cursor-pointer py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Confirming payment…
          </span>
        ) : (
          submitLabel || page.buttonText || "Complete payment"
        )}
      </button>
    </form>
  );
}
