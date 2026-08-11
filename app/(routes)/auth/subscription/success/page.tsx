"use client";

import { AuthPageLoading } from "@/app/components/brand/AuthPageShell";
import { OnboardingPageLoading } from "@/app/components/brand/OnboardingPageLoading";
import { hasAuthSession } from "@/app/lib/auth-session";
import { fetchAuthenticatedOnboardingDestination } from "@/app/lib/onboarding-redirect";
import { trackProductSubscription } from "@/app/lib/product-meta-pixel";
import { saveSelectedSignupPlan } from "@/app/lib/selected-plan-storage";
import { getSetupUser } from "@/app/lib/setup-user";
import { invalidateOnboardingStatusCache } from "@/app/services/onboarding/get-onboarding-status";
import { getSubscriptionPlans } from "@/app/services/subscription/get-subscription-plans";
import {
  waitForActiveUserSubscription,
  type UserSubscription,
} from "@/app/services/subscription/user-subscription";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const SUB_TRACK_PREFIX = "rp_meta_subscription_tracked:";

function alreadyTrackedCheckout(sessionId: string): boolean {
  try {
    return sessionStorage.getItem(`${SUB_TRACK_PREFIX}${sessionId}`) === "1";
  } catch {
    return false;
  }
}

function markCheckoutTracked(sessionId: string) {
  try {
    sessionStorage.setItem(`${SUB_TRACK_PREFIX}${sessionId}`, "1");
  } catch {}
}

async function resolvePlanValue(
  planSlug: string,
  billing: "monthly" | "annual",
): Promise<number | undefined> {
  try {
    const plans = await getSubscriptionPlans();
    const plan = plans.find((p) => p.slug === planSlug || p.id === planSlug);
    if (!plan) return undefined;
    const raw =
      billing === "annual" ? plan.yearlyPrice : plan.monthlyPrice;
    return raw != null && Number.isFinite(raw) ? raw : undefined;
  } catch {
    return undefined;
  }
}

async function trackNewUserSubscriptionPayment(
  sessionId: string,
  subscription: UserSubscription,
) {
  if (alreadyTrackedCheckout(sessionId)) return;
  markCheckoutTracked(sessionId);

  const user = getSetupUser();
  const value = await resolvePlanValue(
    subscription.planSlug,
    subscription.billingCycle,
  );

  trackProductSubscription({
    planId: subscription.planSlug,
    billing: subscription.billingCycle,
    value,
    currency: value != null ? "USD" : undefined,
    email: user?.email,
    externalId: user?.id != null ? String(user.id) : undefined,
  });
}

function SubscriptionSuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!hasAuthSession()) {
        router.replace("/auth/login");
        return;
      }

      const sessionId = searchParams.get("session_id")?.trim();
      if (!sessionId) {
        router.replace("/auth/select-plan");
        return;
      }

      try {
        // Plan turns on only after Stripe webhook checkout.session.completed.
        const subscription = await waitForActiveUserSubscription();
        if (cancelled) return;

        saveSelectedSignupPlan({
          planId: subscription.planSlug,
          billing: subscription.billingCycle,
        });

        await trackNewUserSubscriptionPayment(sessionId, subscription);
        if (cancelled) return;

        invalidateOnboardingStatusCache();

        const destination = await fetchAuthenticatedOnboardingDestination();
        if (cancelled) return;

        router.replace(destination);
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not activate your subscription.",
        );
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (errorMessage) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-brand-soft px-4">
        <p className="max-w-md text-center text-sm text-red-600">{errorMessage}</p>
      </main>
    );
  }

  return <OnboardingPageLoading />;
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<AuthPageLoading />}>
      <SubscriptionSuccessInner />
    </Suspense>
  );
}
