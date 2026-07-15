import { getSetupUser } from "@/app/lib/setup-user";

export const STARTER_PLAN_SLUG = "starter";
export const STARTER_MAX_BUSINESSES = 1;

export function isStarterPlan(): boolean {
  const plan = getSetupUser()?.plan;
  if (!plan) return false;

  const slug = plan.planSlug.trim().toLowerCase();
  const name = plan.planName.trim().toLowerCase();
  return slug === STARTER_PLAN_SLUG || name === STARTER_PLAN_SLUG;
}

export function isStarterBusinessLimitReached(businessCount: number): boolean {
  if (!isStarterPlan()) return false;
  return businessCount >= STARTER_MAX_BUSINESSES;
}
