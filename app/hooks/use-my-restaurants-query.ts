"use client";

import { useQuery } from "@tanstack/react-query";
import { hasAuthSession } from "@/app/lib/auth-session";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  fetchMyRestaurants,
  type AdminRestaurant,
} from "@/app/services/restaurant/get-my-restaurant";
import { restaurantQueryKeys } from "@/app/services/restaurant/restaurant-query-keys";

export function useMyRestaurantsQuery() {
  const query = useQuery({
    queryKey: restaurantQueryKeys.myList(),
    queryFn: fetchMyRestaurants,
    enabled: hasAuthSession(),
  });

  return {
    data: query.data ?? ([] as AdminRestaurant[]),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error
      ? getApiErrorMessage(query.error, "Could not load restaurants.")
      : null,
    refetch: query.refetch,
  };
}
