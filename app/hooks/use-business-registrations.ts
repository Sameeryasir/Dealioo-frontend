"use client";

import { useCallback } from "react";
import { usePaginatedAsyncResource } from "@/app/hooks/use-paginated-async-resource";
import {
  getBusinessFunnelEvents,
  RESTAURANT_FUNNEL_EVENTS_PAGE_SIZE,
  type PaginatedBusinessFunnelEventsResponse,
  type BusinessFunnelEvent,
} from "@/app/services/funnel-event/get-business-registrations";

export function useBusinessFunnelEvents(
  businessId: number | null | undefined,
) {
  const enabled = businessId != null;

  const fetchPage = useCallback(
    (page: number) => {
      if (businessId == null) {
        return Promise.reject(new Error("Valid business id is required."));
      }
      return getBusinessFunnelEvents(
        businessId,
        page,
        RESTAURANT_FUNNEL_EVENTS_PAGE_SIZE,
      );
    },
    [businessId],
  );

  return usePaginatedAsyncResource<
    BusinessFunnelEvent,
    PaginatedBusinessFunnelEventsResponse["meta"]
  >(enabled, fetchPage, [businessId, enabled], {
    fallbackError: "Could not load funnel events.",
  });
}
