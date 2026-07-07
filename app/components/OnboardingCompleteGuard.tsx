"use client";

import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type GuardState = "loading" | "allowed" | "redirecting";

export function OnboardingCompleteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<GuardState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const status = await getOnboardingStatus();
        if (cancelled) return;

        if (!status.onboardingCompleted) {
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
  }, [router]);

  if (state === "loading" || state === "redirecting") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-soft">
        <p className="text-sm text-brand-muted">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
