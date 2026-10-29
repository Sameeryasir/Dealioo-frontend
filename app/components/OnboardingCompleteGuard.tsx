"use client";

import { OnboardingPageLoading } from "@/app/components/brand/OnboardingPageLoading";
import { hasAuthSession } from "@/app/lib/auth-session";
import { redirectToLogin } from "@/app/lib/authenticated-fetch";
import { isInvitedTeamUser } from "@/app/lib/is-invited-team-user";
import { resolvePostAuthPath } from "@/app/lib/onboarding-redirect";
import {
  getOnboardingStatus,
  invalidateOnboardingStatusCache,
} from "@/app/services/onboarding/get-onboarding-status";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function OnboardingCompleteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const passedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (pathname?.startsWith("/dashboard/upgrade-plan")) {
        if (!cancelled) setAllowed(true);
        return;
      }

      if (pathname?.startsWith("/auth/select-plan")) {
        if (!cancelled) setAllowed(true);
        return;
      }

      if (!hasAuthSession()) {
        passedRef.current = false;
        if (!cancelled) redirectToLogin();
        return;
      }

      if (isInvitedTeamUser()) {
        passedRef.current = true;
        if (!cancelled) setAllowed(true);
        return;
      }

      if (passedRef.current) {
        if (!cancelled) setAllowed(true);
        return;
      }

      try {
        invalidateOnboardingStatusCache();
        const status = await getOnboardingStatus();
        if (cancelled) return;

        if (!hasAuthSession()) {
          passedRef.current = false;
          redirectToLogin();
          return;
        }

        const unpaid =
          !status.subscriptionCompleted && !status.subscriptionSelected;
        if (unpaid) {
          router.replace("/auth/select-plan");
          return;
        }

        const destination = resolvePostAuthPath(status);
        if (
          !status.onboardingCompleted &&
          destination !== pathname &&
          !destination.startsWith("/auth/select-plan")
        ) {
          router.replace(destination);
          return;
        }

        passedRef.current = true;
        if (!cancelled) setAllowed(true);
      } catch {
        passedRef.current = false;
        if (!cancelled) {
          redirectToLogin();
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!allowed) {
    return <OnboardingPageLoading />;
  }

  return <>{children}</>;
}
