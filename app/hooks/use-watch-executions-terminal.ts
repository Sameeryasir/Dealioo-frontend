"use client";

import { useEffect, useRef } from "react";
import { isExecutionInProgress } from "@/app/components/automation/execution-status-ui";
import { subscribeExecutionTerminal } from "@/app/lib/pusher-client";
import {
  isPusherConfigured,
  type ExecutionTerminalPusherPayload,
} from "@/app/lib/pusher-execution";
import type { AutomationExecution } from "@/app/services/automation/types";

export function collectInProgressExecutionIds(
  executions: AutomationExecution[],
  extraExecutionIds: number[] = [],
): number[] {
  const ids = new Set<number>();

  for (const row of executions) {
    if (isExecutionInProgress(row.status)) {
      ids.add(row.id);
    }
  }

  for (const id of extraExecutionIds) {
    if (Number.isFinite(id) && id >= 1) {
      ids.add(id);
    }
  }

  return [...ids].sort((a, b) => a - b);
}

type UseWatchExecutionsTerminalOptions = {
  automationId: number;
  executionIds: number[];
  onTerminal: (payload: ExecutionTerminalPusherPayload) => void;
};

export function useWatchExecutionsTerminal({
  automationId,
  executionIds,
  onTerminal,
}: UseWatchExecutionsTerminalOptions): void {
  const onTerminalRef = useRef(onTerminal);
  onTerminalRef.current = onTerminal;

  const idsKey = executionIds.join(",");

  useEffect(() => {
    const ids = idsKey
      ? idsKey.split(",").map((part) => Number(part))
      : [];

    if (!isPusherConfigured() || ids.length === 0) {
      return;
    }

    const cleanups = ids.map((executionId) =>
      subscribeExecutionTerminal(executionId, (payload) => {
        if (payload.automationId !== automationId) return;
        onTerminalRef.current(payload);
      }),
    );

    return () => {
      cleanups.forEach((unsubscribe) => unsubscribe());
    };
  }, [automationId, idsKey]);
}
