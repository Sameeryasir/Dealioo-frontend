"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Mail,
  MailX,
  RefreshCw,
  SkipForward,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import {
  groupLogsForDisplay,
  isRunFinishedLogDisplay,
  logActivityCardTitle,
  summarizeRunActivity,
  type LogDisplay,
  type LogDisplayTone,
} from "@/app/components/automation/execution-log-ui";
import { executionStatusPlainLabel } from "@/app/components/automation/execution-status-ui";
import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { formatLogDrawerTimestamp } from "@/app/lib/datetime";
import {
  automationEase,
  drawerLogItem,
  drawerLogStagger,
} from "@/app/lib/motion";
import { useExecutionLogs } from "@/app/hooks/use-execution-logs";
import type { AutomationExecutionStatus } from "@/app/services/automation/types";

const TONE_STYLES: Record<
  LogDisplayTone,
  { dot: string; label: string; card: string; accent: string }
> = {
  info: {
    dot: "bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.25)]",
    label: "text-blue-600",
    accent: "border-l-blue-500",
    card: "border-blue-100/90 bg-white ring-1 ring-blue-100/70",
  },
  success: {
    dot: "bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.25)]",
    label: "text-blue-600",
    accent: "border-l-blue-500",
    card: "border-blue-100/90 bg-white ring-1 ring-blue-100/70",
  },
  warning: {
    dot: "bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.25)]",
    label: "text-amber-700",
    accent: "border-l-amber-400",
    card: "border-amber-100/90 bg-white ring-1 ring-amber-100/60",
  },
  error: {
    dot: "bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.25)]",
    label: "text-red-600",
    accent: "border-l-red-400",
    card: "border-red-100/90 bg-white ring-1 ring-red-100/60",
  },
};

function ActivityCard({
  display,
  isLast,
}: {
  display: LogDisplay;
  isLast: boolean;
}) {
  const tone = TONE_STYLES[display.tone];
  const title = logActivityCardTitle(display);
  const summary = display.summary.trim();
  const showSummary =
    Boolean(summary) &&
    title !== summary &&
    !(
      /email sent/i.test(title) &&
      /email/i.test(summary) &&
      /delivered/i.test(summary)
    );

  return (
    <motion.li variants={drawerLogItem} className="relative flex gap-3.5">
      <div className="flex w-5 shrink-0 flex-col items-center pt-4">
        <span
          className={`size-2.5 shrink-0 rounded-full ring-4 ring-[#f8f9fc] ${tone.dot}`}
          aria-hidden
        />
        {!isLast ? (
          <span
            className="mt-2 w-px flex-1 min-h-[1.25rem] bg-gradient-to-b from-blue-200 via-blue-300/80 to-blue-100"
            aria-hidden
          />
        ) : null}
      </div>

      <article
        className={`min-w-0 flex-1 rounded-xl border-l-[3px] p-4 shadow-sm ${tone.accent} ${tone.card} ${isLast ? "" : "mb-3.5"}`}
      >
        <p
          className={`text-[10px] font-bold uppercase tracking-[0.14em] ${tone.label}`}
        >
          {display.stepLabel}
        </p>
        <h3 className="mt-1.5 text-[15px] font-semibold leading-snug text-zinc-900">
          {title}
        </h3>
        {showSummary ? (
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            {summary}
          </p>
        ) : null}
        {display.details.length > 0 ? (
          <ul className="mt-2.5 space-y-1.5">
            {display.details.map((line) => (
              <li
                key={line}
                className="rounded-lg bg-zinc-50 px-2.5 py-1.5 text-[13px] leading-relaxed text-zinc-600"
              >
                {line}
              </li>
            ))}
          </ul>
        ) : null}
      </article>
    </motion.li>
  );
}

export type ExecutionLogsDrawerProps = {
  open: boolean;
  executionId: number | null;
  runStartedAt: string | null | undefined;
  runUpdatedAt?: string | null;
  runScheduledAt?: string | null;
  runTitle: string;
  runStatus?: AutomationExecutionStatus | null;
  lastError?: string | null;
  emailsSentCount?: number;
  totalRecipients?: number;
  canRetry?: boolean;
  onRetry?: () => Promise<void> | void;
  onClose: () => void;
};

export function ExecutionLogsDrawer({
  open,
  executionId,
  runStartedAt,
  runUpdatedAt,
  runScheduledAt,
  runTitle,
  runStatus,
  lastError,
  emailsSentCount,
  totalRecipients,
  canRetry = false,
  onRetry,
  onClose,
}: ExecutionLogsDrawerProps) {
  const titleId = useId();
  const [retrying, setRetrying] = useState(false);
  const { logs, loading, error, refetch } = useExecutionLogs(
    open ? executionId : null,
  );

  const activitySteps = useMemo(() => groupLogsForDisplay(logs), [logs]);
  const activitySummary = useMemo(
    () => summarizeRunActivity(activitySteps),
    [activitySteps],
  );
  const completed = activitySteps.some(isRunFinishedLogDisplay);
  const isFailedRun = runStatus === "failed" || runStatus === "timed_out";
  const failureMessage =
    lastError?.trim() ||
    activitySteps.find((step) => step.status === "failed")?.summary ||
    (isFailedRun ? "This run did not finish successfully." : null);

  const sentCount = Math.max(activitySummary.sent, emailsSentCount ?? 0);
  const failedCount =
    activitySummary.failed > 0
      ? activitySummary.failed
      : isFailedRun
        ? Math.max((totalRecipients ?? 0) - sentCount, sentCount > 0 ? 0 : 1)
        : 0;
  const skippedCount = activitySummary.skipped;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleRetry = async () => {
    if (!onRetry || retrying) return;
    setRetrying(true);
    try {
      await onRetry();
      onClose();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          role="complementary"
          aria-labelledby={titleId}
          className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-[22rem] flex-col overflow-hidden border-l border-zinc-200 bg-[#f8f9fc] shadow-[-8px_0_32px_rgba(15,23,42,0.12)] sm:max-w-[24rem]"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.3, ease: automationEase }}
        >
            <header className="w-full shrink-0 border-b border-zinc-200 bg-white px-6 pb-5 pt-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200">
                      <ClipboardList className="size-4" aria-hidden />
                    </span>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                      Run activity
                    </p>
                  </div>
                  <h2
                    id={titleId}
                    className="mt-3 text-[17px] font-bold leading-snug text-zinc-900"
                    title={runTitle}
                  >
                    {runTitle}
                  </h2>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                    <CalendarClock
                      className="size-3.5 shrink-0 text-zinc-400"
                      aria-hidden
                    />
                    Started {formatLogDrawerTimestamp(runStartedAt)}
                  </p>
                  {runStatus === "waiting" && runScheduledAt ? (
                    <p className="mt-1 text-xs font-medium text-amber-700">
                      Waiting until {formatLogDrawerTimestamp(runScheduledAt)}
                    </p>
                  ) : runStatus ? (
                    <p className="mt-1 text-xs font-medium text-zinc-700">
                      {executionStatusPlainLabel(runStatus)}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200 transition hover:bg-zinc-200 hover:text-zinc-900"
                  aria-label="Close"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>

              {!loading && !error ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {sentCount > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 ring-1 ring-zinc-200">
                      <Mail className="size-3.5" aria-hidden />
                      Sent {sentCount}
                    </span>
                  ) : null}
                  {failedCount > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 ring-1 ring-zinc-200">
                      <MailX className="size-3.5" aria-hidden />
                      Failed {failedCount}
                    </span>
                  ) : null}
                  {skippedCount > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 ring-1 ring-zinc-200">
                      <SkipForward className="size-3.5" aria-hidden />
                      Skipped {skippedCount}
                    </span>
                  ) : null}
                  {completed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      <CheckCircle2 className="size-3.5" aria-hidden />
                      Completed
                    </span>
                  ) : null}
                </div>
              ) : null}
            </header>

            <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 z-0 h-8 bg-gradient-to-b from-zinc-200/30 to-transparent"
                aria-hidden
              />
              <div className="relative z-[1] space-y-4">
                {isFailedRun && failureMessage ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
                    <div className="flex items-start gap-2.5">
                      <XCircle
                        className="mt-0.5 size-5 shrink-0 text-red-600"
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-red-900">
                          Run failed
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-red-800/90">
                          {failureMessage}
                        </p>
                        {canRetry && onRetry ? (
                          <button
                            type="button"
                            disabled={retrying}
                            onClick={() => void handleRetry()}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                          >
                            {retrying ? (
                              <Loader2
                                className="size-3.5 animate-spin"
                                aria-hidden
                              />
                            ) : (
                              <RefreshCw className="size-3.5" aria-hidden />
                            )}
                            Start a new run
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                {loading ? (
                  <div
                    className="flex flex-col items-center justify-center gap-3 py-16"
                    aria-busy="true"
                  >
                    <Loader2
                      className="size-6 animate-spin text-blue-600"
                      aria-hidden
                    />
                    <p className="text-sm text-zinc-600">Loading activity…</p>
                  </div>
                ) : error ? (
                  <AsyncErrorRetry
                    message={error}
                    onRetry={() => void refetch()}
                  />
                ) : activitySteps.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-200 bg-white px-5 py-10 text-center shadow-sm">
                    <ClipboardList
                      className="mx-auto size-8 text-blue-400"
                      aria-hidden
                    />
                    <p className="mt-3 text-sm font-semibold text-zinc-800">
                      Nothing to show yet
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Activity appears here after the run processes.
                    </p>
                  </div>
                ) : (
                  <motion.ol
                    className="list-none"
                    variants={drawerLogStagger}
                    initial="hidden"
                    animate="show"
                  >
                    {activitySteps.map((display, index) => (
                      <ActivityCard
                        key={`${display.heading}-${index}`}
                        display={display}
                        isLast={index === activitySteps.length - 1}
                      />
                    ))}
                  </motion.ol>
                )}
              </div>
            </div>
          </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
