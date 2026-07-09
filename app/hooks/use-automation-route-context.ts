"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useCampaignFunnelId } from "@/app/hooks/use-campaign-funnel-id";
import { parseBusinessDashboardPathIds } from "@/app/lib/business-dashboard-pathname";

/**
 * Restaurant + campaign ids from the URL (campaign workspace path).
 * Funnel id is loaded for that campaign when present in the path.
 */
export function useAutomationRouteContext() {
  const pathname = usePathname() ?? "";

  const { restaurantId, campaignId } = useMemo(
    () => parseBusinessDashboardPathIds(pathname),
    [pathname],
  );

  const {
    funnelId,
    isLoading: isFunnelIdLoading,
    ensureFunnelIdLoaded,
  } = useCampaignFunnelId(campaignId);

  useEffect(() => {
    if (campaignId == null) return;
    ensureFunnelIdLoaded();
  }, [campaignId, ensureFunnelIdLoaded]);

  return {
    restaurantId,
    campaignId,
    funnelId,
    isFunnelIdLoading,
  };
}
