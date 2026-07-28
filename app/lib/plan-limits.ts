import type { UserSubscription } from "@/app/services/subscription/user-subscription";

export const STARTER_PLAN_SLUG = "starter";
export const GROWTH_AI_PLAN_SLUG = "growth-ai";
export const STARTER_MAX_BUSINESSES = 1;

function isActiveOrTrialing(subscription: UserSubscription): boolean {
  const status = subscription.status.trim().toLowerCase();
  return status === "active" || status === "trialing";
}

export function isStarterPlanSlug(planSlug?: string | null): boolean {
  return planSlug?.trim().toLowerCase() === STARTER_PLAN_SLUG;
}

export function isGrowthAiPlanSlug(planSlug?: string | null): boolean {
  return planSlug?.trim().toLowerCase() === GROWTH_AI_PLAN_SLUG;
}

export function isStarterSubscription(
  subscription: UserSubscription | null | undefined,
): boolean {
  if (!subscription) return false;
  if (!isActiveOrTrialing(subscription)) return false;
  return isStarterPlanSlug(subscription.planSlug);
}

export function isGrowthAiSubscription(
  subscription: UserSubscription | null | undefined,
): boolean {
  if (!subscription) return false;
  if (!isActiveOrTrialing(subscription)) return false;
  return isGrowthAiPlanSlug(subscription.planSlug);
}

export function isStarterBusinessLimitReachedForSubscription(
  subscription: UserSubscription | null | undefined,
  businessCount: number,
): boolean {
  if (!isStarterSubscription(subscription)) return false;
  return businessCount >= STARTER_MAX_BUSINESSES;
}
