"use client";

import { useCallback } from "react";
import { useTokenGatedResource } from "@/app/hooks/use-token-gated-resource";
import {
  getFunnelEventStats,
  type FunnelEventStats,
} from "@/app/services/funnel/get-funnel-event-stats";
import { funnelQueryKeys } from "@/app/services/funnel/funnel-query-keys";

export function useFunnelEventStats(funnelId: number | null | undefined) {
  const fetch = useCallback(
    (id: number) => getFunnelEventStats(id),
    [],
  );

  const { data, isLoading, error } = useTokenGatedResource<FunnelEventStats>({
    resourceId: funnelId,
    queryKey:
      funnelId != null
        ? funnelQueryKeys.eventStatsByFunnel(funnelId)
        : funnelQueryKeys.eventStats(),
    queryFn: fetch,
    noTokenError: "Sign in to view funnel stats.",
    fallbackError: "Could not load funnel stats.",
  });

  return { stats: data, isLoading, error };
}
