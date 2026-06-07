"use client";

import {
  resolveCompletedStepRedirect,
  resolvePostLoginPath,
} from "@/app/lib/onboarding-redirect";
import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type OnboardingStep = "two_factor" | "menu_setup" | "restaurant_creation";

type OnboardingRouteGuardProps = {
  step: OnboardingStep;
  restaurantId?: number;
  children: ReactNode;
};

type GuardState = "loading" | "allowed" | "redirecting";

export function OnboardingRouteGuard({
  step,
  restaurantId,
  children,
}: OnboardingRouteGuardProps) {
  const router = useRouter();
  const [state, setState] = useState<GuardState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const status = await getOnboardingStatus(restaurantId);
        if (cancelled) return;

        const completedRedirect = resolveCompletedStepRedirect(status, step);
        if (completedRedirect) {
          setState("redirecting");
          router.replace(completedRedirect);
          return;
        }

        if (status.onboardingCompleted) {
          setState("redirecting");
          router.replace(resolvePostLoginPath(status));
          return;
        }

        if (step === "two_factor" && status.nextStep !== "two_factor") {
          setState("redirecting");
          router.replace(status.redirectPath);
          return;
        }

        if (
          step === "restaurant_creation" &&
          status.nextStep !== "restaurant_creation" &&
          !status.onboardingCompleted
        ) {
          setState("redirecting");
          router.replace(status.redirectPath);
          return;
        }

        if (
          step === "menu_setup" &&
          status.nextStep !== "menu_setup" &&
          !status.onboardingCompleted
        ) {
          setState("redirecting");
          router.replace(status.redirectPath);
          return;
        }

        setState("allowed");
      } catch {
        if (!cancelled) {
          setState("allowed");
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [restaurantId, router, step]);

  if (state === "loading" || state === "redirecting") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
