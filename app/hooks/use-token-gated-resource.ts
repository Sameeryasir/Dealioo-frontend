"use client";

import { useQuery } from "@tanstack/react-query";
import { hasAuthSession } from "@/app/lib/auth-session";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { isPositiveInt } from "@/app/lib/numbers";

export function useTokenGatedResource<T>({
  resourceId,
  queryKey,
  queryFn,
  noTokenError,
  fallbackError,
  resetWhenDisabled,
  staleTime,
}: {
  resourceId: number | null | undefined;
  queryKey: readonly unknown[];
  queryFn: (id: number) => Promise<T>;
  noTokenError: string;
  fallbackError: string;
  resetWhenDisabled?: T;
  staleTime?: number;
}) {
  const enabled = isPositiveInt(resourceId) && hasAuthSession();

  const query = useQuery({
    queryKey,
    queryFn: () => queryFn(resourceId!),
    enabled,
    staleTime: staleTime ?? 60_000,
  });

  if (isPositiveInt(resourceId) && !hasAuthSession()) {
    return {
      data: resetWhenDisabled ?? null,
      isLoading: false,
      isFetching: false,
      error: noTokenError,
      refetch: query.refetch,
    };
  }

  return {
    data: query.data ?? resetWhenDisabled ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error
      ? getApiErrorMessage(query.error, fallbackError)
      : null,
    refetch: query.refetch,
  };
}
