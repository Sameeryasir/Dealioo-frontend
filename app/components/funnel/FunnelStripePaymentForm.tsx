"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { CheckoutElementsProvider } from "@stripe/react-stripe-js/checkout";
import { Loader2 } from "lucide-react";
import { CustomCardCheckoutForm } from "@/app/components/funnel/CustomCardCheckoutForm";
import type { PaymentTemplatePage } from "@/app/components/crm-template-editor/template-types";
import type { CheckoutFormStyles } from "@/app/components/payment-templates/shared/checkout-form-styles";
import { useCheckoutContext } from "@/app/contexts/checkout-context";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { buildFunnelPaymentConfirmationPath } from "@/app/lib/funnel-public-path";
import { createPaymentSession } from "@/app/services/payment/create-payment-session";
import { isPositiveInt } from "@/app/lib/numbers";

export type FunnelStripePaymentContext = {
  funnelId: number;
  businessId: number;
  currency: string;
  customerEmail: string;
  customerId?: number;
  campaignId?: number | null;
  checkoutToken?: string | null;
  funnelPaymentId?: number | null;
};

function resolveBusinessId(context: FunnelStripePaymentContext): number {
  const id = context.businessId;
  if (id == null || !isPositiveInt(id)) {
    throw new Error("Business is required for checkout.");
  }
  return id;
}

export function FunnelStripePaymentForm({
  context,
  page,
  formStyles,
}: {
  context: FunnelStripePaymentContext;
  page: PaymentTemplatePage;
  formStyles: CheckoutFormStyles;
}) {
  const businessId = resolveBusinessId(context);
  const { refreshSession } = useCheckoutContext();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(
    context.funnelPaymentId ?? null,
  );
  const [creating, setCreating] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);


  const requestGenerationRef = useRef(0);

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  const configError = publishableKey
    ? null
    : "Payments are not configured yet. Please add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.";

  const darkInputs = formStyles.isDark;





  const stripePromise = useMemo((): Promise<Stripe | null> | null => {
    if (!publishableKey || !stripeAccountId?.trim()) return null;
    return loadStripe(publishableKey, {
      stripeAccount: stripeAccountId.trim(),
    });
  }, [publishableKey, stripeAccountId]);

  useEffect(() => {
    if (context.funnelPaymentId != null) {
      setPaymentId((current) => current ?? context.funnelPaymentId ?? null);
    }
  }, [context.funnelPaymentId]);

  const startPaymentSession = useCallback(
    async (opts?: { manual?: boolean }) => {
      if (!publishableKey) return;

      const generation = ++requestGenerationRef.current;
      setIntentError(null);
      setCreating(true);

      try {
        const res = await createPaymentSession(
          {
            funnelId: context.funnelId,
            businessId,
            currency: context.currency,
            customerEmail: context.customerEmail,
            ...(isPositiveInt(context.customerId)
              ? { customerId: context.customerId }
              : {}),
            ...(context.checkoutToken?.trim()
              ? { checkoutSessionToken: context.checkoutToken.trim() }
              : {}),
          },
          getSetupAccessToken(),
        );


        if (generation !== requestGenerationRef.current) return;

        if (isPositiveInt(res.paymentId)) {
          setPaymentId(res.paymentId);
          if (context.checkoutToken?.trim()) {
            await refreshSession();
            if (generation !== requestGenerationRef.current) return;
          }
        }

        if (res.alreadyCompleted) {
          const confirmationPath = buildFunnelPaymentConfirmationPath(
            context.funnelId,
            {
              campaignId: context.campaignId,
              businessId,
              checkoutToken: context.checkoutToken,
            },
            { redirectStatus: "succeeded", paymentConfirmed: true },
          );
          window.location.href = confirmationPath;
          return;
        }

        const secret = res.clientSecret?.trim();
        if (!secret) {
          throw new Error(
            "The server did not return a payment session. Please try again.",
          );
        }

        const accountId = res.stripeAccountId?.trim();
        if (!accountId) {
          throw new Error(
            "Stripe connected account is missing for this business.",
          );
        }



        setStripeAccountId(accountId);
        setClientSecret(secret);
      } catch (e) {
        if (generation !== requestGenerationRef.current) return;
        setIntentError(
          e instanceof Error
            ? e.message
            : "We could not start checkout. Please try again.",
        );

        if (opts?.manual) {
          setClientSecret(null);
          setStripeAccountId(null);
        }
      } finally {
        if (generation === requestGenerationRef.current) {
          setCreating(false);
        }
      }
    },
    [
      publishableKey,
      context.funnelId,
      businessId,
      context.currency,
      context.customerEmail,
      context.customerId,
      context.checkoutToken,
      context.campaignId,
      refreshSession,
    ],
  );


  useEffect(() => {
    requestGenerationRef.current += 1;
    setClientSecret(null);
    setStripeAccountId(null);
    setIntentError(null);
    setPaymentId(context.funnelPaymentId ?? null);
    setCreating(false);

    if (!publishableKey) return;

    void startPaymentSession();

    return () => {

      requestGenerationRef.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional identity deps
  }, [
    publishableKey,
    context.funnelId,
    businessId,
    context.currency,
    context.customerEmail,
    context.checkoutToken,
  ]);

  if (configError) {
    return (
      <p className="text-xs font-medium text-red-600" role="alert">
        {configError}
      </p>
    );
  }

  if (!clientSecret || !stripeAccountId || !stripePromise) {
    return (
      <div className="space-y-3">
        {intentError ? (
          <p className="text-xs font-medium text-red-600" role="alert">
            {intentError}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void startPaymentSession({ manual: true })}
          disabled={creating}
          className="w-full cursor-pointer rounded-lg bg-zinc-900 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Preparing checkout…
            </span>
          ) : (
            intentError ? "Try again" : "Prepare payment"
          )}
        </button>
      </div>
    );
  }

  return (
    <CheckoutElementsProvider
      key={clientSecret}
      stripe={stripePromise}
      options={{
        clientSecret,
        elementsOptions: {
          appearance: {
            theme: darkInputs ? "night" : "stripe",
            variables: {
              borderRadius:
                page.checkoutTheme.borderRadius.replace("px", "") || "8",
            },
          },

          savedPaymentMethod: {
            enableSave: "never",
            enableRedisplay: "never",
          },
        },
      }}
    >
      <p className="mb-3 text-left text-sm font-semibold tracking-tight text-inherit">
        {page.paymentMethodSectionTitle || "Payment method"}
      </p>
      <CustomCardCheckoutForm
        funnelId={context.funnelId}
        campaignId={context.campaignId}
        businessId={businessId}
        customerEmail={context.customerEmail}
        customerId={context.customerId}
        checkoutToken={context.checkoutToken}
        funnelPaymentId={paymentId}
        page={page}
        formStyles={formStyles}
      />
    </CheckoutElementsProvider>
  );
}
