"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { hasAuthSession } from "@/app/lib/auth-session";
import { adsStatsQueryKeys } from "@/app/lib/ads-stats-query-keys";
import { isPositiveInt } from "@/app/lib/numbers";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  getFacebookAdCampaignStats,
  META_CAMPAIGN_PAGE_SIZE,
  type FacebookAdCampaignStats,
} from "@/app/services/facebook/get-facebook-ad-campaign-stats";

type MetaAdCampaignStatsQueryOptions = {
  enabled?: boolean;
  period: string;
  page?: number;
  pageSize?: number;
  query?: string;
};

async function fetchMetaAdCampaignStats(
  businessId: number,
  options: {
    period: string;
    page: number;
    pageSize: number;
    query: string;
    refresh?: boolean;
  },
): Promise<FacebookAdCampaignStats> {
  return getFacebookAdCampaignStats(businessId, {
    includeInsights: true,
    refresh: options.refresh,
    page: options.page,
    pageSize: options.pageSize,
    query: options.query || undefined,
    period: options.period,
  });
}

export function useMetaAdCampaignStatsQuery(
  businessId: number | null | undefined,
  options: MetaAdCampaignStatsQueryOptions,
) {
  const queryClient = useQueryClient();
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? META_CAMPAIGN_PAGE_SIZE;
  const query = options.query?.trim() ?? "";
  const period = options.period;
  const enabled =
    (options.enabled ?? true) &&
    isPositiveInt(businessId) &&
    hasAuthSession();

  const queryKey =
    businessId != null
      ? adsStatsQueryKeys.metaCampaignStats(businessId, {
          period,
          page,
          pageSize,
          query,
        })
      : adsStatsQueryKeys.meta();

  const statsQuery = useQuery({
    queryKey,
    enabled,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      if (!isPositiveInt(businessId)) {
        throw new Error("Invalid business.");
      }
      const stats = await fetchMetaAdCampaignStats(businessId, {
        period,
        page,
        pageSize,
        query,
      });
      if (stats.isStale) {
        void fetchMetaAdCampaignStats(businessId, {
          period,
          page,
          pageSize,
          query,
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
        fetchMetaAdCampaignStats(businessId, {
          period,
          page,
          pageSize,
          query,
          refresh: true,
        }),
    });
  }, [businessId, page, pageSize, period, query, queryClient, queryKey]);

  const setStatsCache = useCallback(
    (
      updater:
        | FacebookAdCampaignStats
        | null
        | ((
            previous: FacebookAdCampaignStats | undefined,
          ) => FacebookAdCampaignStats | undefined),
    ) => {
      queryClient.setQueryData<FacebookAdCampaignStats>(queryKey, updater as never);
    },
    [queryClient, queryKey],
  );

  return useMemo(
    () => ({
      data: statsQuery.data ?? null,
      isLoading: statsQuery.isLoading,
      isFetching: statsQuery.isFetching,
      error: statsQuery.error
        ? getApiErrorMessage(statsQuery.error, "Could not load Meta ads.")
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
