"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { confirmBillingPaymentMethod } from "@/app/services/subscription/billing";

const publishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";

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
      className="flex flex-col gap-4"
    >
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      {errorMessage ? (
        <p className="text-sm font-medium text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="inline-flex h-10 items-center justify-center rounded-full border border-[#d8e3f2] bg-white px-5 text-sm font-semibold text-brand-navy shadow-sm transition-colors hover:border-[#c5d4ea] hover:bg-[#f8faff] disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || busy}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand-primary px-5 text-sm font-semibold text-white shadow-md shadow-brand-primary/20 transition-colors hover:bg-brand-primary-hover disabled:opacity-60"
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
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [],
  );

  if (!publishableKey || !stripePromise) {
    return (
      <p className="text-sm text-red-700" role="alert">
        Card updates are not configured yet. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
      </p>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#1877f2",
            borderRadius: "12px",
          },
        },
      }}
    >
      <CardSetupFields onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
}
