import type { UserSubscription } from "@/app/services/subscription/user-subscription";

export const STARTER_MAX_BUSINESSES = 1;

export function isStarterPlanSlug(planSlug: string | null | undefined): boolean {
  const slug = planSlug?.trim().toLowerCase() ?? "";
  return slug === "starter" || slug.startsWith("starter-");
}

export function isStarterBusinessLimitReached(
  subscription: Pick<UserSubscription, "planSlug" | "status"> | null | undefined,
  businessCount: number,
): boolean {
  if (!subscription) return false;
  const status = subscription.status.trim().toLowerCase();
  if (status !== "active" && status !== "trialing") return false;
  if (!isStarterPlanSlug(subscription.planSlug)) return false;
  return businessCount >= STARTER_MAX_BUSINESSES;
}
