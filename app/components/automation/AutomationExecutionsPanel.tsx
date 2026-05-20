"use client";

import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock,
  Loader2,
  PauseCircle,
  Play,
  RefreshCw,
  Users,
  Workflow,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  customerLabel,
  executionRunSubtitle,
  executionRunTitle,
  executionStatusBadgeClass,
  formatExecutionDateTime,
  formatScheduledCountdown,
} from "@/app/components/automation/execution-status-ui";
import { Skeleton } from "@/app/components/skeleton";
import { useAutomationExecutions } from "@/app/hooks/use-automation-executions";
import { useStartAutomationRun } from "@/app/hooks/use-start-automation-run";
import type {
  AutomationExecution,
  AutomationExecutionStatus,
} from "@/app/services/automation/types";

const ICON_STROKE = 2.25;

/** Column layout for runs report table (icon · run · customers · step · started · id · status · chevron). */
const RUNS_TABLE_GRID =
  "grid grid-cols-[2rem_minmax(0,0.95fr)_minmax(0,1.1fr)_0.5fr_0.68fr_0.42fr_0.58fr_1rem] items-center gap-x-3";

const STATUS_FILTERS: { id: "all" | AutomationExecutionStatus; label: string }[] =
  [
    { id: "all", label: "All" },
    { id: "running", label: "Running" },
    { id: "waiting", label: "Waiting" },
    { id: "completed", label: "Completed" },
    { id: "failed", label: "Failed" },
  ];

function statusIcon(status: AutomationExecutionStatus): LucideIcon {
  switch (status) {
    case "running":
      return CircleDot;
    case "waiting":
      return Clock;
    case "completed":
      return CheckCircle2;
    case "failed":
      return XCircle;
    default:
      return PauseCircle;
  }
}

function AutomationRunsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading runs">
      <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200/90 bg-white p-3 shadow-sm ring-1 ring-zinc-950/[0.03]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1.5">
                <Skeleton funnel className="h-2.5 w-20" />
                <Skeleton funnel className="h-6 w-10" />
              </div>
              <Skeleton funnel className="size-7 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-950/[0.04]">
        <div className="min-w-[44rem]">
          <div
            className={`${RUNS_TABLE_GRID} border-b border-zinc-200 bg-zinc-50/90 px-4 py-2`}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} funnel className="h-2.5 w-12" />
            ))}
          </div>
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className={`${RUNS_TABLE_GRID} border-b border-zinc-100 px-4 py-2.5 last:border-0`}
            >
              <Skeleton funnel className="size-7 rounded-md" />
              <Skeleton funnel className="h-3.5 w-full" />
              <Skeleton funnel className="h-3.5 w-full" />
              <Skeleton funnel className="h-3.5 w-10" />
              <Skeleton funnel className="h-3.5 w-16" />
              <Skeleton funnel className="h-3.5 w-8" />
              <Skeleton funnel className="h-5 w-14 rounded-full" />
              <Skeleton funnel className="size-3.5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RunStatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone: "zinc" | "emerald" | "blue" | "violet";
}) {
  const tones = {
    zinc: "border-zinc-200/90 bg-gradient-to-br from-zinc-50 to-white",
    emerald: "border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white",
    blue: "border-blue-200/80 bg-gradient-to-br from-blue-50/90 to-white",
    violet: "border-violet-200/80 bg-gradient-to-br from-violet-50/90 to-white",
  };
  const iconTones = {
    zinc: "bg-zinc-800 text-white",
    emerald: "bg-emerald-600 text-white",
    blue: "bg-blue-600 text-white",
    violet: "bg-violet-600 text-white",
  };

  return (
    <div
      className={`rounded-xl border p-3 shadow-sm ring-1 ring-zinc-950/[0.03] ${tones[tone]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            {label}
          </p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-zinc-900">{value}</p>
        </div>
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-md ${iconTones[tone]}`}
        >
          <Icon className="size-3.5" aria-hidden strokeWidth={ICON_STROKE} />
        </span>
      </div>
    </div>
  );
}

function RunRow({
  row,
  selected,
  onSelect,
}: {
  row: AutomationExecution;
  selected: boolean;
  onSelect: () => void;
}) {
  const StatusIcon = statusIcon(row.status);
  const countdown =
    row.status === "waiting" ? formatScheduledCountdown(row.scheduledAt) : null;
  const customersText =
    executionRunSubtitle(row.executedRecipients) ??
    customerLabel(row.customerId, row.customer);
  const runSummary = executionRunTitle(
    row.executedRecipients,
    row.customerId,
    row.customer,
  );

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group ${RUNS_TABLE_GRID} w-full cursor-pointer border-b border-zinc-100 px-4 py-2 text-left text-xs transition last:border-0 ${
        selected
          ? "bg-violet-50/80 ring-1 ring-inset ring-violet-500/20"
          : "hover:bg-zinc-50/90"
      }`}
    >
      <span
        className={`flex size-7 items-center justify-center rounded-md ${executionStatusBadgeClass(row.status)}`}
      >
        <StatusIcon className="size-3.5" aria-hidden strokeWidth={ICON_STROKE} />
      </span>

      <p className="min-w-0 truncate font-medium text-zinc-900" title={runSummary}>
        {runSummary}
      </p>

      <p className="min-w-0 truncate text-zinc-600" title={customersText}>
        {customersText}
      </p>

      <p className="truncate capitalize text-zinc-700">
        {row.currentNode?.type ?? "—"}
      </p>

      <p className="truncate text-zinc-700">
        {formatExecutionDateTime(row.createdAt)}
      </p>

      <p className="truncate font-medium tabular-nums text-zinc-700">
        {row.status === "waiting"
          ? countdown ?? formatExecutionDateTime(row.scheduledAt)
          : `#${row.id}`}
      </p>

      <span
        className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${executionStatusBadgeClass(row.status)}`}
      >
        {row.status}
      </span>

      <ChevronRight
        className={`size-3.5 text-zinc-300 transition group-hover:text-zinc-500 ${
          selected ? "text-violet-500" : ""
        }`}
        aria-hidden
      />
    </button>
  );
}

export function AutomationExecutionsPanel({
  automationId,
  automationActive,
  selectedExecutionId,
  onSelectExecution,
  onExecutionStarted,
}: {
  automationId: number;
  automationActive?: boolean;
  selectedExecutionId: number | null;
  onSelectExecution: (id: number) => void;
  onExecutionStarted: (id: number) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<
    "all" | AutomationExecutionStatus
  >("all");
  const { starting, run } = useStartAutomationRun(
    automationId,
    automationActive,
  );

  const apiStatus = statusFilter === "all" ? undefined : statusFilter;

  const { executions, loading, error, refetch } = useAutomationExecutions(
    automationId,
    apiStatus,
  );

  const stats = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let customersReached = 0;
    for (const row of executions) {
      if (row.status === "completed") completed += 1;
      if (row.status === "running" || row.status === "waiting") inProgress += 1;
      customersReached += row.executedRecipients?.length ?? 0;
    }
    return {
      total: executions.length,
      completed,
      inProgress,
      customersReached,
    };
  }, [executions]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-zinc-50">
      <div className="shrink-0 border-b border-zinc-200/90 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20">
              <Workflow className="size-5" aria-hidden strokeWidth={ICON_STROKE} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Runs</h2>
              <p className="text-sm text-zinc-500">
                Each run shows which customers received this workflow.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
              className="h-10 cursor-pointer rounded-xl border border-zinc-200/90 bg-white px-3 text-sm font-medium text-zinc-800 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/25"
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={loading}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`size-4 ${loading ? "animate-spin" : ""}`}
                aria-hidden
              />
              Refresh
            </button>
            <button
              type="button"
              disabled={starting || automationActive === false}
              onClick={() =>
                void run((id) => {
                  void refetch();
                  onExecutionStarted(id);
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
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {!loading && !error && executions.length > 0 ? (
          <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <RunStatCard label="Total runs" value={stats.total} icon={Workflow} tone="zinc" />
            <RunStatCard
              label="Completed"
              value={stats.completed}
              icon={CheckCircle2}
              tone="emerald"
            />
            <RunStatCard
              label="In progress"
              value={stats.inProgress}
              icon={CircleDot}
              tone="blue"
            />
            <RunStatCard
              label="Customers reached"
              value={stats.customersReached}
              icon={Users}
              tone="violet"
            />
          </div>
        ) : null}

        {loading ? (
          <AutomationRunsSkeleton />
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
        ) : executions.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-zinc-200/90 bg-white px-6 py-16 text-center shadow-sm">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
              <Workflow className="size-7" aria-hidden strokeWidth={ICON_STROKE} />
            </span>
            <p className="mt-4 text-sm font-semibold text-zinc-900">No runs yet</p>
            <p className="mt-1 max-w-sm text-sm text-zinc-500">
              Run this automation to email unpaid customers. Each batch appears
              here with everyone it reached.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-950/[0.04]">
            <div className="min-w-[44rem]">
              <div
                className={`${RUNS_TABLE_GRID} border-b border-zinc-200 bg-zinc-50/90 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500`}
              >
                <span aria-hidden />
                <span>Run</span>
                <span>Customers</span>
                <span>Step</span>
                <span>Started</span>
                <span>Run ID</span>
                <span>Status</span>
                <span aria-hidden />
              </div>
              {executions.map((row) => (
                <RunRow
                  key={row.id}
                  row={row}
                  selected={selectedExecutionId === row.id}
                  onSelect={() => onSelectExecution(row.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
