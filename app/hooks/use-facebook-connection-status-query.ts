"use client";

import { useQuery } from "@tanstack/react-query";
import { getSetupAccessToken, hasAuthSession } from "@/app/lib/auth-session";
import { adsStatsQueryKeys } from "@/app/lib/ads-stats-query-keys";
import { isPositiveInt } from "@/app/lib/numbers";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { getFacebookConnectionStatus } from "@/app/services/facebook/get-facebook-connection-status";

export function useFacebookConnectionStatusQuery(
  businessId: number | null | undefined,
  options?: { enabled?: boolean },
) {
  const enabled =
    (options?.enabled ?? true) &&
    isPositiveInt(businessId) &&
    hasAuthSession();

  const query = useQuery({
    queryKey:
      businessId != null
        ? adsStatsQueryKeys.facebookConnection(businessId)
        : adsStatsQueryKeys.meta(),
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      if (!isPositiveInt(businessId)) {
        throw new Error("Invalid business.");
      }
      return getFacebookConnectionStatus(getSetupAccessToken(), businessId);
    },
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isPending: query.isPending,
    error: query.error
      ? getApiErrorMessage(query.error, "Could not check Meta connection.")
      : null,
    refetch: query.refetch,
  };
}
