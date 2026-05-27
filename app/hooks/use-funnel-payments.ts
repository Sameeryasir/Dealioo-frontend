"use client";

import { useCallback } from "react";
import { useTokenGatedResource } from "@/app/hooks/use-token-gated-resource";
import {
  getFunnelPayments,
  type FunnelPayment,
} from "@/app/services/payment/get-funnel-payments";
import { funnelQueryKeys } from "@/app/services/funnel/funnel-query-keys";

function sortPayments(list: FunnelPayment[]): FunnelPayment[] {
  return [...list].sort((a, b) => {
    const ta = a.paidAt ?? a.createdAt;
    const tb = b.paidAt ?? b.createdAt;
    return new Date(tb).getTime() - new Date(ta).getTime();
  });
}

export function useFunnelPayments(funnelId: number | null | undefined) {
  const fetch = useCallback(async (id: number) => {
    const list = await getFunnelPayments(id);
    return sortPayments(list);
  }, []);

  const { data, isLoading, error } = useTokenGatedResource<FunnelPayment[]>({
    resourceId: funnelId,
    queryKey:
      funnelId != null
        ? funnelQueryKeys.paymentsByFunnel(funnelId)
        : funnelQueryKeys.payments(),
    queryFn: fetch,
    noTokenError: "Sign in to view orders.",
    fallbackError: "Could not load payments.",
    resetWhenDisabled: [],
  });

  return {
    payments: data ?? [],
    isLoading,
    error,
  };
}
