"use client";

import { useQuery } from "@tanstack/react-query";
import { hasAuthSession } from "@/app/lib/auth-session";
import { isPositiveInt } from "@/app/lib/numbers";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  CAMPAIGNS_PAGE_SIZE,
  fetchCampaignById,
  fetchCampaignsByRestaurant,
  type Funnel,
  type PaginatedCampaignsResponse,
} from "@/app/services/funnel/get-campaigns-by-business";
import { funnelQueryKeys } from "@/app/services/funnel/funnel-query-keys";

const EMPTY_CAMPAIGNS: Funnel[] = [];

type UseCampaignsByRestaurantQueryOptions = {
  page?: number;
  search?: string;
  limit?: number;
};

export function useCampaignsByBusinessQuery(
  restaurantId: number | null | undefined,
  options: UseCampaignsByRestaurantQueryOptions = {},
) {
  const page = options.page ?? 1;
  const search = options.search?.trim() ?? "";
  const limit = options.limit ?? CAMPAIGNS_PAGE_SIZE;

  const query = useQuery({
    queryKey:
      restaurantId != null
        ? funnelQueryKeys.campaignsByRestaurant(restaurantId, page, search)
        : funnelQueryKeys.campaigns(),
    queryFn: async () => {
      if (!isPositiveInt(restaurantId)) {
        throw new Error("Invalid business.");
      }
      return fetchCampaignsByRestaurant(restaurantId, { page, search, limit });
    },
    enabled: isPositiveInt(restaurantId) && hasAuthSession(),
  });

  const emptyMeta: PaginatedCampaignsResponse["meta"] = {
    page,
    limit,
    total: 0,
    totalPages: 0,
  };

  return {
    data: query.data?.data ?? EMPTY_CAMPAIGNS,
    meta: query.data?.meta ?? emptyMeta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error
      ? getApiErrorMessage(query.error, "Could not load campaigns.")
      : null,
    refetch: query.refetch,
  };
}

export function useCampaignByIdQuery(
  campaignId: number | null | undefined,
) {
  const query = useQuery({
    queryKey: [...funnelQueryKeys.campaigns(), "detail", campaignId] as const,
    queryFn: async () => {
      if (!isPositiveInt(campaignId)) {
        throw new Error("Invalid campaign.");
      }
      return fetchCampaignById(campaignId);
    },
    enabled: isPositiveInt(campaignId) && hasAuthSession(),
    staleTime: 60_000,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error
      ? getApiErrorMessage(query.error, "Could not load campaign.")
      : null,
  };
}
