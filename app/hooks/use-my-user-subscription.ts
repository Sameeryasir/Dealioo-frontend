"use client";

import { hasAuthSession } from "@/app/lib/auth-session";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  getMyUserSubscription,
  type UserSubscription,
} from "@/app/services/subscription/user-subscription";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const myUserSubscriptionQueryKey = ["user-subscriptions", "me"] as const;

type UseMyUserSubscriptionOptions = {
  enabled?: boolean;
};

export function useMyUserSubscription(
  options: UseMyUserSubscriptionOptions = {},
) {
  const enabled = options.enabled ?? true;

  const query = useQuery({
    queryKey: myUserSubscriptionQueryKey,
    queryFn: getMyUserSubscription,
    enabled: enabled && hasAuthSession(),
    staleTime: 5 * 60_000,
  });

  return {
    subscription: (query.data ?? null) as UserSubscription | null,
    isLoading: enabled && query.isLoading,
    isFetching: query.isFetching,
    isFetched: query.isFetched,
    isSuccess: query.isSuccess,
    isError: query.isError,
    error: query.error
      ? getApiErrorMessage(query.error, "Could not load your subscription.")
      : null,
    refetch: query.refetch,
  };
}

export function useInvalidateMyUserSubscription() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: myUserSubscriptionQueryKey });
}
