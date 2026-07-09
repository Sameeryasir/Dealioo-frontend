"use client";

import { useQuery } from "@tanstack/react-query";
import { hasAuthSession, getSetupAccessToken } from "@/app/lib/auth-session";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  fetchBusinessById,
  type BusinessDetail,
} from "@/app/services/business/get-my-business";
import { businessQueryKeys } from "@/app/services/business/business-query-keys";

export function useBusinessByIdQuery(businessId: number | null) {
  const query = useQuery({
    queryKey:
      businessId != null
        ? businessQueryKeys.detail(businessId)
        : (["business", "detail", "idle"] as const),
    queryFn: () =>
      fetchBusinessById(getSetupAccessToken(), businessId as number),
    enabled: hasAuthSession() && businessId != null && businessId >= 1,
    staleTime: 120_000,
  });

  return {
    data: (query.data ?? null) as BusinessDetail | null,
    isLoading: query.isLoading,
    isPending: query.isPending,
    error: query.error
      ? getApiErrorMessage(query.error, "Could not load business.")
      : null,
    refetch: query.refetch,
  };
}
