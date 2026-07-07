import type { BillingCycle } from "@/app/components/landing/pricing-plans";

export type SelectedSignupPlan = {
  planId: string;
  billing: BillingCycle;
};

const STORAGE_KEY = "dealioo-selected-plan";

export function saveSelectedSignupPlan(selection: SelectedSignupPlan): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
}

export function readSelectedSignupPlan(): SelectedSignupPlan | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SelectedSignupPlan;
    if (!parsed?.planId || !parsed?.billing) return null;
    return parsed;
  } catch {
    return null;
  }
}
