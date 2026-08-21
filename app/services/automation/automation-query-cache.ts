import type { QueryClient } from "@tanstack/react-query";
import {
  automationStatusFromApi,
  mapAutomationToListItem,
} from "@/app/services/automation/automation-api";
import { automationQueryKeys } from "@/app/services/automation/automation-query-keys";
import type { AutomationListItem } from "@/app/components/automation/types";
import type {
  Automation,
  AutomationStatusResponse,
  UpdateAutomationResponse,
} from "@/app/services/automation/types";
import { isAutomationStatusResponse } from "@/app/services/automation/types";
import { isPositiveInt } from "@/app/lib/numbers";

function flagsFromStatus(status: AutomationStatusResponse["status"]): {
  isActive: boolean;
  published: boolean;
} {
  if (status === "active") {
    return { isActive: true, published: true };
  }
  if (status === "published") {
    return { isActive: false, published: true };
  }
  return { isActive: false, published: false };
}

export function invalidateAutomationQueries(
  queryClient: QueryClient,
  options: { automationId?: number; businessId?: number } = {},
): void {
  if (isPositiveInt(options.automationId)) {
    void queryClient.invalidateQueries({
      queryKey: automationQueryKeys.detail(options.automationId),
    });
  } else {
    void queryClient.invalidateQueries({
      queryKey: automationQueryKeys.details(),
    });
  }

  if (isPositiveInt(options.businessId)) {
    void queryClient.invalidateQueries({
      queryKey: automationQueryKeys.list(options.businessId),
    });
  } else {
    void queryClient.invalidateQueries({
      queryKey: automationQueryKeys.lists(),
    });
  }
}

export function syncAutomationStatusQueryCache(
  queryClient: QueryClient,
  response: AutomationStatusResponse,
  options: { invalidate?: boolean } = {},
): void {
  if (!isPositiveInt(response.id)) {
    return;
  }

  const flags = flagsFromStatus(response.status);

  queryClient.setQueryData<Automation>(
    automationQueryKeys.detail(response.id),
    (prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        isActive: flags.isActive,
        published: flags.published,
      };
    },
  );

  queryClient.setQueriesData<AutomationListItem[]>(
    { queryKey: automationQueryKeys.lists() },
    (prev) => {
      if (!prev?.length) {
        return prev;
      }
      const index = prev.findIndex((row) => row.numericId === response.id);
      if (index === -1) {
        return prev;
      }
      const next = [...prev];
      const current = next[index]!;
      next[index] = {
        ...current,
        status: automationStatusFromApi({
          id: response.id,
          name: current.name,
          trigger: current.trigger,
          isActive: flags.isActive,
          published: flags.published,
        }),
      };
      return next;
    },
  );

  if (options.invalidate !== false) {
    invalidateAutomationQueries(queryClient, { automationId: response.id });
  }
}

export function syncAutomationQueryCache(
  queryClient: QueryClient,
  automation: UpdateAutomationResponse,
  options: { invalidate?: boolean } = {},
): void {
  if (isAutomationStatusResponse(automation)) {
    syncAutomationStatusQueryCache(queryClient, automation, options);
    return;
  }

  if (!isPositiveInt(automation.id)) {
    return;
  }

  queryClient.setQueryData(
    automationQueryKeys.detail(automation.id),
    automation,
  );

  const scopeBusinessId = automation.businessId ?? automation.restaurantId;
  if (isPositiveInt(scopeBusinessId)) {
    const listItem = mapAutomationToListItem(automation);

    queryClient.setQueryData<AutomationListItem[]>(
      automationQueryKeys.list(scopeBusinessId),
      (prev) => {
        if (!prev?.length) {
          return prev;
        }

        const index = prev.findIndex((row) => row.numericId === automation.id);
        if (index === -1) {
          return prev;
        }

        const next = [...prev];
        next[index] = listItem;
        return next;
      },
    );
  }

  if (options.invalidate !== false) {
    invalidateAutomationQueries(queryClient, {
      automationId: automation.id,
      businessId: isPositiveInt(scopeBusinessId) ? scopeBusinessId : undefined,
    });
  }
}
