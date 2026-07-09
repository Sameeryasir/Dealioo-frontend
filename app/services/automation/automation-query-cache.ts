import type { QueryClient } from "@tanstack/react-query";
import { mapAutomationToListItem } from "@/app/services/automation/automation-api";
import { automationQueryKeys } from "@/app/services/automation/automation-query-keys";
import type { AutomationListItem } from "@/app/components/automation/types";
import type { Automation } from "@/app/services/automation/types";
import { isPositiveInt } from "@/app/lib/numbers";

export function syncAutomationQueryCache(
  queryClient: QueryClient,
  automation: Automation,
): void {
  if (!isPositiveInt(automation.id)) {
    return;
  }

  queryClient.setQueryData(
    automationQueryKeys.detail(automation.id),
    automation,
  );

  const scopeBusinessId = automation.businessId ?? automation.restaurantId;
  if (!isPositiveInt(scopeBusinessId)) {
    return;
  }

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
