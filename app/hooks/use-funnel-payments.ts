"use client";

import { useCallback } from "react";
import { useAsyncResource } from "@/app/hooks/use-async-resource";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { isPositiveInt } from "@/app/lib/numbers";
import {
  getFunnelPayments,
  type FunnelPayment,
} from "@/app/services/payment/get-funnel-payments";

function sortPayments(list: FunnelPayment[]): FunnelPayment[] {
  return [...list].sort((a, b) => {
    const ta = a.paidAt ?? a.createdAt;
    const tb = b.paidAt ?? b.createdAt;
    return new Date(tb).getTime() - new Date(ta).getTime();
  });
}

export function useFunnelPayments(funnelId: number | null | undefined) {
  const enabled = isPositiveInt(funnelId);
  const token = getSetupAccessToken().trim();

  const fetcher = useCallback(async () => {
    if (!isPositiveInt(funnelId)) {
      throw new Error("Invalid funnel.");
    }
    if (!token) {
      throw new Error("Sign in to view orders.");
    }
    const list = await getFunnelPayments(token, funnelId);
    return sortPayments(list);
  }, [funnelId, token]);

  const { data, isLoading, error } = useAsyncResource<FunnelPayment[]>(
    enabled && Boolean(token),
    fetcher,
    [funnelId, token],
    {
      minLoadingMs: true,
      fallbackError: "Could not load payments.",
      initialLoading: enabled,
      resetWhenDisabled: [],
    },
  );

  if (enabled && !token) {
    return {
      payments: [] as FunnelPayment[],
      isLoading: false,
      error: "Sign in to view orders.",
    };
  }

  return {
    payments: data ?? [],
    isLoading,
    error,
  };
}
