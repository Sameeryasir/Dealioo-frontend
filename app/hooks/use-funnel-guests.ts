"use client";

import { useCallback } from "react";
import { usePaginatedAsyncResource } from "@/app/hooks/use-paginated-async-resource";
import {
  FUNNEL_GUESTS_PAGE_SIZE,
  getFunnelGuests,
  type FunnelGuestRecord,
  type PaginatedFunnelGuestsResponse,
} from "@/app/services/funnel-event/get-funnel-guests";

export function useFunnelGuests(funnelId: number | null | undefined) {
  const enabled = funnelId != null;

  const fetchPage = useCallback(
    (page: number) => getFunnelGuests(funnelId!, page, FUNNEL_GUESTS_PAGE_SIZE),
    [funnelId],
  );

  return usePaginatedAsyncResource<
    FunnelGuestRecord,
    PaginatedFunnelGuestsResponse["meta"]
  >(enabled, fetchPage, [funnelId, enabled], {
    fallbackError: "Could not load guests.",
    resetWhenDisabled: { data: [], meta: null },
  });
}
