"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Loader2,
  X,
} from "lucide-react";
import { useEffect, useId, useMemo } from "react";
import {
  groupLogsForDisplay,
  type LogDisplay,
  type LogDisplayTone,
} from "@/app/components/automation/execution-log-ui";
import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { formatLogDrawerTimestamp } from "@/app/lib/datetime";
import { automationEase, automationStagger, automationItem } from "@/app/lib/motion";
import { useExecutionLogs } from "@/app/hooks/use-execution-logs";

const TONE_STYLES: Record<
  LogDisplayTone,
  { dot: string; label: string; heading: string }
> = {
  info: {
    dot: "bg-sky-500",
    label: "text-sky-700",
    heading: "text-zinc-900",
  },
  success: {
    dot: "bg-emerald-500",
    label: "text-emerald-700",
    heading: "text-zinc-900",
  },
  warning: {
    dot: "bg-amber-500",
    label: "text-amber-800",
    heading: "text-zinc-900",
  },
  error: {
    dot: "bg-red-500",
    label: "text-red-700",
    heading: "text-zinc-900",
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

  return (
    <motion.li variants={automationItem} className="relative flex gap-4">
      <div className="flex w-5 shrink-0 flex-col items-center">
        <span
          className={`mt-1.5 size-2.5 shrink-0 rounded-full ring-4 ring-white ${tone.dot}`}
          aria-hidden
        />
        {!isLast ? (
          <span
            className="mt-2 w-px flex-1 min-h-[1.5rem] bg-zinc-200"
            aria-hidden
          />
        ) : null}
      </div>

      <article className={`min-w-0 flex-1 ${isLast ? "" : "pb-6"}`}>
        <p
          className={`text-[11px] font-semibold uppercase tracking-wide ${tone.label}`}
        >
          {display.stepLabel}
        </p>
        <h3
          className={`mt-1.5 text-[15px] font-semibold leading-snug ${tone.heading}`}
        >
          {display.heading}
        </h3>
        {display.summary.trim() ? (
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            {display.summary}
          </p>
        ) : null}
        {display.details.length > 0 ? (
          <ul className="mt-2.5 space-y-1.5 text-sm text-zinc-600">
            {display.details.map((line) => (
              <li key={line} className="break-all leading-relaxed">
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
  const completed = activitySteps.some((s) => s.heading === "Run finished");

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70]" role="presentation">
          <motion.button
            type="button"
            aria-label="Close activity"
            className="absolute inset-0 cursor-pointer bg-zinc-950/35"
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
            className="absolute right-0 top-0 flex h-full w-full max-w-[22rem] flex-col border-l border-zinc-200 bg-white shadow-xl sm:max-w-[24rem]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.34, ease: automationEase }}
          >
            <header className="shrink-0 border-b border-black bg-[#0a0a0a] px-6 pb-5 pt-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                    Run activity
                  </p>
                  <h2
                    id={titleId}
                    className="mt-2 text-base font-bold leading-snug text-white"
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
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-zinc-300">
                    {stepCount} step{stepCount === 1 ? "" : "s"}
                  </span>
                  {completed ? (
                    <>
                      <span className="text-zinc-600" aria-hidden>
                        ·
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-300">
                        <CheckCircle2 className="size-3.5" aria-hidden />
                        Completed
                      </span>
                    </>
                  ) : null}
                </div>
              ) : null}
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
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
                <div className="py-12 text-center">
                  <ClipboardList
                    className="mx-auto size-8 text-zinc-300"
                    aria-hidden
                  />
                  <p className="mt-3 text-sm font-medium text-zinc-800">
                    Nothing to show yet
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Activity appears here after the run processes.
                  </p>
                </div>
              ) : (
                <motion.ol
                  className="list-none"
                  variants={automationStagger}
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
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
