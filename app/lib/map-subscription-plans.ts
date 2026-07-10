import type {
  BillingCycle,
  PricingPlan,
} from "@/app/components/landing/pricing-plans";
import type { SubscriptionPlanListItem } from "@/app/services/subscription/get-subscription-plans";

export function mapSubscriptionPlansToPricingPlans(
  plans: SubscriptionPlanListItem[],
): PricingPlan[] {
  return plans.map((plan) => {
    const details = plan.description;

    return {
      id: plan.slug,
      name: plan.name,
      badge: details?.badge ?? null,
      tagline: details?.tagline ?? "",
      description: details?.summary ?? "",
      monthly: details?.monthly ?? {
        price: "Custom",
        period: "",
        promo: null,
        subline: null,
      },
      annual: details?.annual ?? {
        price: "Custom",
        period: "",
        promo: null,
        subline: null,
      },
      features: details?.features,
      featureGroups: details?.featureGroups,
      salesEmail: details?.salesEmail ?? undefined,
      cta: details?.cta ?? "Continue",
      highlighted: details?.highlighted ?? false,
      color: details?.color ?? "#1877F2",
    };
  });
}

export function getDefaultBillingCycle(
  plans: PricingPlan[],
): BillingCycle {
  return plans.length > 0 ? "monthly" : "monthly";
}

export function getDefaultSelectedPlanSlug(plans: PricingPlan[]): string {
  const highlighted = plans.find((plan) => plan.highlighted);
  return highlighted?.id ?? plans[0]?.id ?? "starter";
}
