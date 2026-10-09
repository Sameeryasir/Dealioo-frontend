"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";

type AdsCampaignStatsQueryBaseOptions<TData extends { isStale?: boolean }> = {
  queryKey: readonly unknown[];
  enabled: boolean;
  errorMessage: string;
  fetchStats: (options: { refresh?: boolean }) => Promise<TData>;
};

export function useAdsCampaignStatsQueryBase<
  TData extends { isStale?: boolean },
>(options: AdsCampaignStatsQueryBaseOptions<TData>) {
  const queryClient = useQueryClient();
  const { queryKey, enabled, errorMessage, fetchStats } = options;

  const statsQuery = useQuery({
    queryKey,
    enabled,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const stats = await fetchStats({});
      if (stats.isStale) {
        void fetchStats({ refresh: true })
          .then((fresh) => {
            queryClient.setQueryData(queryKey, fresh);
          })
          .catch(() => {});
      }
      return stats;
    },
  });

  const refreshFromSource = useCallback(async () => {
    if (!enabled) return;
    await queryClient.fetchQuery({
      queryKey,
      staleTime: 0,
      queryFn: () => fetchStats({ refresh: true }),
    });
  }, [enabled, fetchStats, queryClient, queryKey]);

  const setStatsCache = useCallback(
    (
      updater:
        | TData
        | null
        | ((previous: TData | undefined) => TData | undefined),
    ) => {
      queryClient.setQueryData<TData>(queryKey, updater as never);
    },
    [queryClient, queryKey],
  );

  return useMemo(
    () => ({
      data: statsQuery.data ?? null,
      isLoading: statsQuery.isLoading,
      isFetching: statsQuery.isFetching,
      error: statsQuery.error
        ? getApiErrorMessage(statsQuery.error, errorMessage)
        : null,
      refetch: statsQuery.refetch,
      refreshFromSource,
      setStatsCache,
      queryKey,
    }),
    [
      errorMessage,
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
