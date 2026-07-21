"use client";

import { AuthLandingNav } from "@/app/components/auth/AuthLandingNav";
import {
  getSignupPlanCta,
  SignupPlanStep,
} from "@/app/components/auth/SignupPlanStep";
import {
  PlanFitQuestionnaire,
  type PlanFitResult,
} from "@/app/components/auth/PlanFitQuestionnaire";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import type { BillingCycle } from "@/app/components/landing/pricing-plans";
import { findPricingPlan } from "@/app/components/landing/pricing-plans";
import { BRAND_COLORS } from "@/app/components/landing/landing-brand";
import { useSubscriptionPlans } from "@/app/hooks/use-subscription-plans";
import {
  persistBillingCyclePreference,
  readBillingCyclePreference,
} from "@/app/lib/billing-cycle";
import { saveSelectedSignupPlan } from "@/app/lib/selected-plan-storage";
import { useInvalidateMyUserSubscription } from "@/app/hooks/use-my-user-subscription";
import { savePlanFit, getPlanFit } from "@/app/services/onboarding/save-plan-fit";
import { startUserPlanCheckout } from "@/app/services/subscription/user-subscription";
import { upgradeUserSubscription } from "@/app/services/subscription/upgrade-user-subscription";
import {
  isPlanFitComplete,
  isPlanFitPlanId,
  type PlanFitAnswers,
  type PlanFitPlanId,
} from "@/app/lib/plan-fit-questionnaire";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

function isContactSalesPlan(planId: string, plans: readonly { id: string; cta?: string }[]): boolean {
  const fromList = plans.find((plan) => plan.id === planId);
  const cta = fromList?.cta ?? findPricingPlan(planId)?.cta ?? "";
  return cta.toLowerCase().includes("contact");
}

type SignupSelectPlanPanelProps = {
  mode?: "checkout" | "upgrade";
};

export function SignupSelectPlanPanel({
  mode = "checkout",
}: SignupSelectPlanPanelProps) {
  const router = useRouter();
  const invalidateMySubscription = useInvalidateMyUserSubscription();
  const { plans, loading, error: plansError, defaultPlanId } =
    useSubscriptionPlans();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");
  const [billingReady, setBillingReady] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("starter");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [upgradeSuccessOpen, setUpgradeSuccessOpen] = useState(false);
  const [upgradedPlanName, setUpgradedPlanName] = useState<string | null>(null);
  const [quizDone, setQuizDone] = useState(mode !== "checkout");
  const [recommendation, setRecommendation] = useState<PlanFitResult | null>(
    null,
  );
  const [planFitReady, setPlanFitReady] = useState(mode !== "checkout");
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const restoredPlanFitRef = useRef(false);

  useEffect(() => {
    setBillingCycle(readBillingCyclePreference());
    setBillingReady(true);
  }, []);

  useEffect(() => {
    if (mode !== "checkout") return;

    let cancelled = false;

    void (async () => {
      try {
        const saved = await getPlanFit();
        if (cancelled || restoredPlanFitRef.current) return;

        if (saved.answers && isPlanFitComplete(saved.answers)) {
          const rec = saved.recommendation;
          const recommended: PlanFitPlanId =
            rec && isPlanFitPlanId(rec.planSlug)
              ? rec.planSlug
              : saved.planFitRecommendedPlan &&
                  isPlanFitPlanId(saved.planFitRecommendedPlan)
                ? saved.planFitRecommendedPlan
                : "starter";
          setRecommendation({
            planId: recommended,
            reason: rec?.reason ?? "",
            answers: saved.answers,
            confidence: rec?.confidence,
            scores: rec?.scores,
          });
          setSelectedPlanId(recommended);
          setQuizDone(true);
        }
      } catch {
      } finally {
        if (!cancelled) {
          restoredPlanFitRef.current = true;
          setPlanFitReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    if (!loading && plans.length > 0 && !recommendation) {
      setSelectedPlanId(defaultPlanId);
    }
  }, [defaultPlanId, loading, plans.length, recommendation]);

  useEffect(() => {
    if (!recommendation || plans.length === 0) return;
    const availableIds = new Set(plans.map((plan) => plan.id));
    if (!availableIds.has(recommendation.planId)) {
      const fallback = availableIds.has(defaultPlanId)
        ? defaultPlanId
        : (plans[0]?.id ?? defaultPlanId);
      setRecommendation((prev) =>
        prev
          ? { ...prev, planId: fallback as PlanFitPlanId }
          : prev,
      );
      setSelectedPlanId(fallback);
      return;
    }
    setSelectedPlanId((current) =>
      availableIds.has(current) ? current : recommendation.planId,
    );
  }, [defaultPlanId, plans, recommendation]);

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

  const handleQuizComplete = useCallback(
    async (answers: PlanFitAnswers) => {
      setQuizSubmitting(true);
      setErrorMessage(null);

      try {
        const saved = await savePlanFit(answers);
        const availableIds = new Set(plans.map((plan) => plan.id));
        const recommendedSlug = saved.recommendation.planSlug;
        const planId = availableIds.has(recommendedSlug)
          ? recommendedSlug
          : defaultPlanId;

        setRecommendation({
          planId: planId as PlanFitPlanId,
          reason: saved.recommendation.reason,
          answers: saved.answers,
          confidence: saved.recommendation.confidence,
          scores: saved.recommendation.scores,
        });
        setSelectedPlanId(planId);
        setQuizDone(true);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not save your quiz answers. Please try again.";
        setErrorMessage(message);
      } finally {
        setQuizSubmitting(false);
      }
    },
    [defaultPlanId, plans],
  );

  const handleRetakeQuiz = useCallback(() => {
    setQuizDone(false);
    setRecommendation(null);
  }, []);

  const goToDashboard = useCallback(() => {
    window.location.assign("/dashboard");
  }, []);

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

      if (mode === "upgrade") {
        await upgradeUserSubscription({
          planSlug: selectedPlanId,
          billingCycle,
        });

        saveSelectedSignupPlan({
          planId: selectedPlanId,
          billing: billingCycle,
        });

        const planName =
          plans.find((plan) => plan.id === selectedPlanId)?.name ??
          findPricingPlan(selectedPlanId)?.name ??
          selectedPlanId;
        setUpgradedPlanName(planName);
        setUpgradeSuccessOpen(true);
        setSubmitting(false);
        void invalidateMySubscription();
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
          : mode === "upgrade"
            ? "Could not upgrade your plan. Try again."
            : "Could not start checkout. Try again.";

      if (
        mode === "checkout" &&
        message.toLowerCase().includes("already have an active subscription")
      ) {
        router.replace("/business/register");
        return;
      }

      setErrorMessage(message);
      setSubmitting(false);
    }
  }, [billingCycle, invalidateMySubscription, mode, plans, router, selectedPlanId]);

  if (loading || (mode === "checkout" && !planFitReady)) {
    return (
      <div className="flex min-h-[20rem] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" aria-hidden />
      </div>
    );
  }

  if (mode === "checkout" && !quizDone) {
    return (
      <div>
        {errorMessage ? (
          <div
            className="mx-auto mb-4 flex max-w-xl items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{errorMessage}</span>
          </div>
        ) : null}
        <PlanFitQuestionnaire
          onComplete={handleQuizComplete}
          submitting={quizSubmitting}
        />
      </div>
    );
  }

  const alertMessage = errorMessage ?? plansError;
  const continueLabel =
    mode === "upgrade"
      ? "Upgrade plan"
      : getSignupPlanCta(selectedPlanId, plans);
  const recommendedName =
    plans.find((plan) => plan.id === recommendation?.planId)?.name ??
    findPricingPlan(recommendation?.planId ?? "")?.name ??
    null;
  const recommendedColor =
    recommendation?.planId === "starter"
      ? BRAND_COLORS.pink
      : (plans.find((plan) => plan.id === recommendation?.planId)?.color ??
        findPricingPlan(recommendation?.planId ?? "")?.color ??
        BRAND_COLORS.pink);

  const plansPanel = (
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

      {mode === "checkout" && recommendation ? (
        <div className="mb-5 flex flex-col items-center gap-2 text-center sm:mb-6">
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            Based on your answers, we suggest{" "}
            <span
              className="font-bold"
              style={{ color: recommendedColor }}
            >
              {recommendedName ?? recommendation.planId}
            </span>
            . {recommendation.reason} You can still pick any plan below.
          </p>
          <button
            type="button"
            onClick={handleRetakeQuiz}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-[#1877f2]"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Retake questions
          </button>
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
          recommendedPlanId={recommendation?.planId ?? null}
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
            continueLabel
          )}
        </button>
      </div>

      <ConfirmDialog
        open={upgradeSuccessOpen}
        title="Plan upgraded"
        description={
          upgradedPlanName
            ? `You're now on the ${upgradedPlanName} plan. Your card on file was charged for any prorated difference.`
            : "Your subscription was updated successfully."
        }
        icon={CheckCircle2}
        tone="primary"
        cancelLabel="Stay here"
        confirmLabel="Go to dashboard"
        onCancel={() => setUpgradeSuccessOpen(false)}
        onConfirm={goToDashboard}
      />
    </div>
  );

  if (mode === "upgrade") {
    return plansPanel;
  }

  return (
    <div className="auth-select-plan-page">
      <AuthLandingNav
        loginHref="/auth/login"
        signupHref="/auth/signup"
        showGetStarted={false}
        showNavLinks={false}
      />
      <main className="auth-select-plan-main">
        <div className="auth-select-plan-header mx-auto max-w-3xl text-center">
          <h1 className="brand-landing-display auth-signup-step-title">
            Choose your <span className="landing-hero-accent-blue">plan</span>
          </h1>
        </div>
        {plansPanel}
      </main>
    </div>
  );
}
