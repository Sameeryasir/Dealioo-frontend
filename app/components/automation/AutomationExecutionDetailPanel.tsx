"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  executionRecipientsFromLogs,
  executionRunSubtitle,
  executionRunTitle,
  executionStatusBadgeClass,
  formatExecutionDateTime,
  formatScheduledCountdown,
  recipientLabel,
} from "@/app/components/automation/execution-status-ui";
import { useExecutionDetail } from "@/app/hooks/use-execution-detail";
import { isAdminUser } from "@/app/lib/is-admin-user";
import { AutomationApiError } from "@/app/services/automation/automation-fetch";
import {
  processExecution,
  resumeExecution,
} from "@/app/services/automation/execution-api";

export function AutomationExecutionDetailPanel({
  executionId,
  onBack,
}: {
  executionId: number;
  onBack: () => void;
}) {
  const { execution, logs, loading, error, refetch } =
    useExecutionDetail(executionId);
  const [actionLoading, setActionLoading] = useState(false);
  const isAdmin = isAdminUser();

  const executedRecipients =
    execution?.executedRecipients?.length
      ? execution.executedRecipients
      : executionRecipientsFromLogs(logs);
  const recipientSubtitle = executionRunSubtitle(executedRecipients);

  async function runAdminAction(
    fn: () => Promise<void>,
    successMessage: string,
  ) {
    setActionLoading(true);
    try {
      await fn();
      toast.success(successMessage);
      await new Promise((r) => setTimeout(r, 500));
      await refetch();
    } catch (err) {
      if (err instanceof AutomationApiError && err.status === 403) {
        toast.error("Admin permission required.");
      } else {
        toast.error(
          err instanceof Error ? err.message : "Action failed.",
        );
      }
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-l border-zinc-200/90 bg-white lg:max-w-md lg:shrink-0 xl:max-w-lg">
      <div className="shrink-0 border-b border-zinc-100 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="mb-2 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to runs
        </button>
        {loading && !execution ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading…
          </div>
        ) : error ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : execution ? (
          <>
            <h2 className="text-base font-bold text-zinc-900">
              {executionRunTitle(
                executedRecipients,
                execution.customerId,
                execution.customer,
              )}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {execution.automation?.name ?? `Automation #${execution.automationId}`}
            </p>
            {recipientSubtitle ? (
              <p className="mt-1 text-xs text-zinc-600">{recipientSubtitle}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${executionStatusBadgeClass(execution.status)}`}
              >
                {execution.status}
              </span>
              {execution.status === "waiting" &&
              formatScheduledCountdown(execution.scheduledAt) ? (
                <span className="text-xs font-medium text-amber-800">
                  {formatScheduledCountdown(execution.scheduledAt)}
                </span>
              ) : null}
            </div>
          </>
        ) : null}
      </div>

      {execution ? (
        <div className="shrink-0 border-b border-zinc-100 px-4 py-3 text-xs text-zinc-600">
          <p>
            <span className="font-semibold text-zinc-700">Current step:</span>{" "}
            {execution.currentNode?.type ?? "—"}
          </p>
          <p className="mt-1">
            <span className="font-semibold text-zinc-700">Started:</span>{" "}
            {formatExecutionDateTime(execution.createdAt)}
          </p>
          {execution.scheduledAt ? (
            <p className="mt-1">
              <span className="font-semibold text-zinc-700">Scheduled:</span>{" "}
              {formatExecutionDateTime(execution.scheduledAt)}
            </p>
          ) : null}
        </div>
      ) : null}

      {isAdmin && execution ? (
        <div className="flex shrink-0 flex-wrap gap-2 border-b border-zinc-100 px-4 py-3">
          {execution.status === "failed" ? (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() =>
                void runAdminAction(
                  () => processExecution(execution.id),
                  "Retry queued.",
                )
              }
              className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              Retry
            </button>
          ) : null}
          {execution.status === "waiting" ? (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() =>
                void runAdminAction(
                  () => resumeExecution(execution.id),
                  "Resume queued.",
                )
              }
              className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
            >
              Resume now
            </button>
          ) : null}
          <button
            type="button"
            disabled={actionLoading}
            onClick={() =>
              void runAdminAction(
                () => processExecution(execution.id),
                "Re-process queued.",
              )
            }
            className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
          >
            Re-process
          </button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {execution?.status === "completed" && executedRecipients.length > 0 ? (
          <div className="mb-5 rounded-xl border border-emerald-200/90 bg-emerald-50/80 px-3 py-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-emerald-900">
              Executed for ({executedRecipients.length})
            </h3>
            <ul className="mt-2 space-y-1.5">
              {executedRecipients.map((recipient) => (
                <li
                  key={recipient.customerId}
                  className="text-sm font-medium text-emerald-950"
                >
                  {recipientLabel(recipient)}
                  <span className="ml-1 text-xs font-normal text-emerald-800">
                    #{recipient.customerId}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-500">
          Timeline
        </h3>
        {loading && logs.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">Loading logs…</p>
        ) : logs.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No log entries yet.</p>
        ) : (
          <ol className="relative mt-4 space-y-0 border-l border-zinc-200 pl-4">
            {logs.map((log) => (
              <li key={log.id} className="relative pb-6 last:pb-0">
                <span
                  className="absolute -left-[1.3rem] top-1 size-2.5 rounded-full bg-zinc-300 ring-4 ring-white"
                  aria-hidden
                />
                <p className="text-[0.65rem] font-semibold text-zinc-500">
                  {formatExecutionDateTime(log.createdAt)}
                </p>
                {log.node?.type ? (
                  <span className="mt-1 inline-flex rounded-md bg-zinc-100 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-zinc-600">
                    {log.node.type}
                  </span>
                ) : null}
                <p className="mt-1 text-sm text-zinc-800">{log.message}</p>
                {log.error ? (
                  <p className="mt-1 text-sm font-medium text-red-600">
                    {log.error}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
