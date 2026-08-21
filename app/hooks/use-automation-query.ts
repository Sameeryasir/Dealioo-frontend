"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  automationStatusFromApi,
  getAutomationById,
} from "@/app/services/automation/automation-api";
import { syncAutomationQueryCache } from "@/app/services/automation/automation-query-cache";
import { automationQueryKeys } from "@/app/services/automation/automation-query-keys";
import type { AutomationStatus } from "@/app/components/automation/types";
import { isPositiveInt } from "@/app/lib/numbers";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";

export function useAutomationQuery(automationId: number | null | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey:
      automationId != null && isPositiveInt(automationId)
        ? automationQueryKeys.detail(automationId)
        : automationQueryKeys.details(),
    queryFn: () => {
      if (!isPositiveInt(automationId)) {
        throw new Error("Automation id is required.");
      }
      return getAutomationById(automationId);
    },
    enabled: isPositiveInt(automationId),
    staleTime: 0,
  });

  useEffect(() => {
    if (!query.data) {
      return;
    }
    syncAutomationQueryCache(queryClient, query.data, { invalidate: false });
  }, [query.data, queryClient]);

  const status: AutomationStatus = query.data
    ? automationStatusFromApi(query.data)
    : "draft";

  return {
    data: query.data ?? null,
    isActive: query.data ? query.data.isActive === true : null,
    isPublished: query.data ? query.data.published === true : null,
    status,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error
      ? getApiErrorMessage(query.error, "Could not load automation.")
      : null,
    refetch: query.refetch,
  };
}
