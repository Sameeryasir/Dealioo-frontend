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
export function useFunnelPayments(funnelId: number | null | undefined) {
  const enabled = funnelId != null;

  const fetchPage = useCallback(
    (page: number) => getFunnelOrders(funnelId!, page, FUNNEL_ORDERS_PAGE_SIZE),
    [funnelId],
  );

  return usePaginatedAsyncResource<
    FunnelPayment,
    PaginatedFunnelOrdersResponse["meta"]
  >(enabled, fetchPage, [funnelId, enabled], {
    fallbackError: "Could not load funnel orders.",
    resetWhenDisabled: { data: [], meta: null },
  });
}
