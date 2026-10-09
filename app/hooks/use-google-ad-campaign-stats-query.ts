"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { hasAuthSession } from "@/app/lib/auth-session";
import { adsStatsQueryKeys } from "@/app/lib/ads-stats-query-keys";
import { isPositiveInt } from "@/app/lib/numbers";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  getGoogleAdsCampaignStats,
  type GoogleAdsCampaignStats,
} from "@/app/services/google-ads/get-google-ads-campaign-stats";

type GoogleAdCampaignStatsQueryOptions = {
  enabled?: boolean;
  period: string;
};

async function fetchGoogleAdCampaignStats(
  businessId: number,
  options: { period: string; refresh?: boolean },
): Promise<GoogleAdsCampaignStats> {
  return getGoogleAdsCampaignStats(businessId, {
    period: options.period,
    refresh: options.refresh,
  });
}

export function useGoogleAdCampaignStatsQuery(
  businessId: number | null | undefined,
  options: GoogleAdCampaignStatsQueryOptions,
) {
  const queryClient = useQueryClient();
  const period = options.period;
  const enabled =
    (options.enabled ?? true) &&
    isPositiveInt(businessId) &&
    hasAuthSession();

  const queryKey =
    businessId != null
      ? adsStatsQueryKeys.googleCampaignStats(businessId, { period })
      : adsStatsQueryKeys.google();

  const statsQuery = useQuery({
    queryKey,
    enabled,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      if (!isPositiveInt(businessId)) {
        throw new Error("Invalid business.");
      }
      const stats = await fetchGoogleAdCampaignStats(businessId, { period });
      if (stats.isStale) {
        void fetchGoogleAdCampaignStats(businessId, {
          period,
          refresh: true,
        })
          .then((fresh) => {
            queryClient.setQueryData(queryKey, fresh);
          })
          .catch(() => {});
      }
      return stats;
    },
  });

  const refreshFromSource = useCallback(async () => {
    if (!isPositiveInt(businessId)) return;
    await queryClient.fetchQuery({
      queryKey,
      staleTime: 0,
      queryFn: () =>
        fetchGoogleAdCampaignStats(businessId, {
          period,
          refresh: true,
        }),
    });
  }, [businessId, period, queryClient, queryKey]);

  const setStatsCache = useCallback(
    (
      updater:
        | GoogleAdsCampaignStats
        | null
        | ((
            previous: GoogleAdsCampaignStats | undefined,
          ) => GoogleAdsCampaignStats | undefined),
    ) => {
      queryClient.setQueryData<GoogleAdsCampaignStats>(queryKey, updater as never);
    },
    [queryClient, queryKey],
  );

  return useMemo(
    () => ({
      data: statsQuery.data ?? null,
      isLoading: statsQuery.isLoading,
      isFetching: statsQuery.isFetching,
      error: statsQuery.error
        ? getApiErrorMessage(
            statsQuery.error,
            "Could not load Google Ads campaign stats.",
          )
        : null,
      refetch: statsQuery.refetch,
      refreshFromSource,
      setStatsCache,
      queryKey,
    }),
    [
      queryKey,
      refreshFromSource,
      setStatsCache,
      statsQuery.data,
      statsQuery.error,
      statsQuery.isFetching,
      statsQuery.isLoading,
      statsQuery.refetch,
    ],
  );
}
