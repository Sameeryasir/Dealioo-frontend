"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { loadDealiooStripe } from "@/app/lib/load-dealioo-stripe";
import { confirmBillingPaymentMethod } from "@/app/services/subscription/billing";

const publishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";

const stripeAppearance = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#1877f2",
    colorBackground: "#ffffff",
    colorText: "#0f172a",
    colorDanger: "#dc2626",
    colorTextSecondary: "#64748b",
    colorTextPlaceholder: "#94a3b8",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    spacingUnit: "4px",
    borderRadius: "12px",
  },
  rules: {
    ".Input": {
      border: "1px solid #d8e3f2",
      boxShadow: "none",
      padding: "12px 14px",
    },
    ".Input:focus": {
      border: "1px solid #1877f2",
      boxShadow: "0 0 0 3px rgba(24, 119, 242, 0.12)",
    },
    ".Label": {
      fontWeight: "600",
      fontSize: "0.8125rem",
      marginBottom: "6px",
    },
    ".Tab": {
      border: "1px solid #e2e8f0",
      boxShadow: "none",
    },
    ".Tab--selected": {
      borderColor: "#1877f2",
      boxShadow: "0 0 0 1px #1877f2",
    },
  },
};

type OwnerBillingCardFormProps = {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
};

function CardSetupFields({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements || busy) return;

    setBusy(true);
    setErrorMessage(null);

    try {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url: window.location.href,
        },
      });

      if (error) {
        setErrorMessage(
          error.message?.trim() || "Could not save this card. Please try again.",
        );
        return;
      }

      const setupIntentId = setupIntent?.id?.trim() || "";
      if (!setupIntentId || setupIntent.status !== "succeeded") {
        setErrorMessage("Card setup is not complete yet. Please try again.");
        return;
      }

      await confirmBillingPaymentMethod(setupIntentId);
      onSuccess();
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Could not save this card. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      data-dealioo-stripe-form="true"
      onSubmit={(event) => void handleSubmit(event)}
      className="flex flex-col"
    >
      <PaymentElement
        options={{
          layout: {
            type: "accordion",
            defaultCollapsed: false,
          },
          paymentMethodOrder: ["card"],
          wallets: {
            applePay: "never",
            googlePay: "never",
            link: "never",
          },
        }}
      />

      {errorMessage ? (
        <div className="dealioo-billing-modal-error mt-4" role="alert">
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <div className="dealioo-billing-modal-actions">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="dealioo-billing-modal-btn dealioo-billing-modal-btn--ghost"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || busy}
          className="dealioo-billing-modal-btn dealioo-billing-modal-btn--primary"
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {busy ? "Saving…" : "Save card"}
        </button>
      </div>
    </form>
  );
}

export function OwnerBillingCardForm({
  clientSecret,
  onSuccess,
  onCancel,
}: OwnerBillingCardFormProps) {
  const stripePromise = useMemo(
    () => (publishableKey ? loadDealiooStripe(publishableKey) : null),
    [],
  );

  if (!publishableKey || !stripePromise) {
    return (
      <div className="dealioo-billing-modal-error" role="alert">
        Card updates are not configured yet. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: stripeAppearance,
      }}
    >
      <CardSetupFields onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
}
