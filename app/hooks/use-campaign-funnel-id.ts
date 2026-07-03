"use client";

import { useCallback, useEffect, useState } from "react";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { isPositiveInt } from "@/app/lib/numbers";
import {
  fetchFunnelSummaryByCampaignId,
  peekCachedFunnelId,
  subscribeCampaignFunnelId,
} from "@/app/services/funnel/get-funnel-by-campaign";

function initialFunnelIdLoading(campaignId: number | undefined): boolean {
  if (!isPositiveInt(campaignId)) return false;
  return peekCachedFunnelId(campaignId) == null;
}

export function useCampaignFunnelId(campaignId: number | undefined): {
  funnelId: number | null;
  isLoading: boolean;
  ensureFunnelIdLoaded: () => void;
} {
  const [funnelId, setFunnelId] = useState<number | null>(() =>
    campaignId != null ? peekCachedFunnelId(campaignId) : null,
  );
  const [isLoading, setIsLoading] = useState(() =>
    initialFunnelIdLoading(campaignId),
  );

  const fetchRemoteFunnelId = useCallback(
    async (id: number, cancelled: () => boolean) => {
      const cached = peekCachedFunnelId(id);
      if (cached != null) {
        setFunnelId(cached);
        setIsLoading(false);
        return;
      }

      const token = getSetupAccessToken().trim();
      if (!token) {
        setFunnelId(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const remoteId = await fetchFunnelSummaryByCampaignId(token, id);
        if (cancelled()) return;
        setFunnelId(remoteId);
      } catch (err) {
        if (cancelled()) return;
        console.warn("[Funnel] Could not load funnel for campaign", id, err);
        setFunnelId(null);
      } finally {
        if (!cancelled()) setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isPositiveInt(campaignId)) {
      setFunnelId(null);
      setIsLoading(false);
      return;
    }

    return subscribeCampaignFunnelId(campaignId, (cachedId) => {
      if (cachedId != null) {
        setFunnelId(cachedId);
        setIsLoading(false);
      }
    });
  }, [campaignId]);

  useEffect(() => {
    if (!isPositiveInt(campaignId)) {
      setFunnelId(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    void fetchRemoteFunnelId(campaignId, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [campaignId, fetchRemoteFunnelId]);

  const ensureFunnelIdLoaded = useCallback(() => {
    if (!isPositiveInt(campaignId)) return;

    const cached = peekCachedFunnelId(campaignId);
    if (cached != null) {
      setFunnelId(cached);
      setIsLoading(false);
      return;
    }

    void fetchRemoteFunnelId(campaignId, () => false);
  }, [campaignId, fetchRemoteFunnelId]);

  return { funnelId, isLoading, ensureFunnelIdLoaded };
}
