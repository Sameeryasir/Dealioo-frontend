"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { hasAuthSession } from "@/app/lib/auth-session";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  fetchMyRestaurants,
  MY_RESTAURANTS_PAGE_SIZE,
  type AdminRestaurant,
  type PaginatedMyRestaurantsResponse,
} from "@/app/services/restaurant/get-my-restaurant";
import { restaurantQueryKeys } from "@/app/services/restaurant/restaurant-query-keys";

type UseMyRestaurantsQueryOptions = {
  page?: number;
  search?: string;
  limit?: number;
};

export function useMyRestaurantsQuery(options: UseMyRestaurantsQueryOptions = {}) {
  const page = options.page ?? 1;
  const search = options.search?.trim() ?? "";
  const limit = options.limit ?? MY_RESTAURANTS_PAGE_SIZE;

  const query = useQuery({
    queryKey: restaurantQueryKeys.myList(page, search),
    queryFn: () => fetchMyRestaurants({ page, search, limit }),
    enabled: hasAuthSession(),
    staleTime: 120_000,
    placeholderData: keepPreviousData,
  });

  const emptyMeta: PaginatedMyRestaurantsResponse["meta"] = {
    page,
    limit,
    total: 0,
    totalPages: 0,
  };

  return {
    data: query.data?.data ?? ([] as AdminRestaurant[]),
    meta: query.data?.meta ?? emptyMeta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isPending: query.isPending,
    error: query.error
      ? getApiErrorMessage(query.error, "Could not load restaurants.")
      : null,
    refetch: query.refetch,
  };
}
