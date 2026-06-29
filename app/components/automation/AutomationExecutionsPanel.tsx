"use client";

import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Clock,
  ListChecks,
  Loader2,
  PauseCircle,
  RefreshCw,
  Trash2,
  Users,
  Workflow,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AutomationFilterDropdown } from "@/app/components/automation/AutomationFilterDropdown";
import { DeleteExecutionDialog } from "@/app/components/automation/DeleteExecutionDialog";
import { ExecutionLogsDrawer } from "@/app/components/automation/ExecutionLogsDrawer";
import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { MetricStatCardAccent } from "@/app/components/shared/MetricStatCard";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import { PanelEmptyState } from "@/app/components/shared/PanelEmptyState";
import { ReportTable } from "@/app/components/shared/ReportTable";
import { PauseAutomationButton } from "@/app/components/shared/PauseAutomationButton";
import { ActivateAutomationFirstHint, RunAutomationButton } from "@/app/components/shared/RunAutomationButton";
import { useToggleAutomationActive } from "@/app/hooks/use-toggle-automation-active";
import { executionStatusBadgeClass } from "@/app/lib/badge-variants";
import { formatDateTimeShort } from "@/app/lib/datetime";
import { reportTableShellClass } from "@/app/lib/panel-styles";
import { RunProgressBanner } from "@/app/components/automation/RunProgressBanner";
import {
  executionRunCustomersLine,
  executionRunDisplayName,
  isExecutionInProgress,
} from "@/app/components/automation/execution-status-ui";
import { Skeleton } from "@/app/components/skeleton";
import { useAutomationExecutions } from "@/app/hooks/use-automation-executions";
import { useStartAutomationRun } from "@/app/hooks/use-start-automation-run";
import { useAutomationPusherTerminal } from "@/app/hooks/use-automation-pusher-terminal";
import {
  collectInProgressExecutionIds,
  useWatchExecutionsTerminal,
} from "@/app/hooks/use-watch-executions-terminal";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { StatusPill } from "@/app/components/StatusPill";
import { toastApiError } from "@/app/lib/toast-api-error";
import {
  runsContentFade,
  runsPanelReveal,
  runsRowReveal,
  runsStagger,
} from "@/app/lib/motion";
import { mapPusherPayloadToStatusDto } from "@/app/lib/pusher-execution";
import type { ExecutionTerminalPusherPayload } from "@/app/lib/pusher-execution";
import type {
  AutomationExecution,
  AutomationExecutionStatus,
  AutomationExecutionStatusDto,
} from "@/app/services/automation/types";

const ICON_STROKE = 2.25;

const RUNS_TABLE_GRID =
  "grid grid-cols-[minmax(10rem,1.5fr)_minmax(9rem,1.2fr)_minmax(8.5rem,1fr)_minmax(9.5rem,1.1fr)] items-center gap-x-4";
const RUNS_CELL = "min-w-0 justify-self-start";
const RUNS_STATUS_ACTIONS_CELL =
  "flex min-w-0 items-center justify-between gap-2 justify-self-stretch";

const STATUS_FILTERS: { id: "all" | AutomationExecutionStatus; label: string }[] =
  [
    { id: "all", label: "All" },
    { id: "queued", label: "Queued" },
    { id: "running", label: "Running" },
    { id: "waiting", label: "Waiting" },
    { id: "paused", label: "Paused" },
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
    case "paused":
      return PauseCircle;
    case "completed":
      return CheckCircle2;
    case "failed":
      return XCircle;
    default:
      return PauseCircle;
  }
}

function rowAccentClass(status: AutomationExecutionStatus): string {
  switch (status) {
    case "completed":
      return "border-l-emerald-500";
    case "failed":
      return "border-l-red-500";
    case "waiting":
      return "border-l-amber-500";
    case "paused":
      return "border-l-zinc-400";
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

      <section className={reportTableShellClass}>
        <div className="border-b border-zinc-200/90 bg-zinc-50/80 px-5 py-3.5">
          <Skeleton funnel className="h-4 w-28" />
          <Skeleton funnel className="mt-2 h-3 w-48" />
        </div>
        <div className="min-w-[36rem] overflow-x-auto">
          <div
            className={`${RUNS_TABLE_GRID} border-b border-zinc-200 px-5 py-3`}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                funnel
                className={`h-3 ${i === 3 ? "ml-auto h-8 w-8 rounded-lg" : "w-14"}`}
              />
            ))}
          </div>
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className={`${RUNS_TABLE_GRID} px-5 py-3.5 ${i % 2 === 1 ? "bg-zinc-50/35" : ""}`}
            >
              <Skeleton funnel className="h-4 w-full" />
              <Skeleton funnel className="h-4 w-full" />
              <Skeleton funnel className="h-4 w-20" />
              <div className={RUNS_STATUS_ACTIONS_CELL}>
                <Skeleton funnel className="h-6 w-20 rounded-full" />
                <Skeleton funnel className="size-8 shrink-0 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function RunRow({
  row,
  onOpenLogs,
  onDelete,
  deleting,
  deleteLocked,
}: {
  row: AutomationExecution;
  onOpenLogs: (row: AutomationExecution) => void;
  onDelete: (id: number) => void;
  deleting: boolean;
  deleteLocked: boolean;
}) {
  const StatusIcon = statusIcon(row.status);
  const customersText = executionRunCustomersLine(row);
  const runSummary = executionRunDisplayName(row);

  const inProgress = isExecutionInProgress(row.status);
  const recipientCount =
    row.totalRecipients && row.totalRecipients > 0
      ? row.totalRecipients
      : row.executedRecipients?.length && row.executedRecipients.length > 0
        ? row.executedRecipients.length
        : row.customerId
          ? 1
          : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenLogs(row)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenLogs(row);
        }
      }}
      className={`group ${RUNS_TABLE_GRID} w-full cursor-pointer border-l-2 px-5 py-3.5 text-sm transition hover:bg-violet-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 focus-visible:ring-inset ${rowAccentClass(row.status)} pl-[calc(1.25rem-2px)] ${
        inProgress ? "bg-sky-50/40" : ""
      }`}
    >
      <div className={`${RUNS_CELL} flex items-center gap-2`}>
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
        className={`${RUNS_CELL} flex items-center gap-2 text-zinc-600`}
        title={customersText}
      >
        <Users
          className="size-4 shrink-0 text-violet-500/90"
          aria-hidden
          strokeWidth={ICON_STROKE}
        />
        <p className="min-w-0 truncate">{customersText}</p>
      </div>

      <div
        className={`${RUNS_CELL} flex items-center gap-1.5 tabular-nums text-zinc-600`}
      >
        <CalendarClock
          className="size-4 shrink-0 text-zinc-400"
          aria-hidden
          strokeWidth={ICON_STROKE}
        />
        <span className="truncate whitespace-nowrap">
          {formatDateTimeShort(row.createdAt)}
        </span>
      </div>

      <div className={RUNS_STATUS_ACTIONS_CELL}>
        <StatusPill
          size="xs"
          className={`inline-flex shrink-0 items-center gap-1.5 ${executionStatusBadgeClass(row.status)}`}
        >
          <StatusIcon
            className="size-3 shrink-0"
            aria-hidden
            strokeWidth={ICON_STROKE}
          />
          {row.status}
        </StatusPill>

        <button
          type="button"
          title={
            deleteLocked
              ? "Wait for the current delete to finish"
              : inProgress
                ? "Cannot delete while run is in progress"
                : "Delete run"
          }
          disabled={inProgress || deleting || deleteLocked}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(row.id);
          }}
          className="relative z-10 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {deleting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Trash2 className="size-4" aria-hidden strokeWidth={ICON_STROKE} />
          )}
        </button>
      </div>
    </div>
  );
}

const TERMINAL_BANNER_MS = 2500;

export function AutomationExecutionsPanel({
  automationId,
  automationActive,
  showRunButton = true,
  showPauseButton = false,
  onExecutionStarted,
}: {
  automationId: number;
  automationActive?: boolean;
  showRunButton?: boolean;
  showPauseButton?: boolean;
  onExecutionStarted?: (id: number) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<
    "all" | AutomationExecutionStatus
  >("all");
  const { busy, activeRun, run } = useStartAutomationRun(
    automationId,
    automationActive,
  );
  const {
    busy: pauseBusy,
    pause,
    resume,
  } = useToggleAutomationActive(automationId);

  const apiStatus = statusFilter === "all" ? undefined : statusFilter;

  const {
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
  } = useAutomationExecutions(automationId, apiStatus);

  const [cronRunBanner, setCronRunBanner] =
    useState<AutomationExecutionStatusDto | null>(null);

  const handlePusherTerminal = useCallback(
    (payload: ExecutionTerminalPusherPayload) => {
      applyPusherExecution(payload);

      if (!showPauseButton) {
        return;
      }

      const status = mapPusherPayloadToStatusDto(payload);
      setCronRunBanner(status);

      if (payload.status === "completed") {
        const sent = payload.emailsSent || payload.totalRecipients;
        const total = payload.totalRecipients;
        toast.success(
          `Scheduled run completed — ${sent} of ${total} recipient${total === 1 ? "" : "s"} reached.`,
        );
      } else if (payload.status === "failed") {
        toast.error(payload.lastError ?? "Scheduled run failed.");
      }

      window.setTimeout(() => {
        setCronRunBanner((current) =>
          current?.executionId === payload.executionId ? null : current,
        );
      }, TERMINAL_BANNER_MS);
    },
    [applyPusherExecution, showPauseButton],
  );

  const progressRun = activeRun ?? cronRunBanner;

  const watchExecutionIds = useMemo(() => {
    const extra: number[] = [];
    if (activeRun?.executionId && activeRun.isTerminal !== true) {
      extra.push(activeRun.executionId);
    }
    return collectInProgressExecutionIds(executions, extra);
  }, [executions, activeRun]);

  useWatchExecutionsTerminal({
    automationId,
    executionIds: watchExecutionIds,
    onTerminal: handlePusherTerminal,
  });

  useAutomationPusherTerminal(automationId, handlePusherTerminal);

  useEffect(() => {
    if (!automationActive) return;
    const intervalId = setInterval(() => {
      void refetch();
    }, 15_000);
    return () => clearInterval(intervalId);
  }, [automationActive, refetch]);

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [logsDrawer, setLogsDrawer] = useState<{
    executionId: number;
    runStartedAt?: string | null;
    runTitle: string;
  } | null>(null);

  const deleteTargetName = useMemo(() => {
    if (deleteTargetId == null) return "this run";
    const row = executions.find((e) => e.id === deleteTargetId);
    if (!row) return `Run #${deleteTargetId}`;
    return executionRunDisplayName(row);
  }, [deleteTargetId, executions]);

  const confirmDeleteRun = useCallback(async () => {
    const executionId = deleteTargetId;
    if (executionId == null) return;

    try {
      await deleteExecution(executionId);
      toast.success("Run deleted.");
      setDeleteTargetId(null);
    } catch (err) {
      toastApiError(err, "Could not delete run.");
    }
  }, [deleteTargetId, deleteExecution]);

  const stats = useMemo(() => {
    return {
      total: meta?.total ?? 0,
      completed: summary?.completed ?? 0,
      inProgress: summary?.inProgress ?? 0,
      customersReached: summary?.customersReached ?? 0,
    };
  }, [meta?.total, summary]);

  const openRunLogs = useCallback((row: AutomationExecution) => {
    setLogsDrawer({
      executionId: row.id,
      runStartedAt: row.createdAt,
      runTitle: executionRunDisplayName(row),
    });
  }, []);

  const showInitialSkeleton = loading && executions.length === 0;

  return (
    <>
    <motion.div
      className="min-w-0 bg-zinc-50"
      initial="hidden"
      animate="show"
      variants={runsPanelReveal}
    >
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
            <AutomationFilterDropdown
              value={statusFilter}
              options={STATUS_FILTERS}
              onChange={(next) => setStatusFilter(next)}
              ariaLabel="Filter runs by status"
              className="w-[9.75rem] shrink-0"
            />
            <button
              type="button"
              onClick={() => {
                if (page === 1) void refetch();
                else setPage(1);
              }}
              disabled={loading || busy}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`size-4 ${loading || refreshing ? "animate-spin" : ""}`}
                aria-hidden
              />
              Refresh
            </button>
            {showPauseButton ? (
              <PauseAutomationButton
                busy={pauseBusy}
                isActive={automationActive !== false}
                onClick={() =>
                  void (automationActive !== false ? pause() : resume())
                }
              />
            ) : showRunButton ? (
              <RunAutomationButton
                busy={busy}
                disabled={automationActive === false}
                onClick={() =>
                  void run({
                    onFinished: (status) => {
                      onExecutionStarted?.(status.executionId);
                    },
                  })
                }
              />
            ) : null}
            </div>
          </div>
        </div>
        {showPauseButton ? (
          <p className="mt-3 text-sm text-zinc-500">
            This flow runs on a schedule. Pause or resume it here; each batch
            appears below when unpaid guests are found.
          </p>
        ) : !showRunButton ? (
          <p className="mt-3 text-sm text-zinc-500">
            This flow runs automatically when guests sign up on the funnel.
          </p>
        ) : showRunButton && automationActive === false ? (
          <ActivateAutomationFirstHint className="mt-3" />
        ) : null}
      </div>

      <div className="relative px-4 py-4 sm:px-6">
        <AnimatePresence initial={false}>
          {progressRun ? (
            <motion.div
              key="run-progress"
              className="mb-5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <RunProgressBanner status={progressRun} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {!showInitialSkeleton && !error && executions.length > 0 ? (
          <motion.div
            className="mb-5 -mx-4 overflow-x-auto overscroll-x-contain px-4 pb-1 sm:-mx-6 sm:px-6 xl:mx-0 xl:overflow-visible xl:px-0 xl:pb-0"
            initial="hidden"
            animate="show"
            variants={runsStagger}
          >
            <div className="grid min-w-[36rem] gap-3 sm:min-w-0 sm:grid-cols-2 xl:grid-cols-4">
            <motion.div variants={runsRowReveal}>
            <MetricStatCardAccent
              label="Total runs"
              value={stats.total}
              icon={Workflow}
              tone="zinc"
            />
            </motion.div>
            <motion.div variants={runsRowReveal}>
            <MetricStatCardAccent
              label="Completed"
              value={stats.completed}
              icon={CheckCircle2}
              tone="emerald"
            />
            </motion.div>
            <motion.div variants={runsRowReveal}>
            <MetricStatCardAccent
              label="In progress"
              value={stats.inProgress}
              icon={CircleDot}
              tone="blue"
              highlight={stats.inProgress > 0}
            />
            </motion.div>
            <motion.div variants={runsRowReveal}>
            <MetricStatCardAccent
              label="Customers reached"
              value={stats.customersReached}
              icon={Users}
              tone="violet"
            />
            </motion.div>
            </div>
          </motion.div>
        ) : null}

        <AnimatePresence>
          {refreshing ? (
            <motion.div
              key="runs-refresh"
              className="pointer-events-none absolute inset-x-4 top-4 z-10 h-0.5 overflow-hidden rounded-full bg-violet-100 sm:inset-x-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              aria-hidden
            >
              <motion.div
                className="h-full w-1/3 rounded-full bg-violet-500"
                animate={{ x: ["-120%", "380%"] }}
                transition={{
                  duration: 1.15,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {showInitialSkeleton ? (
            <motion.div
              key="runs-skeleton"
              variants={runsContentFade}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <AutomationRunsSkeleton />
            </motion.div>
          ) : error ? (
            <motion.div
              key="runs-error"
              variants={runsContentFade}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <AsyncErrorRetry
                className=""
                message={error}
                onRetry={() => void refetch()}
              />
            </motion.div>
          ) : (meta?.total ?? 0) === 0 ? (
            <motion.div
              key="runs-empty"
              variants={runsContentFade}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <PanelEmptyState
                icon={Workflow}
                title="No runs yet"
                description={
                  showRunButton
                    ? "Run this automation to email unpaid customers. Each batch appears here with everyone it reached."
                    : showPauseButton
                      ? "Runs appear here on the cron schedule when unpaid guests are found and reminded by email."
                      : "Runs appear here automatically when guests sign up on the funnel."
                }
              />
            </motion.div>
          ) : (
            <motion.div
              key="runs-table"
              variants={runsContentFade}
              initial="hidden"
              animate="show"
              exit="exit"
            >
          <ReportTable
            minWidthClass="min-w-[36rem]"
            header={
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
            }
            footer={
              meta && meta.totalPages > 0 ? (
                <OffsetPagination
                  page={page}
                  totalPages={meta.totalPages}
                  total={meta.total}
                  limit={meta.limit}
                  loading={loading}
                  onPageChange={setPage}
                  itemLabel="runs"
                />
              ) : null
            }
          >
            <div
              className={`${RUNS_TABLE_GRID} border-b border-zinc-200 bg-zinc-50/95 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500`}
            >
              <span className={RUNS_CELL}>
                <TableColumnHeader icon={ListChecks} label="Run" />
              </span>
              <span className={RUNS_CELL}>
                <TableColumnHeader icon={Users} label="Customers" />
              </span>
              <span className={RUNS_CELL}>
                <TableColumnHeader icon={CalendarClock} label="Started" />
              </span>
              <div className={RUNS_STATUS_ACTIONS_CELL}>
                <TableColumnHeader icon={CheckCircle2} label="Status" />
                <span className="size-8 shrink-0" aria-hidden />
              </div>
            </div>
            <motion.div
              className="divide-y divide-zinc-100/90"
              initial="hidden"
              animate="show"
              variants={runsStagger}
            >
              {executions.map((row, index) => (
                <motion.div
                  key={row.id}
                  variants={runsRowReveal}
                  className={index % 2 === 1 ? "bg-zinc-50/35" : "bg-white"}
                >
                  <RunRow
                    row={row}
                    onOpenLogs={openRunLogs}
                    onDelete={(id) => {
                      if (deletingId != null) return;
                      setDeleteTargetId(id);
                    }}
                    deleting={deletingId === row.id}
                    deleteLocked={deletingId != null}
                  />
                </motion.div>
              ))}
            </motion.div>
          </ReportTable>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>

    <DeleteExecutionDialog
      open={deleteTargetId != null}
      itemName={deleteTargetName}
      isDeleting={deletingId === deleteTargetId}
      onCancel={() => {
        if (deletingId == null) setDeleteTargetId(null);
      }}
      onConfirm={() => void confirmDeleteRun()}
    />

    <ExecutionLogsDrawer
      open={logsDrawer != null}
      executionId={logsDrawer?.executionId ?? null}
      runStartedAt={logsDrawer?.runStartedAt}
      runTitle={logsDrawer?.runTitle ?? "Run"}
      onClose={() => setLogsDrawer(null)}
    />

    </>
  );
}
