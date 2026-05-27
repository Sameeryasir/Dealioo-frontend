"use client";

import { useQuery } from "@tanstack/react-query";
import { hasAuthSession } from "@/app/lib/auth-session";
import { isPositiveInt } from "@/app/lib/numbers";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  fetchCampaignsByRestaurant,
  type Funnel,
} from "@/app/services/funnel/get-campaigns-by-restaurant";
import { funnelQueryKeys } from "@/app/services/funnel/funnel-query-keys";

export function useCampaignsByRestaurantQuery(
  restaurantId: number | null | undefined,
) {
  const query = useQuery({
    queryKey:
      restaurantId != null
        ? funnelQueryKeys.campaignsByRestaurant(restaurantId)
        : funnelQueryKeys.campaigns(),
    queryFn: async () => {
      if (!isPositiveInt(restaurantId)) {
        throw new Error("Invalid restaurant.");
      }
      return fetchCampaignsByRestaurant(restaurantId);
    },
    enabled: isPositiveInt(restaurantId) && hasAuthSession(),
  });

  return {
    data: query.data ?? ([] as Funnel[]),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error
      ? getApiErrorMessage(query.error, "Could not load campaigns.")
      : null,
    refetch: query.refetch,
  };
}
