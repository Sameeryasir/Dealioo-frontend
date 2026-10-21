"use client";

import { OnboardingPageLoading } from "@/app/components/brand/OnboardingPageLoading";
import { isInvitedTeamUser } from "@/app/lib/is-invited-team-user";
import { resolvePostAuthPath } from "@/app/lib/onboarding-redirect";
import {
  getOnboardingStatus,
  invalidateOnboardingStatusCache,
} from "@/app/services/onboarding/get-onboarding-status";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export function OnboardingCompleteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setAllowed(false);

    async function run() {
      if (pathname?.startsWith("/dashboard/upgrade-plan")) {
        if (!cancelled) setAllowed(true);
        return;
      }

      if (pathname?.startsWith("/auth/select-plan")) {
        if (!cancelled) setAllowed(true);
        return;
      }

      if (isInvitedTeamUser()) {
        if (!cancelled) setAllowed(true);
        return;
      }

      try {
        invalidateOnboardingStatusCache();
        const status = await getOnboardingStatus();
        if (cancelled) return;

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

        if (!cancelled) setAllowed(true);
      } catch {
        if (!cancelled) {
          router.replace("/auth/select-plan");
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
