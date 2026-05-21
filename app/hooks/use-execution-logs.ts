"use client";

import { useCallback, useEffect, useState } from "react";
import { getExecutionLogs } from "@/app/services/automation/execution-api";
import type { AutomationLog } from "@/app/services/automation/types";

export function useExecutionLogs(executionId: number | null) {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getExecutionLogs(id);
      setLogs(response);
    } catch (err) {
      setLogs([]);
      setError(
        err instanceof Error ? err.message : "Could not load activity logs.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (executionId == null) {
      setLogs([]);
      setError(null);
      setLoading(false);
      return;
    }
    void load(executionId);
  }, [executionId, load]);

  const refetch = useCallback(() => {
    if (executionId == null) return;
    void load(executionId);
  }, [executionId, load]);

  return { logs, loading, error, refetch };
}
