"use client";

import { AuthLandingNav } from "@/app/components/auth/AuthLandingNav";
import { SignupSelectPlanPanel } from "@/app/components/SignupSelectPlanPanel";
import { AuthPageLoading } from "@/app/components/brand/AuthPageShell";
import { hasAuthSession } from "@/app/lib/auth-session";
import { isInvitedTeamUser } from "@/app/lib/is-invited-team-user";
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

      if (isInvitedTeamUser()) {
        router.replace("/dashboard");
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

  return <SignupSelectPlanPanel />;
}

export default function SelectPlanPage() {
  return (
    <Suspense fallback={<AuthPageLoading />}>
      <SelectPlanPageInner />
    </Suspense>
  );
}
