import type { AutomationExecutionStatus } from "@/app/services/automation/types";
import type { AutomationFilter } from "@/app/components/automation/types";

export const automationQueryKeys = {
  all: ["automation"] as const,
  lists: () => [...automationQueryKeys.all, "list"] as const,
  /** Prefix key — invalidating this refreshes every page/filter for the business. */
  list: (businessId: number) =>
    [...automationQueryKeys.lists(), businessId] as const,
  listPage: (
    businessId: number,
    opts: {
      page: number;
      limit: number;
      campaignId: number | null;
      q: string;
      status: AutomationFilter;
    },
  ) => [...automationQueryKeys.list(businessId), opts] as const,
  details: () => [...automationQueryKeys.all, "detail"] as const,
  detail: (automationId: number) =>
    [...automationQueryKeys.details(), automationId] as const,
  executionsRoot: (automationId: number) =>
    [...automationQueryKeys.all, "executions", automationId] as const,
  executions: (
    automationId: number,
    status: AutomationExecutionStatus | "all",
    page: number,
  ) =>
    [
      ...automationQueryKeys.executionsRoot(automationId),
      status,
      page,
    ] as const,
  executionLogs: (executionId: number) =>
    [...automationQueryKeys.all, "execution-logs", executionId] as const,
};
