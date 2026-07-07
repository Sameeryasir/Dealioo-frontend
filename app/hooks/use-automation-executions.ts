"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  deleteExecution as deleteExecutionApi,
  getExecutions,
} from "@/app/services/automation/execution-api";
import { automationQueryKeys } from "@/app/services/automation/automation-query-keys";
import { mapPusherPayloadToExecution } from "@/app/lib/pusher-execution";
import type { ExecutionTerminalPusherPayload } from "@/app/lib/pusher-execution";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  EXECUTIONS_PAGE_SIZE,
  type AutomationExecution,
  type AutomationExecutionStatus,
  type ExecutionListSummary,
  type PaginatedExecutionsResponse,
  type PaginationMeta,
} from "@/app/services/automation/types";

type ExecutionsPageMeta = PaginationMeta & {
  summary?: ExecutionListSummary;
};

function patchExecutionsPageFromPusher(
  prev: PaginatedExecutionsResponse | undefined,
  payload: ExecutionTerminalPusherPayload,
  statusFilter: AutomationExecutionStatus | undefined,
  page: number,
): PaginatedExecutionsResponse | undefined {
  if (!prev) return prev;

  const index = prev.data.findIndex((row) => row.id === payload.executionId);
  const updated = mapPusherPayloadToExecution(
    payload,
    index >= 0 ? prev.data[index] : undefined,
  );

  if (statusFilter && payload.status !== statusFilter) {
    if (index >= 0) {
      const nextMeta = prev.meta
        ? { ...prev.meta, total: Math.max(0, prev.meta.total - 1) }
        : prev.meta;
      return {
        ...prev,
        meta: nextMeta,
        data: prev.data.filter((row) => row.id !== payload.executionId),
      };
    }
    return prev;
  }

  if (index >= 0) {
    return {
      ...prev,
      data: prev.data.map((row, i) => (i === index ? updated : row)),
    };
  }

  if (page !== 1) {
    return prev;
  }

  const nextData = [updated, ...prev.data].slice(0, EXECUTIONS_PAGE_SIZE);
  const nextMeta = prev.meta
    ? { ...prev.meta, total: prev.meta.total + 1 }
    : prev.meta;

  return {
    ...prev,
    data: nextData,
    meta: nextMeta,
  };
}

export function useAutomationExecutions(
  automationId: number | null,
  status?: AutomationExecutionStatus,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const queryClient = useQueryClient();
  const [page, setPageState] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const statusKey: AutomationExecutionStatus | "all" = status ?? "all";

  useEffect(() => {
    setPageState(1);
  }, [automationId, statusKey]);

  const queryKey =
    automationId != null
      ? automationQueryKeys.executions(automationId, statusKey, page)
      : automationQueryKeys.all;

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (automationId == null) {
        throw new Error("Automation id is required.");
      }
      return getExecutions({
        automationId,
        status,
        page,
        limit: EXECUTIONS_PAGE_SIZE,
      });
    },
    enabled: enabled && automationId != null,
    placeholderData: keepPreviousData,
  });

  const executions = query.data?.data ?? [];
  const meta = (query.data?.meta ?? null) as ExecutionsPageMeta | null;
  const summary = useMemo(() => meta?.summary ?? null, [meta]);

  const setPage = useCallback((nextPage: number) => {
    setPageState(nextPage);
  }, []);

  const patchData = useCallback(
    (updater: (prev: AutomationExecution[]) => AutomationExecution[]) => {
      if (automationId == null) return;
      queryClient.setQueryData<PaginatedExecutionsResponse>(
        automationQueryKeys.executions(automationId, statusKey, page),
        (current) => {
          if (!current) return current;
          return {
            ...current,
            data: updater(current.data),
          };
        },
      );
    },
    [automationId, page, queryClient, statusKey],
  );

  const patchMeta = useCallback(
    (updater: (prev: ExecutionsPageMeta | null) => ExecutionsPageMeta | null) => {
      if (automationId == null) return;
      queryClient.setQueryData<PaginatedExecutionsResponse>(
        automationQueryKeys.executions(automationId, statusKey, page),
        (current) => {
          if (!current) return current;
          const nextMeta = updater(current.meta as ExecutionsPageMeta);
          return nextMeta ? { ...current, meta: nextMeta } : current;
        },
      );
    },
    [automationId, page, queryClient, statusKey],
  );

  const applyPusherExecution = useCallback(
    (payload: ExecutionTerminalPusherPayload) => {
      if (automationId == null || payload.automationId !== automationId) {
        return;
      }

      const executionsRoot = automationQueryKeys.executionsRoot(automationId);

      void queryClient.cancelQueries({ queryKey: executionsRoot });

      const cachedQueries = queryClient
        .getQueryCache()
        .findAll({ queryKey: executionsRoot });

      if (cachedQueries.length === 0) {
        void queryClient.invalidateQueries({ queryKey: executionsRoot });
        return;
      }

      for (const query of cachedQueries) {
        const [, , , cachedStatus, cachedPage] = query.queryKey;
        const pageNumber =
          typeof cachedPage === "number" ? cachedPage : page;
        const filterStatus =
          cachedStatus === "all" || cachedStatus == null
            ? undefined
            : (cachedStatus as AutomationExecutionStatus);

        queryClient.setQueryData<PaginatedExecutionsResponse>(
          query.queryKey,
          (prev) =>
            patchExecutionsPageFromPusher(
              prev,
              payload,
              filterStatus,
              pageNumber,
            ),
        );
      }

      void queryClient.invalidateQueries({
        queryKey: executionsRoot,
        refetchType: "active",
      });
    },
    [automationId, page, queryClient],
  );

  const deleteExecution = useCallback(
    async (executionId: number): Promise<void> => {
      if (automationId == null) return;

      setDeletingId(executionId);
      try {
        await deleteExecutionApi(executionId);
        const isLastOnPage = executions.length === 1;
        const nextPage = isLastOnPage && page > 1 ? page - 1 : page;
        if (nextPage !== page) {
          setPageState(nextPage);
        } else {
          await queryClient.invalidateQueries({
            queryKey: automationQueryKeys.executionsRoot(automationId),
          });
        }
      } finally {
        setDeletingId(null);
      }
    },
    [automationId, executions.length, page, queryClient],
  );

  return {
    executions,
    meta,
    summary,
    page,
    setPage,
    loading: query.isLoading,
    refreshing: query.isFetching && !query.isLoading,
    error: query.error
      ? getApiErrorMessage(query.error, "Could not load runs.")
      : null,
    refetch: query.refetch,
    loadPage: setPage,
    patchData,
    patchMeta,
    applyPusherExecution,
    deleteExecution,
    deletingId,
  };
}
