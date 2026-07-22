"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Loader2,
  X,
} from "lucide-react";
import { useId, useMemo } from "react";
import {
  groupLogsForDisplay,
  isRunFinishedLogDisplay,
  logActivityCardTitle,
  type LogDisplay,
  type LogDisplayTone,
} from "@/app/components/automation/execution-log-ui";
import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { formatLogDrawerTimestamp } from "@/app/lib/datetime";
import {
  automationEase,
  drawerLogItem,
  drawerLogStagger,
} from "@/app/lib/motion";
import { useExecutionLogs } from "@/app/hooks/use-execution-logs";
import { useOverlayLock } from "@/app/hooks/use-overlay-lock";

const TONE_STYLES: Record<
  LogDisplayTone,
  { dot: string; label: string; card: string; accent: string }
> = {
  info: {
    dot: "bg-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,0.25)]",
    label: "text-sky-600",
    accent: "border-l-sky-400",
    card: "border-sky-100/90 bg-white ring-1 ring-sky-100/60",
  },
  success: {
    dot: "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.25)]",
    label: "text-emerald-600",
    accent: "border-l-emerald-400",
    card: "border-emerald-100/90 bg-white ring-1 ring-emerald-100/60",
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
  const showSummary =
    display.summary.trim() && title !== display.summary.trim();

  return (
    <motion.li variants={drawerLogItem} className="relative flex gap-3.5">
      <div className="flex w-5 shrink-0 flex-col items-center pt-4">
        <span
          className={`size-2.5 shrink-0 rounded-full ring-4 ring-[#f8f9fc] ${tone.dot}`}
          aria-hidden
        />
        {!isLast ? (
          <span
            className="mt-2 w-px flex-1 min-h-[1.25rem] bg-gradient-to-b from-zinc-200 via-violet-200/80 to-emerald-200/80"
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
            {display.summary}
          </p>
        ) : null}
        {display.details.length > 0 ? (
          <ul className="mt-2.5 space-y-1.5">
            {display.details.map((line) => (
              <li
                key={line}
                className="rounded-lg bg-zinc-50 px-2.5 py-1.5 text-[13px] leading-relaxed text-zinc-600"
              >
                {line.replace(/^Sent to /i, "")}
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
  runTitle: string;
  onClose: () => void;
};

export function ExecutionLogsDrawer({
  open,
  executionId,
  runStartedAt,
  runTitle,
  onClose,
}: ExecutionLogsDrawerProps) {
  const titleId = useId();
  const { logs, loading, error, refetch } = useExecutionLogs(
    open ? executionId : null,
  );

  const activitySteps = useMemo(() => groupLogsForDisplay(logs), [logs]);
  const stepCount = activitySteps.length;
  const completed = activitySteps.some(isRunFinishedLogDisplay);

  useOverlayLock(open, onClose);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70]" role="presentation">
          <motion.button
            type="button"
            aria-label="Close activity"
            className="absolute inset-0 cursor-pointer bg-zinc-950/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute right-0 top-0 flex h-full w-full max-w-[22rem] flex-col overflow-hidden bg-[#f8f9fc] shadow-[-8px_0_32px_rgba(15,23,42,0.12)] sm:max-w-[24rem]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: automationEase }}
          >
            <header
              className="w-full shrink-0 px-6 pb-5 pt-5 text-white shadow-[0_4px_24px_rgba(7,17,31,0.35)]"
              style={{
                background:
                  "linear-gradient(180deg, #07111f 0%, #0a1628 52%, #0f1f3d 100%)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                      <ClipboardList className="size-4" aria-hidden />
                    </span>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                      Run activity
                    </p>
                  </div>
                  <h2
                    id={titleId}
                    className="mt-3 text-[17px] font-bold leading-snug text-white"
                    title={runTitle}
                  >
                    {runTitle}
                  </h2>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
                    <CalendarClock
                      className="size-3.5 shrink-0 text-zinc-500"
                      aria-hidden
                    />
                    Started {formatLogDrawerTimestamp(runStartedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white/10 text-zinc-300 ring-1 ring-white/15 transition hover:bg-white/15 hover:text-white"
                  aria-label="Close"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>

              {!loading && !error && stepCount > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-zinc-200 ring-1 ring-white/15">
                    {stepCount} step{stepCount === 1 ? "" : "s"}
                  </span>
                  {completed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
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
              <div className="relative z-[1]">
              {loading ? (
                <div
                  className="flex flex-col items-center justify-center gap-3 py-16"
                  aria-busy="true"
                >
                  <Loader2
                    className="size-6 animate-spin text-violet-600"
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
                    className="mx-auto size-8 text-violet-400"
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
        </div>
      ) : null}
    </AnimatePresence>
  );
}
