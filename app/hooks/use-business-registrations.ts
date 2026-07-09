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
  restaurantId: number | null | undefined,
) {
  const enabled = restaurantId != null;

  const fetchPage = useCallback(
    (page: number) => {
      if (restaurantId == null) {
        return Promise.reject(new Error("Valid business id is required."));
      }
      return getBusinessFunnelEvents(
        restaurantId,
        page,
        RESTAURANT_FUNNEL_EVENTS_PAGE_SIZE,
      );
    },
    [restaurantId],
  );

  return usePaginatedAsyncResource<
    BusinessFunnelEvent,
    PaginatedBusinessFunnelEventsResponse["meta"]
  >(enabled, fetchPage, [restaurantId, enabled], {
    fallbackError: "Could not load funnel events.",
  });
}
