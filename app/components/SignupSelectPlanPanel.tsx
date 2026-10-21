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
import { clearSetupUser } from "@/app/lib/setup-user";
import { logoutSession } from "@/app/services/auth/logout";
import { AlertCircle, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
  const [loggingOut, setLoggingOut] = useState(false);
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

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setErrorMessage(null);
    try {
      await logoutSession();
      clearSetupUser();
      router.replace("/auth/login");
    } catch {
      clearSetupUser();
      router.replace("/auth/login");
    }
  }, [loggingOut, router]);

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

  if (loading || (mode === "checkout" && !planFitReady) || !billingReady) {
    return <OnboardingPageLoading />;
  }

  if (skipPlanPicker) {
    const lockedPlan =
      plans.find((plan) => plan.id === selectedPlanId) ??
      findPricingPlan(selectedPlanId) ??
      null;
    const presetPlanName = lockedPlan?.name ?? selectedPlanId;
    const tier = lockedPlan?.[billingCycle];
    const isAnnual = billingCycle === "annual";
    const billingLabel = isAnnual ? "Annual" : "Monthly";
    const billingDetail = isAnnual
      ? "Billed once per year"
      : "Billed every month";
    const featureItems: string[] = lockedPlan?.features
      ? [...lockedPlan.features]
      : lockedPlan?.featureGroups
        ? lockedPlan.featureGroups.flatMap((group) => [...group.items])
        : [];
    const featureGroups = lockedPlan?.featureGroups
      ? [...lockedPlan.featureGroups]
      : [];
    const accent = lockedPlan?.color ?? BRAND_COLORS.pink;
    const planSummary =
      lockedPlan?.description?.trim() ||
      lockedPlan?.tagline?.trim() ||
      null;

    return (
      <div className="auth-select-plan-page auth-select-plan-page--locked-paywall relative h-dvh max-h-dvh overflow-hidden bg-[#f4f7fb]">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% -10%, ${accent}22 0%, transparent 55%),
              radial-gradient(ellipse 60% 40% at 100% 100%, #1877f214 0%, transparent 50%),
              linear-gradient(180deg, #eef3f9 0%, #f7f9fc 45%, #ffffff 100%)
            `,
          }}
        />
        <AuthLandingNav
          loginHref="/auth/login"
          signupHref="/auth/signup"
          showGetStarted={false}
          showNavLinks={false}
        />
        <main className="relative z-[1] flex h-[calc(100dvh-3.75rem)] max-h-[calc(100dvh-3.75rem)] items-center justify-center overflow-hidden px-4 py-4 sm:py-5">
          <div className="mx-auto w-full max-w-lg">
            <div className="w-full overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-[0_20px_48px_-24px_rgba(15,23,42,0.32)] ring-1 ring-slate-900/5 backdrop-blur-sm">
              <div className="flex flex-col px-5 py-5 sm:px-6 sm:py-6">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-amber-800 ring-1 ring-amber-200/80">
                    Subscription required
                  </span>
                  {lockedPlan?.badge ? (
                    <span
                      className="rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-white"
                      style={{ backgroundColor: accent }}
                    >
                      {lockedPlan.badge}
                    </span>
                  ) : null}
                </div>

                <h1 className="brand-landing-display mt-2.5 text-[1.35rem] leading-tight text-brand-navy sm:text-[1.5rem]">
                  Activate your Dealioo plan
                </h1>
                <p className="mt-1 text-xs leading-snug text-slate-600 sm:text-sm">
                  Finish checkout for the plan chosen for you to unlock the app.
                </p>

                <div className="mt-4 overflow-hidden rounded-xl border border-[#e2e8f0] bg-gradient-to-b from-[#f8faff] to-white">
                  <div className="border-b border-[#e8edf5] px-4 py-3">
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
                      Your selected plan
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-end justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-lg font-bold tracking-tight text-brand-navy sm:text-xl">
                          {presetPlanName}
                        </p>
                        {planSummary ? (
                          <p className="mt-0.5 text-xs leading-snug text-slate-600">
                            {planSummary}
                          </p>
                        ) : null}
                      </div>
                      {tier ? (
                        <div className="shrink-0 text-right">
                          <div className="flex items-baseline justify-end gap-1">
                            {tier.originalPrice ? (
                              <span className="text-xs font-medium text-slate-400 line-through">
                                {tier.originalPrice}
                              </span>
                            ) : null}
                            <span className="text-xl font-bold tracking-tight text-brand-navy">
                              {tier.price}
                            </span>
                            {tier.period ? (
                              <span className="text-xs font-semibold text-slate-500">
                                {tier.period}
                              </span>
                            ) : null}
                          </div>
                          {tier.promo ? (
                            <p
                              className="mt-0.5 text-[0.65rem] font-bold"
                              style={{ color: accent }}
                            >
                              {tier.promo}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-px bg-[#e8edf5]">
                    <div className="bg-white px-4 py-2.5">
                      <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
                        Billing cycle
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-brand-navy">
                        {billingLabel}
                      </p>
                      <p className="text-[0.7rem] text-slate-500">
                        {billingDetail}
                      </p>
                    </div>
                    <div className="bg-white px-4 py-2.5">
                      <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
                        Charge
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-brand-navy">
                        {tier?.subline ??
                          (isAnnual ? "Billed annually" : "Billed monthly")}
                      </p>
                      <p className="truncate text-[0.7rem] capitalize text-slate-500">
                        {selectedPlanId.replace(/-/g, " ")}
                      </p>
                    </div>
                  </div>

                  {featureGroups.length > 0 || featureItems.length > 0 ? (
                    <div className="border-t border-[#e8edf5] px-4 py-2.5">
                      <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
                        What&apos;s included
                      </p>
                      {featureGroups.length > 0 ? (
                        <div className="mt-2 space-y-2.5">
                          {featureGroups.map((group) => (
                            <div key={group.label}>
                              <p className="mb-1 text-[0.7rem] font-bold text-brand-navy">
                                {group.label}
                              </p>
                              <ul className="space-y-1">
                                {group.items.map((feature) => (
                                  <li
                                    key={`${group.label}-${feature}`}
                                    className="flex items-start gap-2 text-[0.78rem] leading-snug text-slate-700"
                                  >
                                    <CheckCircle2
                                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                                      style={{ color: accent }}
                                      aria-hidden
                                    />
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <ul className="mt-2 space-y-1">
                          {featureItems.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-start gap-2 text-[0.78rem] leading-snug text-slate-700"
                            >
                              <CheckCircle2
                                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                                style={{ color: accent }}
                                aria-hidden
                              />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="mt-4">
                  {selectedPlanId === "enterprise" ? (
                    <p className="text-sm text-slate-600">
                      Enterprise needs a sales handoff. Contact support to
                      continue.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {errorMessage ? (
                        <div
                          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                          role="alert"
                        >
                          <AlertCircle
                            className="mt-0.5 h-3.5 w-3.5 shrink-0"
                            aria-hidden
                          />
                          <span className="line-clamp-2">{errorMessage}</span>
                        </div>
                      ) : null}
                      <button
                        type="button"
                        className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full bg-[#1877f2] px-5 text-sm font-bold text-white shadow-md shadow-[#1877f2]/30 transition hover:bg-[#0f5ed7] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={submitting || loggingOut}
                        aria-busy={submitting}
                        onClick={() => {
                          setErrorMessage(null);
                          void startCheckout(selectedPlanId, billingCycle);
                        }}
                      >
                        {submitting ? (
                          <Loader2
                            className="h-5 w-5 animate-spin"
                            aria-hidden
                          />
                        ) : errorMessage ? (
                          "Try checkout again"
                        ) : (
                          `Continue to checkout · ${presetPlanName}`
                        )}
                      </button>
                      <p className="text-center text-[0.7rem] text-slate-500">
                        Secure Stripe · {billingLabel} · {presetPlanName}
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    className="mt-4 w-full text-center text-sm font-semibold text-slate-500 underline-offset-2 transition hover:text-brand-navy hover:underline disabled:opacity-60"
                    disabled={submitting || loggingOut}
                    aria-busy={loggingOut}
                    onClick={() => void handleLogout()}
                  >
                    {loggingOut ? "Signing out…" : "Log out"}
                  </button>
                </div>
              </div>
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

      <div className="mt-6 flex flex-col items-center gap-3 sm:mt-8">
        <button
          type="button"
          onClick={() => void onContinue()}
          disabled={submitting || loggingOut || !selectedPlanId}
          aria-busy={submitting}
          className="select-plan-continue-btn inline-flex h-11 min-w-[12rem] cursor-pointer touch-manipulation items-center justify-center rounded-full bg-brand-primary px-6 text-sm font-bold text-white shadow-md shadow-brand-primary/20 transition-all hover:bg-brand-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            continueLabel
          )}
        </button>
        {mode === "checkout" ? (
          <button
            type="button"
            className="text-sm font-semibold text-slate-500 underline-offset-2 transition hover:text-brand-navy hover:underline disabled:opacity-60"
            disabled={submitting || loggingOut}
            aria-busy={loggingOut}
            onClick={() => void handleLogout()}
          >
            {loggingOut ? "Signing out…" : "Log out"}
          </button>
        ) : null}
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
