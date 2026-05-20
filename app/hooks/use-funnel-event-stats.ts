"use client";

import { useCallback } from "react";
import { useAsyncResource } from "@/app/hooks/use-async-resource";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { isPositiveInt } from "@/app/lib/numbers";
import {
  getFunnelEventStats,
  type FunnelEventStats,
} from "@/app/services/funnel/get-funnel-event-stats";

export function useFunnelEventStats(funnelId: number | null | undefined) {
  const enabled = isPositiveInt(funnelId);
  const token = getSetupAccessToken().trim();

  const fetcher = useCallback(async () => {
    if (!isPositiveInt(funnelId)) {
      throw new Error("Invalid funnel.");
    }
    if (!token) {
      throw new Error("Sign in to view funnel stats.");
    }
    return getFunnelEventStats(token, funnelId);
  }, [funnelId, token]);

  const { data, isLoading, error } = useAsyncResource<FunnelEventStats>(
    enabled && Boolean(token),
    fetcher,
    [funnelId, token],
    {
      minLoadingMs: true,
      fallbackError: "Could not load funnel stats.",
    },
  );

  if (enabled && !token) {
    return {
      stats: null,
      isLoading: false,
      error: "Sign in to view funnel stats.",
    };
  }

  return { stats: data, isLoading, error };
}
