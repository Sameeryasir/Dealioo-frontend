import type { BillingCycle } from "@/app/components/landing/pricing-plans";
import { readSelectedSignupPlan, saveSelectedSignupPlan } from "@/app/lib/selected-plan-storage";
import { readSignupProgress, saveSignupProgress } from "@/app/lib/signup-progress-storage";

export function isBillingCycle(value: unknown): value is BillingCycle {
  return value === "monthly" || value === "annual";
}

export function appendBillingQuery(href: string, billing: BillingCycle): string {
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}billing=${encodeURIComponent(billing)}`;
}

export function readBillingCyclePreference(): BillingCycle {
  if (typeof window === "undefined") return "annual";

  const fromUrl = new URLSearchParams(window.location.search).get("billing");
  if (isBillingCycle(fromUrl)) return fromUrl;

  const fromSelected = readSelectedSignupPlan()?.billing;
  if (isBillingCycle(fromSelected)) return fromSelected;

  const fromProgress = readSignupProgress()?.billing;
  if (isBillingCycle(fromProgress)) return fromProgress;

  return "annual";
}

export function persistBillingCyclePreference(
  billing: BillingCycle,
  planId?: string,
): void {
  const progress = readSignupProgress();
  if (progress) {
    saveSignupProgress({
      ...progress,
      billing,
      ...(planId ? { selectedPlanId: planId } : {}),
    });
  }

  const selected = readSelectedSignupPlan();
  if (selected || planId) {
    saveSelectedSignupPlan({
      planId: planId ?? selected?.planId ?? "starter",
      billing,
    });
  }
}
