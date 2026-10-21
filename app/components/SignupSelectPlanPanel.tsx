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
import { OnboardingPageLoading } from "@/app/components/brand/OnboardingPageLoading";
import { savePlanFit, getPlanFit } from "@/app/services/onboarding/save-plan-fit";
import { startUserPlanCheckout } from "@/app/services/subscription/user-subscription";
import { upgradeUserSubscription } from "@/app/services/subscription/upgrade-user-subscription";
import {
  previewUpgradeSubscription,
  type PreviewUpgradeSubscriptionResult,
} from "@/app/services/subscription/preview-upgrade-subscription";
import { getBillingOverview } from "@/app/services/subscription/billing";
import { loadDealiooStripe } from "@/app/lib/load-dealioo-stripe";
import {
  isPlanFitComplete,
  isPlanFitPlanId,
  type PlanFitAnswers,
  type PlanFitPlanId,
} from "@/app/lib/plan-fit-questionnaire";
import { AlertCircle, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

async function confirmUpgradePaymentIfRequired(
  paymentIntentClientSecret: string | null | undefined,
): Promise<void> {
  const clientSecret = paymentIntentClientSecret?.trim();
  if (!clientSecret) return;

  const publishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  if (!publishableKey) {
    throw new Error(
      "Card confirmation is required, but Stripe is not configured in this app.",
    );
  }

  const stripe = await loadDealiooStripe(publishableKey);
  if (!stripe) {
    throw new Error("Could not load Stripe to confirm your upgrade payment.");
  }

  const result = await stripe.confirmCardPayment(clientSecret);
  if (result.error) {
    throw new Error(
      result.error.message ?? "Could not confirm the upgrade payment.",
    );
  }

  const status = result.paymentIntent?.status;
  if (status !== "succeeded" && status !== "processing") {
    throw new Error("Upgrade payment was not completed. Please try again.");
  }
}

type SignupSelectPlanPanelProps = {
  mode?: "checkout" | "upgrade";
  presetPlanId?: string | null;
  presetBillingCycle?: BillingCycle | null;
  autoCheckout?: boolean;
  checkoutOnBillingChange?: boolean;
};

export function SignupSelectPlanPanel({
  mode = "checkout",
  presetPlanId = null,
  presetBillingCycle = null,
  autoCheckout = false,
  checkoutOnBillingChange = false,
}: SignupSelectPlanPanelProps) {
  const invalidateMySubscription = useInvalidateMyUserSubscription();
  const { plans, loading, error: plansError, defaultPlanId } =
    useSubscriptionPlans();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");
  const [billingReady, setBillingReady] = useState(false);
  const hasPresetPlan = Boolean(presetPlanId?.trim());
  const skipPlanPicker =
    mode === "checkout" && autoCheckout && hasPresetPlan;
  const [selectedPlanId, setSelectedPlanId] = useState(
    presetPlanId?.trim() || "starter",
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [upgradeSuccessOpen, setUpgradeSuccessOpen] = useState(false);
  const [upgradedPlanName, setUpgradedPlanName] = useState<string | null>(null);
  const [upgradePreviewOpen, setUpgradePreviewOpen] = useState(false);
  const [upgradePreviewLoading, setUpgradePreviewLoading] = useState(false);
  const [upgradePreview, setUpgradePreview] =
    useState<PreviewUpgradeSubscriptionResult | null>(null);
  const [quizDone, setQuizDone] = useState(mode !== "checkout" || hasPresetPlan);
  const [recommendation, setRecommendation] = useState<PlanFitResult | null>(
    null,
  );
  const [planFitReady, setPlanFitReady] = useState(
    mode !== "checkout" || hasPresetPlan,
  );
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [draftAnswers, setDraftAnswers] = useState<Partial<PlanFitAnswers> | null>(
    null,
  );
  const [draftQuestionIndex, setDraftQuestionIndex] = useState<number | null>(
    null,
  );
  const restoredPlanFitRef = useRef(false);
  const autoCheckoutStartedRef = useRef(false);

  useEffect(() => {
    if (
      presetBillingCycle === "monthly" ||
      presetBillingCycle === "annual"
    ) {
      setBillingCycle(presetBillingCycle);
      persistBillingCyclePreference(
        presetBillingCycle,
        presetPlanId?.trim() || undefined,
      );
    } else {
      setBillingCycle(readBillingCyclePreference());
    }
    setBillingReady(true);
  }, [presetBillingCycle, presetPlanId]);

  useEffect(() => {
    const preset = presetPlanId?.trim();
    if (!preset) return;
    setSelectedPlanId(preset);
    setQuizDone(true);
    setPlanFitReady(true);
  }, [presetPlanId]);

  useEffect(() => {
    if (mode !== "checkout") return;
    if (hasPresetPlan) return;

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
        } else if (saved.draftAnswers) {
          setDraftAnswers(saved.draftAnswers);
          setDraftQuestionIndex(saved.draftQuestionIndex);
        }
      } catch {
      } finally {
        if (!cancelled) {
          restoredPlanFitRef.current = true;
          setPlanFitReady(true);
        }
      }
    })();

    const maxWait = window.setTimeout(() => {
      if (!cancelled) setPlanFitReady(true);
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(maxWait);
    };
  }, [hasPresetPlan, mode]);

  useEffect(() => {
    if (!loading && plans.length > 0 && !recommendation && !hasPresetPlan) {
      setSelectedPlanId(defaultPlanId);
    }
  }, [defaultPlanId, hasPresetPlan, loading, plans.length, recommendation]);

  useEffect(() => {
    if (hasPresetPlan) return;
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
  }, [defaultPlanId, hasPresetPlan, plans, recommendation]);

  useEffect(() => {
    if (!billingReady) return;
    persistBillingCyclePreference(billingCycle, selectedPlanId);
  }, [billingCycle, billingReady, selectedPlanId]);

  const startCheckout = useCallback(
    async (planSlug: string, cycle: BillingCycle) => {
      if (!planSlug) return;
      setErrorMessage(null);
      setSubmitting(true);
      try {
        saveSelectedSignupPlan({
          planId: planSlug,
          billing: cycle,
        });
        const checkout = await startUserPlanCheckout({
          planSlug,
          billingCycle: cycle,
          checkoutAttemptId:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        });
        window.location.assign(checkout.checkoutUrl);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not start checkout. Try again.";
        setErrorMessage(message);
        setSubmitting(false);
        autoCheckoutStartedRef.current = false;
      }
    },
    [],
  );

  const handleBillingChange = useCallback(
    (cycle: BillingCycle) => {
      setBillingCycle(cycle);
      persistBillingCyclePreference(cycle, selectedPlanId);
      if (
        mode === "checkout" &&
        checkoutOnBillingChange &&
        selectedPlanId &&
        selectedPlanId !== "enterprise"
      ) {
        void startCheckout(selectedPlanId, cycle);
      }
    },
    [checkoutOnBillingChange, mode, selectedPlanId, startCheckout],
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

  const closeUpgradePreview = useCallback(() => {
    if (submitting) return;
    setUpgradePreviewOpen(false);
    setUpgradePreview(null);
  }, [submitting]);

  const confirmUpgrade = useCallback(async () => {
    if (!selectedPlanId || mode !== "upgrade") return;

    setErrorMessage(null);
    setSubmitting(true);

    try {
      const upgraded = await upgradeUserSubscription({
        planSlug: selectedPlanId,
        billingCycle,
      });
      await confirmUpgradePaymentIfRequired(
        upgraded.paymentIntentClientSecret,
      );
      if (upgraded.paymentIntentClientSecret?.trim()) {
        await getBillingOverview().catch(() => null);
      }

      saveSelectedSignupPlan({
        planId: selectedPlanId,
        billing: billingCycle,
      });

      const planName =
        upgradePreview?.targetPlanName ||
        plans.find((plan) => plan.id === selectedPlanId)?.name ||
        findPricingPlan(selectedPlanId)?.name ||
        selectedPlanId;
      setUpgradePreviewOpen(false);
      setUpgradePreview(null);
      setUpgradedPlanName(planName);
      setUpgradeSuccessOpen(true);
      setSubmitting(false);
      void invalidateMySubscription();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not upgrade your plan. Try again.";
      setErrorMessage(message);
      setSubmitting(false);
    }
  }, [
    billingCycle,
    invalidateMySubscription,
    mode,
    plans,
    selectedPlanId,
    upgradePreview,
  ]);

  const onContinue = useCallback(async () => {
    if (!selectedPlanId) return;

    setErrorMessage(null);

    if (mode === "checkout") {
      await startCheckout(selectedPlanId, billingCycle);
      return;
    }

    if (mode !== "upgrade") return;

    setUpgradePreviewLoading(true);
    setUpgradePreviewOpen(true);
    setUpgradePreview(null);

    try {
      const preview = await previewUpgradeSubscription({
        planSlug: selectedPlanId,
        billingCycle,
      });
      setUpgradePreview(preview);
    } catch (error) {
      setUpgradePreviewOpen(false);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not preview this plan change.",
      );
    } finally {
      setUpgradePreviewLoading(false);
    }
  }, [billingCycle, mode, selectedPlanId, startCheckout]);

  useEffect(() => {
    if (!skipPlanPicker) return;
    if (!billingReady || !planFitReady || loading || !selectedPlanId) return;
    if (selectedPlanId === "enterprise") return;
    if (submitting || errorMessage) return;
    if (autoCheckoutStartedRef.current) return;
    autoCheckoutStartedRef.current = true;
    const timer = window.setTimeout(() => {
      void startCheckout(selectedPlanId, billingCycle);
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [
    billingCycle,
    billingReady,
    errorMessage,
    loading,
    planFitReady,
    selectedPlanId,
    skipPlanPicker,
    startCheckout,
    submitting,
  ]);

  if (loading || (mode === "checkout" && !planFitReady) || !billingReady) {
    return <OnboardingPageLoading />;
  }

  if (skipPlanPicker) {
    const presetPlanName =
      plans.find((plan) => plan.id === selectedPlanId)?.name ??
      findPricingPlan(selectedPlanId)?.name ??
      selectedPlanId;
    const billingLabel =
      billingCycle === "monthly" ? "Monthly billing" : "Annual billing";

    return (
      <div className="auth-select-plan-page">
        <AuthLandingNav
          loginHref="/auth/login"
          signupHref="/auth/signup"
          showGetStarted={false}
          showNavLinks={false}
        />
        <main className="auth-select-plan-main">
          <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-10">
            <div className="w-full rounded-2xl border border-[#e8edf5] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">
                Subscription required
              </p>
              <h1 className="brand-landing-display mt-2 text-2xl text-brand-navy sm:text-[1.75rem]">
                No subscription yet
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-[0.95rem]">
                You don&apos;t have an active Dealioo plan. We&apos;re taking
                you to secure checkout for the plan you already chose — then you
                can use the app.
              </p>

              <div className="mt-5 rounded-xl border border-[#e8edf5] bg-[#f8faff] px-4 py-3 text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  Selected plan
                </p>
                <p className="mt-1 text-base font-bold text-brand-navy">
                  {presetPlanName}
                </p>
                <p className="mt-0.5 text-sm text-slate-600">{billingLabel}</p>
              </div>

              {selectedPlanId === "enterprise" ? (
                <p className="mt-5 text-sm text-slate-600">
                  Enterprise needs a sales handoff. We&apos;ll follow up to
                  finish setup, or contact support to continue.
                </p>
              ) : errorMessage ? (
                <div className="mt-5 space-y-3">
                  <div
                    className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                    role="alert"
                  >
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden
                    />
                    <span>{errorMessage}</span>
                  </div>
                  <button
                    type="button"
                    className="landing-btn-primary inline-flex h-10 w-full items-center justify-center rounded-full px-5 text-sm font-bold"
                    onClick={() => {
                      autoCheckoutStartedRef.current = false;
                      setErrorMessage(null);
                      void startCheckout(selectedPlanId, billingCycle);
                    }}
                  >
                    Try checkout again
                  </button>
                </div>
              ) : (
                <div
                  className="mt-6 flex flex-col items-center gap-2 text-center"
                  role="status"
                  aria-live="polite"
                >
                  <Loader2
                    className="h-7 w-7 animate-spin text-brand-primary"
                    aria-hidden
                  />
                  <p className="text-sm font-semibold text-brand-navy">
                    Taking you to the checkout page…
                  </p>
                  <p className="text-xs text-slate-500">
                    Stay on this screen — Stripe will open next.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
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
          initialDraftAnswers={draftAnswers}
          initialDraftQuestionIndex={draftQuestionIndex}
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
        open={upgradePreviewOpen}
        title="Confirm plan change"
        description={
          upgradePreviewLoading
            ? "Calculating today’s prorated charge…"
            : upgradePreview?.summary ||
              "Review the prorated charge, then confirm to update your plan."
        }
        icon={CheckCircle2}
        tone="primary"
        cancelLabel="Keep current plan"
        confirmLabel={
          upgradePreviewLoading
            ? "Calculating…"
            : upgradePreview && upgradePreview.amountDueCents > 0
              ? `Pay ${upgradePreview.amountDueFormatted} & change plan`
              : "Confirm plan change"
        }
        isLoading={submitting || upgradePreviewLoading}
        confirmDisabled={upgradePreviewLoading || !upgradePreview}
        onCancel={closeUpgradePreview}
        onConfirm={() => void confirmUpgrade()}
      />

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
