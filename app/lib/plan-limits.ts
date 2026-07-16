import type { UserSubscription } from "@/app/services/subscription/user-subscription";

export const STARTER_PLAN_SLUG = "starter";
export const STARTER_MAX_BUSINESSES = 1;

export function isStarterPlanSlug(planSlug?: string | null): boolean {
  return planSlug?.trim().toLowerCase() === STARTER_PLAN_SLUG;
}

export function isStarterSubscription(
  subscription: UserSubscription | null | undefined,
): boolean {
  if (!subscription) return false;
  const status = subscription.status.trim().toLowerCase();
  if (status !== "active" && status !== "trialing") return false;
  return isStarterPlanSlug(subscription.planSlug);
}

export function isStarterBusinessLimitReachedForSubscription(
  subscription: UserSubscription | null | undefined,
  businessCount: number,
): boolean {
  if (!isStarterSubscription(subscription)) return false;
  return businessCount >= STARTER_MAX_BUSINESSES;
}
