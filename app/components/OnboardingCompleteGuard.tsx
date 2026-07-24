"use client";

/**
 * Change summary:
 * - Skip onboarding redirects for invited Manager/Staff.
 * - Show centered Loading… once on entry; do not re-flash loader on every
 *   dashboard sub-route (that felt like lag).
 * Related: onboarding-redirect.ts, get-onboarding-status.ts
 */

import { OnboardingPageLoading } from "@/app/components/brand/OnboardingPageLoading";
import { isInvitedTeamUser } from "@/app/lib/is-invited-team-user";
import { resolvePostAuthPath } from "@/app/lib/onboarding-redirect";
import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function OnboardingCompleteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const verifiedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (pathname?.startsWith("/dashboard/upgrade-plan")) {
        if (!cancelled) setAllowed(true);
        return;
      }

      if (isInvitedTeamUser()) {
        verifiedRef.current = true;
        if (!cancelled) setAllowed(true);
        return;
      }

      // Already cleared for this session — keep UI smooth across dashboard links.
      if (verifiedRef.current) {
        if (!cancelled) setAllowed(true);
        return;
      }

      try {
        const status = await getOnboardingStatus();
        if (cancelled) return;

        if (!status.onboardingCompleted) {
          router.replace(resolvePostAuthPath(status));
          return;
        }

        verifiedRef.current = true;
        setAllowed(true);
      } catch {
        verifiedRef.current = true;
        if (!cancelled) setAllowed(true);
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
