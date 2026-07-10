"use client";

import { AuthLandingNav } from "@/app/components/auth/AuthLandingNav";
import { SignupSelectPlanPanel } from "@/app/components/SignupSelectPlanPanel";
import { AuthPageLoading } from "@/app/components/brand/AuthPageShell";
import { hasAuthSession } from "@/app/lib/auth-session";
import { fetchAuthenticatedOnboardingDestination } from "@/app/lib/onboarding-redirect";
import { getMyUserSubscription } from "@/app/services/subscription/user-subscription";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function SelectPlanPageInner() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!hasAuthSession()) {
        router.replace("/auth/signup");
        return;
      }

      try {
        const destination = await fetchAuthenticatedOnboardingDestination();
        if (cancelled) return;

        if (destination !== "/auth/select-plan") {
          router.replace(destination);
          return;
        }
      } catch {
        if (cancelled) return;

        try {
          const subscription = await getMyUserSubscription();
          if (cancelled) return;

          if (subscription?.status === "active" || subscription?.status === "trialing") {
            router.replace("/business/register");
            return;
          }
        } catch {
          if (cancelled) return;
        }
      }

      if (!cancelled) {
        setReady(true);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return <AuthPageLoading />;
  }

  return (
    <div className="auth-select-plan-page">
      <AuthLandingNav loginHref="/auth/login" signupHref="/auth/signup" />

      <main className="auth-select-plan-main">
        <div className="auth-select-plan-header mx-auto max-w-3xl text-center">
          <h1 className="brand-landing-display auth-signup-step-title">
            Choose your <span className="landing-hero-accent-blue">plan</span>
          </h1>
          <p className="auth-signup-step-sub mt-1.5">
            Pick the plan that fits your business. You can change it later.
          </p>
        </div>

        <SignupSelectPlanPanel />
      </main>
    </div>
  );
}

export default function SelectPlanPage() {
  return (
    <Suspense fallback={<AuthPageLoading />}>
      <SelectPlanPageInner />
    </Suspense>
  );
}
