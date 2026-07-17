"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  buildFunnelStepPath,
  funnelStepIsAtLeast,
  markFunnelLockedStep,
  type FunnelLockedStep,
} from "@/app/lib/funnel-step-lock";

/**
 * Locks funnel navigation after signup/payment so browser Back cannot reopen
 * earlier steps. Also redirects if the guest opens an earlier URL manually.
 */
export function useFunnelStepGuard(
  funnelId: number | null | undefined,
  step: FunnelLockedStep,
): void {
  const router = useRouter();

  useEffect(() => {
    if (funnelId == null || funnelId < 1) return;

    markFunnelLockedStep(funnelId, step);

    if (step === "signup" && funnelStepIsAtLeast(funnelId, "payment")) {
      const target = funnelStepIsAtLeast(funnelId, "confirmation")
        ? "confirmation"
        : "payment";
      router.replace(
        buildFunnelStepPath(funnelId, target, window.location.search),
      );
      return;
    }

    if (step === "payment" && funnelStepIsAtLeast(funnelId, "confirmation")) {
      router.replace(
        buildFunnelStepPath(
          funnelId,
          "confirmation",
          window.location.search,
        ),
      );
      return;
    }

    if (step !== "payment" && step !== "confirmation") {
      return;
    }

    window.history.pushState({ funnelStepLock: step }, "", window.location.href);

    const onPopState = () => {
      window.history.pushState(
        { funnelStepLock: step },
        "",
        window.location.href,
      );
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [funnelId, step, router]);
}
