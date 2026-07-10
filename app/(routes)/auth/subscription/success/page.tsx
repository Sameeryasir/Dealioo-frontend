"use client";

import { AuthPageLoading } from "@/app/components/brand/AuthPageShell";
import { hasAuthSession } from "@/app/lib/auth-session";
import { resolvePostAuthPath } from "@/app/lib/onboarding-redirect";
import { saveSelectedSignupPlan } from "@/app/lib/selected-plan-storage";
import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import {
  completeUserPlanCheckout,
  waitForActiveUserSubscription,
} from "@/app/services/subscription/user-subscription";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function SubscriptionSuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState(
    "Payment received. Activating your subscription…",
  );

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
        let subscription;
        try {
          subscription = await completeUserPlanCheckout(sessionId);
        } catch {
          subscription = await waitForActiveUserSubscription();
        }
        if (cancelled) return;

        saveSelectedSignupPlan({
          planId: subscription.planSlug,
          billing: subscription.billingCycle,
        });

        const status = await getOnboardingStatus();
        if (cancelled) return;

        router.replace(resolvePostAuthPath(status));
      } catch (error) {
        if (cancelled) return;
        setMessage(
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

  return (
    <main className="flex min-h-dvh items-center justify-center bg-brand-soft px-4">
      <p className="max-w-md text-center text-sm text-brand-muted">{message}</p>
    </main>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<AuthPageLoading />}>
      <SubscriptionSuccessInner />
    </Suspense>
  );
}
