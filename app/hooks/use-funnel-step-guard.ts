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
  options?: {
    campaignType?: "prepaid" | "postpaid" | null;
  },
): void {
  const router = useRouter();
  const campaignType = options?.campaignType ?? null;

  useEffect(() => {
    if (funnelId == null || funnelId < 1) return;

    const search = window.location.search;
    const params = new URLSearchParams(
      search.startsWith("?") ? search.slice(1) : search,
    );
    if (params.get("preview") === "1") return;

    const checkoutToken = params.get("checkoutToken")?.trim() || null;
    const paymentSucceeded = paymentSucceededFromUrl(search);

    if (step === "landing") {
      clearFunnelLockedStep(funnelId);
      return;
    }

    if (step === "signup") {
      clearFunnelLockedStep(funnelId);
      forceFunnelLockedStep(funnelId, "signup");

      if (
        checkoutToken &&
        !paymentSucceeded &&
        campaignType === "prepaid"
      ) {
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
      const locked = getFunnelLockedStep(funnelId);
      const isPostpaid = campaignType === "postpaid";
      const postpaidOk =
        isPostpaid &&
        (params.get("payment_confirmed") === "1" ||
          params.get("paymentConfirmed") === "true");
      const prepaidOk =
        !isPostpaid &&
        (locked === "confirmation" || Boolean(checkoutToken) || paymentSucceeded);

      if (!postpaidOk && !prepaidOk && locked !== "confirmation") {
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
  }, [funnelId, step, router, campaignType]);
}
