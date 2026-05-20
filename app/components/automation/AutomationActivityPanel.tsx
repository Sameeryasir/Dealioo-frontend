"use client";

import { Loader2, Play, Workflow } from "lucide-react";
import { RunProgressBanner } from "@/app/components/automation/RunProgressBanner";
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
  const { busy, activeRun, run } = useStartAutomationRun(
    automationId,
    automationActive,
  );

  return (
    <div className="min-w-0 bg-zinc-50">
      <div className="border-b border-zinc-200/90 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Activity</h2>
            <p className="text-sm text-zinc-500">
              Start a run here. Open the Runs tab to see each batch and who was
              reached.
            </p>
          </div>
          <button
            type="button"
            disabled={busy || automationActive === false}
            onClick={() =>
              void run((result) => onRunStarted?.(result.executionId))
            }
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Play className="size-4" aria-hidden />
            )}
            {busy ? "Running…" : "Run automation"}
          </button>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6">
        {activeRun && !activeRun.isTerminal ? (
          <RunProgressBanner status={activeRun} />
        ) : null}

        <div className="flex items-center justify-center py-12">
          <div className="max-w-sm rounded-2xl border border-zinc-200/90 bg-white px-6 py-10 text-center shadow-sm">
            <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Workflow className="size-6" aria-hidden />
            </span>
            <p className="mt-4 text-sm font-semibold text-zinc-900">
              Runs are on the Runs tab
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              After you run, progress appears here until emails finish sending.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
