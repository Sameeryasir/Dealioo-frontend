"use client";

import { hasAuthSession } from "@/app/lib/auth-session";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { adminQueryKeys } from "@/app/services/admin/admin-query-keys";
import {
  getPlatformDashboardPanel,
  type PlatformDashboardPeriod,
} from "@/app/services/admin/get-platform-dashboard";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export function usePlatformDashboardQuery(input: {
  period: PlatformDashboardPeriod;
  month?: string;
  timezone: string;
}) {
  const month = input.period === "month" ? (input.month ?? "") : "";

  const query = useQuery({
    queryKey: adminQueryKeys.dashboard(input.period, month, input.timezone),
    queryFn: () =>
      getPlatformDashboardPanel({
        period: input.period,
        month: input.period === "month" ? input.month : undefined,
        timezone: input.timezone,
      }),
    enabled: hasAuthSession(),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error
      ? getApiErrorMessage(query.error, "Could not load the platform overview.")
      : null,
    refetch: query.refetch,
  };
}
