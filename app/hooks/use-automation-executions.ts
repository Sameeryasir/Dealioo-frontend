"use client";

import { useCallback, useMemo, useState } from "react";
import { usePaginatedAsyncResource } from "@/app/hooks/use-paginated-async-resource";
import {
  deleteExecution as deleteExecutionApi,
  getExecutions,
} from "@/app/services/automation/execution-api";
import { mapPusherPayloadToExecution } from "@/app/lib/pusher-execution";
import type { ExecutionTerminalPusherPayload } from "@/app/lib/pusher-execution";
import {
  EXECUTIONS_PAGE_SIZE,
  type AutomationExecution,
  type AutomationExecutionStatus,
  type ExecutionListSummary,
  type PaginationMeta,
} from "@/app/services/automation/types";

type ExecutionsPageMeta = PaginationMeta & {
  summary?: ExecutionListSummary;
};

export function useAutomationExecutions(
  automationId: number | null,
  status?: AutomationExecutionStatus,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchPage = useCallback(
    async (page: number) => {
      if (automationId == null) {
        throw new Error("Automation id is required.");
      }
      const response = await getExecutions({
        automationId,
        status,
        page,
        limit: EXECUTIONS_PAGE_SIZE,
      });
      return { data: response.data, meta: response.meta };
    },
    [automationId, status],
  );

  const {
    data: executions,
    meta,
    page,
    setPage,
    loading,
    refreshing,
    error,
    refetch,
    loadPage,
    patchData,
    patchMeta,
  } = usePaginatedAsyncResource<AutomationExecution, ExecutionsPageMeta>(
    enabled && automationId != null,
    fetchPage,
    [automationId],
    {
      fallbackError: "Could not load runs.",
    },
  );

  const summary = useMemo(() => meta?.summary ?? null, [meta]);

  const applyPusherExecution = useCallback(
    (payload: ExecutionTerminalPusherPayload) => {
      if (automationId != null && payload.automationId !== automationId) {
        return;
      }

      patchData((prev) => {
        const index = prev.findIndex((row) => row.id === payload.executionId);
        const updated = mapPusherPayloadToExecution(
          payload,
          index >= 0 ? prev[index] : undefined,
        );

        if (index >= 0) {
          return prev.map((row, i) => (i === index ? updated : row));
        }

        if (page !== 1) {
          return prev;
        }

        patchMeta((meta) =>
          meta ? { ...meta, total: meta.total + 1 } : meta,
        );
        return [updated, ...prev].slice(0, EXECUTIONS_PAGE_SIZE);
      });
    },
    [automationId, page, patchData, patchMeta],
  );

  const deleteExecution = useCallback(
    async (executionId: number): Promise<void> => {
      setDeletingId(executionId);
      try {
        await deleteExecutionApi(executionId);
        const isLastOnPage = executions.length === 1;
        if (isLastOnPage && page > 1) {
          await loadPage(page - 1);
        } else {
          await loadPage(page);
        }
      } finally {
        setDeletingId(null);
      }
    },
    [executions.length, page, loadPage],
  );

  return {
    executions,
    meta,
    summary,
    page,
    setPage,
    loading,
    refreshing,
    error,
    refetch,
    applyPusherExecution,
    deleteExecution,
    deletingId,
  };
}
