"use client";

import { useCallback } from "react";
import { usePaginatedAsyncResource } from "@/app/hooks/use-paginated-async-resource";
import {
  FUNNEL_ORDERS_PAGE_SIZE,
  getFunnelOrders,
  type FunnelPayment,
  type PaginatedFunnelOrdersResponse,
} from "@/app/services/payment/get-funnel-payments";

/** Loads one server page at a time — changing page refetches from the API. */
export function useFunnelPayments(
  funnelId: number | null | undefined,
  range?: { from?: string; to?: string; q?: string } | null,
) {
  const enabled = funnelId != null;
  const from = range?.from;
  const to = range?.to;
  const q = range?.q?.trim() || undefined;

  const fetchPage = useCallback(
    (page: number) =>
      getFunnelOrders(funnelId!, page, FUNNEL_ORDERS_PAGE_SIZE, {
        from,
        to,
        q,
      }),
    [funnelId, from, to, q],
  );

  return usePaginatedAsyncResource<
    FunnelPayment,
    PaginatedFunnelOrdersResponse["meta"]
  >(enabled, fetchPage, [funnelId, enabled, from, to, q], {
    fallbackError: "Could not load funnel orders.",
    resetWhenDisabled: { data: [], meta: null },
  });
}
