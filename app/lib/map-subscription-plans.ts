import type {
  BillingCycle,
  PricingPlan,
} from "@/app/components/landing/pricing-plans";
import { PRICING_PLANS } from "@/app/components/landing/pricing-plans";
import type { SubscriptionPlanListItem } from "@/app/services/subscription/get-subscription-plans";

export function mapSubscriptionPlansToPricingPlans(
  plans: SubscriptionPlanListItem[],
): PricingPlan[] {
  return plans.map((plan) => {
    const details = plan.description;
    const fallback = PRICING_PLANS.find((item) => item.id === plan.slug);
    const monthly = {
      ...(fallback?.monthly ?? {
        price: "Custom",
        period: "",
        originalPrice: null,
        promo: null,
        subline: null,
      }),
      ...(details?.monthly ?? {}),
      originalPrice:
        details?.monthly?.originalPrice ??
        fallback?.monthly.originalPrice ??
        null,
    };
    const annual = {
      ...(fallback?.annual ?? {
        price: "Custom",
        period: "",
        originalPrice: null,
        promo: null,
        subline: null,
      }),
      ...(details?.annual ?? {}),
      originalPrice:
        details?.annual?.originalPrice ??
        fallback?.annual.originalPrice ??
        null,
    };

    return {
      id: plan.slug,
      name: plan.name,
      badge: details?.badge ?? fallback?.badge ?? null,
      tagline: details?.tagline ?? fallback?.tagline ?? "",
      description: details?.summary ?? fallback?.description ?? "",
      monthly,
      annual,
      features: details?.features ?? fallback?.features,
      featureGroups: details?.featureGroups ?? fallback?.featureGroups,
      salesEmail: details?.salesEmail ?? fallback?.salesEmail ?? undefined,
      cta: details?.cta ?? fallback?.cta ?? "Continue",
      highlighted: details?.highlighted ?? fallback?.highlighted ?? false,
      color: details?.color ?? fallback?.color ?? "#1877F2",
    };
  });
}

export function getDefaultBillingCycle(
  _plans: PricingPlan[],
): BillingCycle {
  return "annual";
}

export function getDefaultSelectedPlanSlug(plans: PricingPlan[]): string {
  const highlighted = plans.find((plan) => plan.highlighted);
  return highlighted?.id ?? plans[0]?.id ?? "starter";
}
