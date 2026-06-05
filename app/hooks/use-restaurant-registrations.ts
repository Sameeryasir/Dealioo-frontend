"use client";

import { useCallback } from "react";
import { usePaginatedAsyncResource } from "@/app/hooks/use-paginated-async-resource";
import {
  getRestaurantFunnelEvents,
  RESTAURANT_FUNNEL_EVENTS_PAGE_SIZE,
  type PaginatedRestaurantFunnelEventsResponse,
  type RestaurantFunnelEvent,
} from "@/app/services/funnel-event/get-restaurant-registrations";

export function useRestaurantFunnelEvents(
  restaurantId: number | null | undefined,
) {
  const enabled = restaurantId != null;

  const fetchPage = useCallback(
    (page: number) => {
      if (restaurantId == null) {
        return Promise.reject(new Error("Valid restaurant id is required."));
      }
      return getRestaurantFunnelEvents(
        restaurantId,
        page,
        RESTAURANT_FUNNEL_EVENTS_PAGE_SIZE,
      );
    },
    [restaurantId],
  );

  return usePaginatedAsyncResource<
    RestaurantFunnelEvent,
    PaginatedRestaurantFunnelEventsResponse["meta"]
  >(enabled, fetchPage, [restaurantId, enabled], {
    fallbackError: "Could not load funnel events.",
  });
}
