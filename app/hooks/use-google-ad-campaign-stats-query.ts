"use client";

import { useCallback } from "react";
import { hasAuthSession } from "@/app/lib/auth-session";
import { adsStatsQueryKeys } from "@/app/lib/ads-stats-query-keys";
import { isPositiveInt } from "@/app/lib/numbers";
import { getGoogleAdsCampaignStats } from "@/app/services/google-ads/get-google-ads-campaign-stats";
import { useAdsCampaignStatsQueryBase } from "@/app/hooks/use-ads-campaign-stats-query-base";

type GoogleAdCampaignStatsQueryOptions = {
  enabled?: boolean;
  period: string;
};

export function useGoogleAdCampaignStatsQuery(
  businessId: number | null | undefined,
  options: GoogleAdCampaignStatsQueryOptions,
) {
  const period = options.period;
  const enabled =
    (options.enabled ?? true) &&
    isPositiveInt(businessId) &&
    hasAuthSession();

  const queryKey =
    businessId != null
      ? adsStatsQueryKeys.googleCampaignStats(businessId, { period })
      : adsStatsQueryKeys.googleDisabled();

  const fetchStats = useCallback(
    async (fetchOptions: { refresh?: boolean }) => {
      if (!isPositiveInt(businessId)) {
        throw new Error("Invalid business.");
      }
      return getGoogleAdsCampaignStats(businessId, {
        period,
        refresh: fetchOptions.refresh,
      });
    },
    [businessId, period],
  );

  return useAdsCampaignStatsQueryBase({
    queryKey,
    enabled,
    errorMessage: "Could not load Google Ads campaign stats.",
    fetchStats,
  });
}
