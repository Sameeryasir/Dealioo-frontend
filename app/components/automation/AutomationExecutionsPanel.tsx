"use client";

import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Clock,
  GitBranch,
  Hash,
  ListChecks,
  Loader2,
  Mail,
  PauseCircle,
  Play,
  RefreshCw,
  Trash2,
  Users,
  Workflow,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { DeleteExecutionDialog } from "@/app/components/automation/DeleteExecutionDialog";
import { ExecutionsPagination } from "@/app/components/automation/ExecutionsPagination";
import { RunProgressBanner } from "@/app/components/automation/RunProgressBanner";
import {
  customerLabel,
  executionProgressLabel,
  executionRunSubtitle,
  executionRunTitle,
  executionStatusBadgeClass,
  formatExecutionDateTime,
  formatScheduledCountdown,
  isExecutionInProgress,
} from "@/app/components/automation/execution-status-ui";
import { Skeleton } from "@/app/components/skeleton";
import { useAutomationExecutions } from "@/app/hooks/use-automation-executions";
import { useStartAutomationRun } from "@/app/hooks/use-start-automation-run";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { StatusPill } from "@/app/components/StatusPill";
import { toastApiError } from "@/app/lib/toast-api-error";
import { deleteExecution } from "@/app/services/automation/execution-api";
import type {
  AutomationExecution,
  AutomationExecutionStatus,
} from "@/app/services/automation/types";

const ICON_STROKE = 2.25;

/** Column layout for runs report table (icon · run · customers · step · started · id · status · chevron). */
const RUNS_TABLE_GRID =
  "grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1.15fr)_0.55fr_0.72fr_0.48fr_0.7fr_2.5rem] items-center gap-x-4";

const STATUS_FILTERS: { id: "all" | AutomationExecutionStatus; label: string }[] =
  [
    { id: "all", label: "All" },
    { id: "queued", label: "Queued" },
    { id: "running", label: "Running" },
    { id: "waiting", label: "Waiting" },
    { id: "completed", label: "Completed" },
    { id: "failed", label: "Failed" },
  ];

function statusIcon(status: AutomationExecutionStatus): LucideIcon {
  switch (status) {
    case "queued":
      return Loader2;
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

function stepTypeIcon(type?: string): LucideIcon {
  const t = (type ?? "").toLowerCase();
  if (t.includes("email")) return Mail;
  if (t.includes("condition")) return GitBranch;
  if (t.includes("trigger")) return Zap;
  return CircleDot;
}

function rowAccentClass(status: AutomationExecutionStatus): string {
  switch (status) {
    case "completed":
      return "border-l-emerald-500";
    case "failed":
      return "border-l-red-500";
    case "waiting":
      return "border-l-amber-500";
    case "running":
    case "queued":
      return "border-l-blue-500";
    default:
      return "border-l-transparent";
  }
}

function AutomationRunsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading runs">
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm ring-1 ring-zinc-950/[0.03]"
          >
            <div className="flex items-center gap-3">
              <Skeleton funnel className="size-11 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton funnel className="h-2.5 w-20" />
                <Skeleton funnel className="h-7 w-10" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-950/[0.04]">
        <div className="border-b border-zinc-200/90 bg-zinc-50/80 px-5 py-3.5">
          <Skeleton funnel className="h-4 w-28" />
          <Skeleton funnel className="mt-2 h-3 w-48" />
        </div>
        <div className="min-w-[48rem] overflow-x-auto">
          <div
            className={`${RUNS_TABLE_GRID} border-b border-zinc-200 px-5 py-3`}
          >
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} funnel className="h-3 w-14" />
            ))}
          </div>
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className={`${RUNS_TABLE_GRID} px-5 py-3.5 ${i % 2 === 1 ? "bg-zinc-50/35" : ""}`}
            >
              <Skeleton funnel className="size-9 rounded-xl" />
              <Skeleton funnel className="h-4 w-full" />
              <Skeleton funnel className="h-4 w-full" />
              <Skeleton funnel className="h-6 w-16 rounded-lg" />
              <Skeleton funnel className="h-4 w-20" />
              <Skeleton funnel className="h-3.5 w-10" />
              <Skeleton funnel className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function RunStatCard({
  label,
  value,
  icon: Icon,
  tone,
  highlight,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone: "zinc" | "emerald" | "blue" | "violet";
  highlight?: boolean;
}) {
  const styles = {
    zinc: {
      card: "border-zinc-200/90 bg-white",
      accent: "bg-zinc-800",
      ring: "ring-zinc-200/60",
    },
    emerald: {
      card: "border-emerald-200/70 bg-white",
      accent: "bg-emerald-600",
      ring: "ring-emerald-200/50",
    },
    blue: {
      card: "border-blue-200/70 bg-white",
      accent: "bg-blue-600",
      ring: "ring-blue-200/50",
    },
    violet: {
      card: "border-violet-200/70 bg-white",
      accent: "bg-violet-600",
      ring: "ring-violet-200/50",
    },
  };
  const s = styles[tone];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${s.card} ${
        highlight ? "ring-2 ring-blue-400/30" : "ring-1 ring-zinc-950/[0.03]"
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 ${s.accent} opacity-80`}
        aria-hidden
      />
      <div className="flex items-center gap-3 pt-0.5">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ring-4 ${s.accent} ${s.ring}`}
        >
          <Icon className="size-5" aria-hidden strokeWidth={ICON_STROKE} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            {label}
          </p>
          <p className="mt-0.5 text-2xl font-bold tracking-tight tabular-nums text-zinc-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function RunRow({
  row,
  onDelete,
  deleting,
}: {
  row: AutomationExecution;
  onDelete: (id: number) => void;
  deleting: boolean;
}) {
  const StatusIcon = statusIcon(row.status);
  const countdown =
    row.status === "waiting" ? formatScheduledCountdown(row.scheduledAt) : null;
  const progress = executionProgressLabel(
    row.status,
    row.emailsSentCount,
    row.totalRecipients,
  );
  const customersText =
    progress ??
    executionRunSubtitle(row.executedRecipients) ??
    customerLabel(row.customerId, row.customer);
  const runSummary = executionRunTitle(
    row.executedRecipients,
    row.customerId,
    row.customer,
  );

  const inProgress = isExecutionInProgress(row.status);
  const StepIcon = stepTypeIcon(row.currentNode?.type);
  const recipientCount = row.executedRecipients?.length ?? 0;
  const stepLabel = row.currentNode?.type ?? "—";

  return (
    <div
      className={`group ${RUNS_TABLE_GRID} w-full border-l-2 px-5 py-3.5 text-sm transition hover:bg-violet-50/30 ${rowAccentClass(row.status)} pl-[calc(1.25rem-2px)] ${
        inProgress ? "bg-sky-50/40" : ""
      }`}
    >
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-inset ring-black/[0.04] ${executionStatusBadgeClass(row.status)}`}
      >
        <StatusIcon
          className={`size-4 ${row.status === "queued" || row.status === "running" ? "animate-spin" : ""}`}
          aria-hidden
          strokeWidth={ICON_STROKE}
        />
      </span>

      <div className="flex min-w-0 items-center gap-2">
        <ListChecks
          className="size-4 shrink-0 text-zinc-400 opacity-0 transition group-hover:opacity-100"
          aria-hidden
          strokeWidth={ICON_STROKE}
        />
        <p
          className="min-w-0 truncate font-semibold text-zinc-900"
          title={runSummary}
        >
          {runSummary}
        </p>
        {recipientCount > 0 ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tabular-nums text-emerald-800 ring-1 ring-emerald-200/80">
            <Users className="size-3" aria-hidden strokeWidth={ICON_STROKE} />
            {recipientCount}
          </span>
        ) : null}
      </div>

      <div
        className="flex min-w-0 items-center gap-2 text-zinc-600"
        title={customersText}
      >
        <Users
          className="size-4 shrink-0 text-violet-500/90"
          aria-hidden
          strokeWidth={ICON_STROKE}
        />
        <p className="min-w-0 truncate">{customersText}</p>
      </div>

      <span className="inline-flex w-fit max-w-full items-center gap-1.5 truncate rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold capitalize text-zinc-700 ring-1 ring-zinc-200/80">
        <StepIcon className="size-3.5 shrink-0 text-zinc-500" aria-hidden />
        {stepLabel}
      </span>

      <div className="flex min-w-0 items-center gap-1.5 tabular-nums text-zinc-600">
        <CalendarClock
          className="size-4 shrink-0 text-zinc-400"
          aria-hidden
          strokeWidth={ICON_STROKE}
        />
        <span className="truncate">{formatExecutionDateTime(row.createdAt)}</span>
      </div>

      <span className="inline-flex w-fit items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 font-mono text-xs font-semibold tabular-nums text-zinc-700 ring-1 ring-zinc-200/80">
        <Hash className="size-3 shrink-0 text-zinc-400" aria-hidden />
        {row.status === "waiting"
          ? countdown ?? formatExecutionDateTime(row.scheduledAt)
          : row.id}
      </span>

      <StatusPill
        size="xs"
        className={`inline-flex w-fit items-center gap-1.5 ${executionStatusBadgeClass(row.status)}`}
      >
        <StatusIcon className="size-3 shrink-0" aria-hidden strokeWidth={ICON_STROKE} />
        {row.status}
      </StatusPill>

      <button
        type="button"
        title={
          inProgress
            ? "Cannot delete while run is in progress"
            : "Delete run"
        }
        disabled={inProgress || deleting}
        onClick={() => onDelete(row.id)}
        className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {deleting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Trash2 className="size-4" aria-hidden strokeWidth={ICON_STROKE} />
        )}
      </button>
    </div>
  );
}

export function AutomationExecutionsPanel({
  automationId,
  automationActive,
  onExecutionStarted,
}: {
  automationId: number;
  automationActive?: boolean;
  onExecutionStarted?: (id: number) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<
    "all" | AutomationExecutionStatus
  >("all");
  const { busy, activeRun, run } = useStartAutomationRun(
    automationId,
    automationActive,
  );

  const apiStatus = statusFilter === "all" ? undefined : statusFilter;

  const { executions, meta, summary, page, setPage, loading, error, refetch } =
    useAutomationExecutions(automationId, apiStatus);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const confirmDeleteRun = useCallback(async () => {
    const executionId = deleteTargetId;
    if (executionId == null) return;

    setDeletingId(executionId);
    try {
      await deleteExecution(executionId);
      toast.success("Run deleted.");
      setDeleteTargetId(null);
      if (executions.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await refetch();
      }
    } catch (err) {
      toastApiError(err, "Could not delete run.");
    } finally {
      setDeletingId(null);
    }
  }, [deleteTargetId, executions.length, page, refetch, setPage]);

  const stats = useMemo(() => {
    return {
      total: meta?.total ?? 0,
      completed: summary?.completed ?? 0,
      inProgress: summary?.inProgress ?? 0,
      customersReached: summary?.customersReached ?? 0,
    };
  }, [meta?.total, summary]);

  return (
    <>
    <div className="min-w-0 bg-zinc-50">
      <div className="border-b border-zinc-200/90 bg-white px-4 py-4 sm:px-6">
        <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20">
              <Workflow className="size-5" aria-hidden strokeWidth={ICON_STROKE} />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-zinc-900">Runs</h2>
              <p className="text-sm text-zinc-500">
                Each run shows which customers received this workflow.
              </p>
            </div>
          </div>
          <div className="min-w-0 -mx-4 overflow-x-auto overscroll-x-contain px-4 pb-0.5 sm:-mx-6 sm:px-6 xl:mx-0 xl:overflow-visible xl:px-0 xl:pb-0">
            <div className="flex w-max flex-nowrap items-center gap-2 xl:w-auto xl:flex-wrap">
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
              disabled={loading || busy}
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
              disabled={busy || automationActive === false}
              onClick={() =>
                void run((result) => {
                  setPage(1);
                  onExecutionStarted?.(result.executionId);
                })
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
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6">
        {activeRun && !activeRun.isTerminal ? (
          <RunProgressBanner status={activeRun} />
        ) : null}

        {!loading && !error && executions.length > 0 ? (
          <div className="mb-5 -mx-4 overflow-x-auto overscroll-x-contain px-4 pb-1 sm:-mx-6 sm:px-6 xl:mx-0 xl:overflow-visible xl:px-0 xl:pb-0">
            <div className="grid min-w-[36rem] gap-3 sm:min-w-0 sm:grid-cols-2 xl:grid-cols-4">
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
              highlight={stats.inProgress > 0}
            />
            <RunStatCard
              label="Customers reached"
              value={stats.customersReached}
              icon={Users}
              tone="violet"
            />
            </div>
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
        ) : (meta?.total ?? 0) === 0 ? (
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
          <section className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-950/[0.04]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/90 bg-gradient-to-r from-zinc-50 to-white px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
                  <ListChecks
                    className="size-4"
                    aria-hidden
                    strokeWidth={ICON_STROKE}
                  />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Recent runs</h3>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    All runs for this automation in one place.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold tabular-nums text-zinc-700 ring-1 ring-zinc-200/90">
                <Workflow className="size-3.5 text-violet-600" aria-hidden />
                {meta?.total ?? executions.length} total
              </span>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[48rem]">
                <div
                  className={`${RUNS_TABLE_GRID} border-b border-zinc-200 bg-zinc-50/95 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500`}
                >
                  <TableColumnHeader label="" />
                  <TableColumnHeader icon={ListChecks} label="Run" />
                  <TableColumnHeader icon={Users} label="Customers" />
                  <TableColumnHeader icon={Mail} label="Step" />
                  <TableColumnHeader icon={CalendarClock} label="Started" />
                  <TableColumnHeader icon={Hash} label="Run ID" />
                  <TableColumnHeader icon={CheckCircle2} label="Status" />
                  <span aria-hidden />
                </div>
                <div className="divide-y divide-zinc-100/90">
                  {executions.map((row, index) => (
                    <div
                      key={row.id}
                      className={index % 2 === 1 ? "bg-zinc-50/35" : "bg-white"}
                    >
                      <RunRow
                        row={row}
                        onDelete={setDeleteTargetId}
                        deleting={deletingId === row.id}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {meta && meta.totalPages > 0 ? (
              <ExecutionsPagination
                page={page}
                totalPages={meta.totalPages}
                total={meta.total}
                limit={meta.limit}
                loading={loading}
                onPageChange={setPage}
              />
            ) : null}
          </section>
        )}
      </div>
    </div>

    <DeleteExecutionDialog
      open={deleteTargetId != null}
      isDeleting={deletingId != null}
      onCancel={() => {
        if (deletingId == null) setDeleteTargetId(null);
      }}
      onConfirm={() => void confirmDeleteRun()}
    />
    </>
  );
}
