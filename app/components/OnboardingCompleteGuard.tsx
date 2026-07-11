"use client";

import { resolvePostAuthPath } from "@/app/lib/onboarding-redirect";
import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export function OnboardingCompleteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const status = await getOnboardingStatus();
        if (cancelled) return;

        if (!status.onboardingCompleted) {
          router.replace(resolvePostAuthPath(status));
        }
      } catch {
        // Allow the page to render; onboarding can be retried from the next screen.
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return <>{children}</>;
}
