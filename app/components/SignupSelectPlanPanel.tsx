"use client";

import {
  getSignupPlanCta,
  SignupPlanStep,
} from "@/app/components/auth/SignupPlanStep";
import type { BillingCycle } from "@/app/components/landing/pricing-plans";
import { findPricingPlan } from "@/app/components/landing/pricing-plans";
import { useSubscriptionPlans } from "@/app/hooks/use-subscription-plans";
import {
  appendBillingQuery,
  persistBillingCyclePreference,
  readBillingCyclePreference,
} from "@/app/lib/billing-cycle";
import { saveSelectedSignupPlan } from "@/app/lib/selected-plan-storage";
import { startUserPlanCheckout } from "@/app/services/subscription/user-subscription";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function isContactSalesPlan(planId: string, plans: readonly { id: string; cta?: string }[]): boolean {
  const fromList = plans.find((plan) => plan.id === planId);
  const cta = fromList?.cta ?? findPricingPlan(planId)?.cta ?? "";
  return cta.toLowerCase().includes("contact");
}

export function SignupSelectPlanPanel() {
  const router = useRouter();
  const { plans, loading, error: plansError, defaultPlanId } =
    useSubscriptionPlans();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");
  const [billingReady, setBillingReady] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("starter");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setBillingCycle(readBillingCyclePreference());
    setBillingReady(true);
  }, []);

  useEffect(() => {
    if (!loading && plans.length > 0) {
      setSelectedPlanId(defaultPlanId);
    }
  }, [defaultPlanId, loading, plans.length]);

  useEffect(() => {
    if (!billingReady) return;
    persistBillingCyclePreference(billingCycle, selectedPlanId);
  }, [billingCycle, billingReady, selectedPlanId]);

  const handleBillingChange = useCallback(
    (cycle: BillingCycle) => {
      setBillingCycle(cycle);
      persistBillingCyclePreference(cycle, selectedPlanId);
    },
    [selectedPlanId],
  );

  const onContinue = useCallback(async () => {
    if (!selectedPlanId) return;

    setErrorMessage(null);
    setSubmitting(true);

    try {
      if (isContactSalesPlan(selectedPlanId, plans)) {
        const salesEmail =
          plans.find((plan) => plan.id === selectedPlanId)?.salesEmail ??
          findPricingPlan(selectedPlanId)?.salesEmail ??
          "support@dealioo.com";
        window.location.href = `mailto:${salesEmail}?subject=${encodeURIComponent("Enterprise plan inquiry")}`;
        setSubmitting(false);
        return;
      }

      const checkout = await startUserPlanCheckout({
        planSlug: selectedPlanId,
        billingCycle,
      });

      saveSelectedSignupPlan({
        planId: selectedPlanId,
        billing: billingCycle,
      });

      window.location.href = checkout.checkoutUrl;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not start checkout. Try again.";

      if (message.toLowerCase().includes("already have an active subscription")) {
        router.replace("/business/register");
        return;
      }

      setErrorMessage(message);
      setSubmitting(false);
    }
  }, [billingCycle, plans, router, selectedPlanId]);

  if (loading) {
    return (
      <div className="flex min-h-[20rem] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" aria-hidden />
      </div>
    );
  }

  const alertMessage = errorMessage ?? plansError;

  return (
    <div className="signup-select-plan-panel mx-auto w-full max-w-[88rem] px-1 sm:px-0">
      {alertMessage ? (
        <div
          className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{alertMessage}</span>
        </div>
      ) : null}

      <div className="select-plan-panel__plans">
        <SignupPlanStep
          billing={billingCycle}
          onBillingChange={handleBillingChange}
          selectedPlanId={selectedPlanId}
          onSelectPlan={setSelectedPlanId}
          plans={plans}
          layout="single-row"
        />
      </div>

      <div className="mt-6 flex justify-center sm:mt-8">
        <button
          type="button"
          onClick={() => void onContinue()}
          disabled={submitting || !selectedPlanId}
          aria-busy={submitting}
          className="select-plan-continue-btn inline-flex h-11 min-w-[12rem] cursor-pointer touch-manipulation items-center justify-center rounded-full bg-brand-primary px-6 text-sm font-bold text-white shadow-md shadow-brand-primary/20 transition-all hover:bg-brand-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            getSignupPlanCta(selectedPlanId, plans)
          )}
        </button>
      </div>
    </div>
  );
}
