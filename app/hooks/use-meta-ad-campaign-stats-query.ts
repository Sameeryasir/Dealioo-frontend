"use client";

import { useCallback } from "react";
import { hasAuthSession } from "@/app/lib/auth-session";
import { adsStatsQueryKeys } from "@/app/lib/ads-stats-query-keys";
import { isPositiveInt } from "@/app/lib/numbers";
import {
  getFacebookAdCampaignStats,
  META_CAMPAIGN_PAGE_SIZE,
} from "@/app/services/facebook/get-facebook-ad-campaign-stats";
import { useAdsCampaignStatsQueryBase } from "@/app/hooks/use-ads-campaign-stats-query-base";

type MetaAdCampaignStatsQueryOptions = {
  enabled?: boolean;
  period: string;
  page?: number;
  pageSize?: number;
  query?: string;
};

export function useMetaAdCampaignStatsQuery(
  businessId: number | null | undefined,
  options: MetaAdCampaignStatsQueryOptions,
) {
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
      : adsStatsQueryKeys.metaDisabled();

  const fetchStats = useCallback(
    async (fetchOptions: { refresh?: boolean }) => {
      if (!isPositiveInt(businessId)) {
        throw new Error("Invalid business.");
      }
      return getFacebookAdCampaignStats(businessId, {
        includeInsights: true,
        refresh: fetchOptions.refresh,
        page,
        pageSize,
        query: query || undefined,
        period,
      });
    },
    [businessId, page, pageSize, period, query],
  );

  return useAdsCampaignStatsQueryBase({
    queryKey,
    enabled,
    errorMessage: "Could not load Meta ads.",
    fetchStats,
  });
}
