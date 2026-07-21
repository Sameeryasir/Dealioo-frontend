"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  buildFunnelStepPath,
  clearFunnelLockedStep,
  forceFunnelLockedStep,
  getFunnelLockedStep,
  type FunnelGuardStep,
} from "@/app/lib/funnel-step-lock";

function paymentSucceededFromUrl(search: string): boolean {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  return (
    params.get("redirect_status") === "succeeded" ||
    params.get("payment_confirmed") === "1"
  );
}

function stripPaymentSuccessParams(search: string): string {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  params.delete("redirect_status");
  params.delete("payment_confirmed");
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useFunnelStepGuard(
  funnelId: number | null | undefined,
  step: FunnelGuardStep,
): void {
  const router = useRouter();

  useEffect(() => {
    if (funnelId == null || funnelId < 1) return;

    const search = window.location.search;
    const params = new URLSearchParams(
      search.startsWith("?") ? search.slice(1) : search,
    );
    const checkoutToken = params.get("checkoutToken")?.trim() || null;
    const paymentSucceeded = paymentSucceededFromUrl(search);

    if (step === "landing") {
      clearFunnelLockedStep(funnelId);
      return;
    }

    if (step === "signup") {
      clearFunnelLockedStep(funnelId);
      forceFunnelLockedStep(funnelId, "signup");

      if (checkoutToken && !paymentSucceeded) {
        router.replace(
          buildFunnelStepPath(
            funnelId,
            "payment",
            stripPaymentSuccessParams(search),
          ),
        );
      }
      return;
    }

    if (step === "payment") {
      forceFunnelLockedStep(funnelId, "payment");

      if (paymentSucceeded) {
        router.replace(
          buildFunnelStepPath(funnelId, "confirmation", search),
        );
        return;
      }

      window.history.pushState(
        { funnelStepLock: step },
        "",
        window.location.href,
      );

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
    }

    if (step === "confirmation") {
      if (!paymentSucceeded) {
        const locked = getFunnelLockedStep(funnelId);
        const fallback =
          checkoutToken || locked === "payment" ? "payment" : "signup";
        router.replace(
          buildFunnelStepPath(
            funnelId,
            fallback,
            stripPaymentSuccessParams(search),
          ),
        );
        return;
      }

      forceFunnelLockedStep(funnelId, "confirmation");

      window.history.pushState(
        { funnelStepLock: step },
        "",
        window.location.href,
      );

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
    }
  }, [funnelId, step, router]);
}
