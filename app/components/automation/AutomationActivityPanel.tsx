"use client";

import { Loader2, Play } from "lucide-react";
import { formatExecutionDateTime } from "@/app/components/automation/execution-status-ui";
import { useAutomationLogs } from "@/app/hooks/use-automation-logs";
import { useStartAutomationRun } from "@/app/hooks/use-start-automation-run";

export function AutomationActivityPanel({
  automationId,
  automationActive,
  onRunStarted,
}: {
  automationId: number;
  automationActive?: boolean;
  onRunStarted?: (executionId: number) => void;
}) {
  const { logs, loading, error, refetch } = useAutomationLogs(automationId);
  const { starting, run } = useStartAutomationRun(
    automationId,
    automationActive,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-50">
      <div className="shrink-0 border-b border-zinc-200/90 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Activity</h2>
            <p className="text-sm text-zinc-500">
              Recent events across all customers in this automation.
            </p>
          </div>
          <button
            type="button"
            disabled={starting || automationActive === false}
            onClick={() =>
              void run((id) => {
                void refetch();
                onRunStarted?.(id);
              })
            }
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {starting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Play className="size-4" aria-hidden />
            )}
            {starting ? "Starting…" : "Run automation"}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            Loading activity…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-800">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-3 cursor-pointer font-semibold underline"
            >
              Try again
            </button>
          </div>
        ) : logs.length === 0 ? (
          <p className="rounded-2xl border border-zinc-200/90 bg-white px-4 py-12 text-center text-sm text-zinc-500 shadow-sm">
            No activity yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {logs.map((log) => (
              <li
                key={log.id}
                className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[0.65rem] font-semibold text-zinc-500">
                    {formatExecutionDateTime(log.createdAt)}
                  </p>
                  <span className="text-xs text-zinc-500">
                    Customer #{log.customerId}
                    {log.node?.type ? (
                      <span className="ml-2 rounded-md bg-zinc-100 px-1.5 py-0.5 font-bold uppercase tracking-wide text-zinc-600">
                        {log.node.type}
                      </span>
                    ) : null}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-800">{log.message}</p>
                {log.error ? (
                  <p className="mt-1 text-sm font-medium text-red-600">
                    {log.error}
                  </p>
                ) : null}
                <p className="mt-2 text-[0.65rem] text-zinc-400">
                  Run #{log.executionId}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
