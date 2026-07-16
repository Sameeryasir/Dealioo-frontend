"use client";

import { resolvePostAuthPath } from "@/app/lib/onboarding-redirect";
import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export function OnboardingCompleteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (pathname?.startsWith("/dashboard/upgrade-plan")) {
        return;
      }

      try {
        const status = await getOnboardingStatus();
        if (cancelled) return;

        if (!status.onboardingCompleted) {
          router.replace(resolvePostAuthPath(status));
        }
      } catch {
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return <>{children}</>;
}
