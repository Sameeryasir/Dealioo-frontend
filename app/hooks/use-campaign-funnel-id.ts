"use client";

import { useEffect, useState } from "react";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import {
  fetchFunnelByCampaignId,
  peekCachedFunnelId,
} from "@/app/services/funnel/get-funnel-by-campaign";
import { isPositiveInt } from "@/app/lib/numbers";

export function useCampaignFunnelId(campaignId: number | undefined): number | null {
  const [funnelId, setFunnelId] = useState<number | null>(() =>
    campaignId != null ? peekCachedFunnelId(campaignId) : null,
  );

  useEffect(() => {
    if (!isPositiveInt(campaignId)) {
      setFunnelId(null);
      return;
    }

    const cached = peekCachedFunnelId(campaignId);
    if (cached != null) {
      setFunnelId(cached);
      return;
    }

    const token = getSetupAccessToken().trim();
    if (!token) {
      setFunnelId(null);
      return;
    }

    let cancelled = false;
    void fetchFunnelByCampaignId(token, campaignId).then((remote) => {
      if (cancelled) return;
      setFunnelId(isPositiveInt(remote?.id) ? remote.id : null);
    });

    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  return funnelId;
}
