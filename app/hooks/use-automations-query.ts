"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAutomations,
  mapAutomationToListItem,
} from "@/app/services/automation/automation-api";
import { automationQueryKeys } from "@/app/services/automation/automation-query-keys";
import type { AutomationListItem } from "@/app/components/automation/types";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";

export function useAutomationsQuery(restaurantId: number | null | undefined) {
  const query = useQuery({
    queryKey:
      restaurantId != null
        ? automationQueryKeys.list(restaurantId)
        : automationQueryKeys.lists(),
    queryFn: async () => {
      if (restaurantId == null) {
        throw new Error("Business id is missing from the URL.");
      }
      const list = await getAutomations(restaurantId);
      return list.map((automation) => mapAutomationToListItem(automation));
    },
    enabled: restaurantId != null,
  });

  return {
    data: query.data ?? ([] as AutomationListItem[]),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error
      ? getApiErrorMessage(query.error, "Could not load automations.")
      : null,
    refetch: query.refetch,
  };
}
