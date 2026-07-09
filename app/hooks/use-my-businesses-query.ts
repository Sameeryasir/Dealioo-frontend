"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { hasAuthSession } from "@/app/lib/auth-session";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  fetchMyBusinesses,
  MY_RESTAURANTS_PAGE_SIZE,
  type AdminRestaurant,
  type PaginatedMyRestaurantsResponse,
} from "@/app/services/business/get-my-business";
import { businessQueryKeys } from "@/app/services/business/business-query-keys";

type UseMyRestaurantsQueryOptions = {
  page?: number;
  search?: string;
  limit?: number;
};

export function useMyBusinessesQuery(options: UseMyRestaurantsQueryOptions = {}) {
  const page = options.page ?? 1;
  const search = options.search?.trim() ?? "";
  const limit = options.limit ?? MY_RESTAURANTS_PAGE_SIZE;

  const query = useQuery({
    queryKey: businessQueryKeys.myList(page, search),
    queryFn: () => fetchMyBusinesses({ page, search, limit }),
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
      ? getApiErrorMessage(query.error, "Could not load businesses.")
      : null,
    refetch: query.refetch,
  };
}
