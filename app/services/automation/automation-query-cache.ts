import type { QueryClient } from "@tanstack/react-query";
import {
  mapAutomationToListItem,
  type AutomationsListPage,
} from "@/app/services/automation/automation-api";
import { automationQueryKeys } from "@/app/services/automation/automation-query-keys";
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

function isAutomationsListPage(value: unknown): value is AutomationsListPage {
  return (
    typeof value === "object" &&
    value != null &&
    Array.isArray((value as AutomationsListPage).data) &&
    typeof (value as AutomationsListPage).meta === "object" &&
    (value as AutomationsListPage).meta != null
  );
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

  // What changed: list cache is now { data, meta } pages, not a flat array.
  queryClient.setQueriesData<AutomationsListPage>(
    { queryKey: automationQueryKeys.lists() },
    (prev) => {
      if (!isAutomationsListPage(prev) || !prev.data.length) {
        return prev;
      }
      const index = prev.data.findIndex((row) => row.numericId === response.id);
      if (index === -1) {
        return prev;
      }
      const nextData = [...prev.data];
      const current = nextData[index]!;
      nextData[index] = {
        ...current,
        status: flags.isActive ? "active" : "draft",
      };
      return { ...prev, data: nextData };
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

  const listItem = mapAutomationToListItem(automation);
  const scopeBusinessId = automation.businessId ?? automation.restaurantId;

  queryClient.setQueriesData<AutomationsListPage>(
    { queryKey: automationQueryKeys.lists() },
    (prev) => {
      if (!isAutomationsListPage(prev) || !prev.data.length) {
        return prev;
      }

      const index = prev.data.findIndex((row) => row.numericId === automation.id);
      if (index === -1) {
        return prev;
      }

      const nextData = [...prev.data];
      nextData[index] = {
        ...listItem,
        business:
          listItem.business !== "N/A"
            ? listItem.business
            : prev.data[index]!.business,
      };
      return { ...prev, data: nextData };
    },
  );

  if (options.invalidate !== false) {
    invalidateAutomationQueries(queryClient, {
      automationId: automation.id,
      businessId: isPositiveInt(scopeBusinessId) ? scopeBusinessId : undefined,
    });
  }
}
