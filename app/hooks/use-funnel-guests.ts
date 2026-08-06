"use client";

import { useCallback } from "react";
import { usePaginatedAsyncResource } from "@/app/hooks/use-paginated-async-resource";
import {
  FUNNEL_GUESTS_PAGE_SIZE,
  getFunnelGuests,
  type FunnelGuestRecord,
  type PaginatedFunnelGuestsResponse,
} from "@/app/services/funnel-event/get-funnel-guests";

export function useFunnelGuests(
  funnelId: number | null | undefined,
  pageSize: number = FUNNEL_GUESTS_PAGE_SIZE,
) {
  const enabled = funnelId != null;
  const limit =
    Number.isFinite(pageSize) && pageSize > 0
      ? Math.min(Math.floor(pageSize), 100)
      : FUNNEL_GUESTS_PAGE_SIZE;

  const fetchPage = useCallback(
    (page: number) => getFunnelGuests(funnelId!, page, limit),
    [funnelId, limit],
  );

  return usePaginatedAsyncResource<
    FunnelGuestRecord,
    PaginatedFunnelGuestsResponse["meta"]
  >(enabled, fetchPage, [funnelId, enabled, limit], {
    fallbackError: "Could not load guests.",
    resetWhenDisabled: { data: [], meta: null },
  });
}
