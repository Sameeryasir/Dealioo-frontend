"use client";

import {
  PRICING_PLANS,
  type PricingPlan,
} from "@/app/components/landing/pricing-plans";
import {
  getDefaultSelectedPlanSlug,
  mapSubscriptionPlansToPricingPlans,
} from "@/app/lib/map-subscription-plans";
import { getSubscriptionPlans } from "@/app/services/subscription/get-subscription-plans";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const subscriptionPlansQueryKey = ["subscription-plans"] as const;

async function fetchSubscriptionPlans(): Promise<PricingPlan[]> {
  const apiPlans = await getSubscriptionPlans();
  return apiPlans.length > 0
    ? mapSubscriptionPlansToPricingPlans(apiPlans)
    : [...PRICING_PLANS];
}

type UseSubscriptionPlansOptions = {
  enabled?: boolean;
};

export function useSubscriptionPlans(options: UseSubscriptionPlansOptions = {}) {
  const { enabled = true } = options;

  const query = useQuery({
    queryKey: [...subscriptionPlansQueryKey, "v2-original-price"] as const,
    queryFn: fetchSubscriptionPlans,
    enabled,
    staleTime: 30_000,
  });

  const plans = useMemo(() => {
    if (query.data) return query.data;
    if (query.isError) return [...PRICING_PLANS];
    return [];
  }, [query.data, query.isError]);

  const displayPlans = useMemo(
    () => (plans.length > 0 ? plans : [...PRICING_PLANS]),
    [plans],
  );

  const defaultPlanId = useMemo(
    () => getDefaultSelectedPlanSlug(displayPlans),
    [displayPlans],
  );

  const error = query.isError
    ? query.error instanceof Error
      ? query.error.message
      : "Could not load plans. Showing defaults."
    : null;

  return {
    plans: displayPlans,
    loading: enabled && query.isLoading,
    error,
    defaultPlanId,
  };
}
