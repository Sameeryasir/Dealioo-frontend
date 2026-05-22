"use client";

import { useCallback, useRef } from "react";
import { getExecutionLogs } from "@/app/services/automation/execution-api";
import type { AutomationLog } from "@/app/services/automation/types";
import { useAsyncResource } from "@/app/hooks/use-async-resource";
import { useExecutionPusher } from "@/app/hooks/use-execution-pusher";

export function useExecutionLogs(executionId: number | null) {
  const fetcher = useCallback(async () => {
    if (executionId == null) return [] as AutomationLog[];
    return getExecutionLogs(executionId);
  }, [executionId]);

  const { data, isLoading, error, refetch } = useAsyncResource(
    executionId != null,
    fetcher,
    [executionId],
    {
      fallbackError: "Could not load activity logs.",
      resetWhenDisabled: [] as AutomationLog[],
    },
  );

  const onTerminalRef = useRef(() => {
    void refetch();
  });
  onTerminalRef.current = () => {
    void refetch();
  };

  useExecutionPusher(executionId, () => {
    onTerminalRef.current();
  });

  return { logs: data ?? [], loading: isLoading, error, refetch };
}
