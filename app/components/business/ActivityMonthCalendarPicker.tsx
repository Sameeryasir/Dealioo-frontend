"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAnchoredMenu } from "@/app/hooks/use-anchored-menu";
import {
  ACTIVITY_ALL_MONTHS_ID,
  ACTIVITY_MONTH_COUNT,
  ACTIVITY_MONTH_SHORT_NAMES,
  buildActivityMonthFilterOptions,
  buildActivityMonthKey,
  formatActivityMonthLabel,
  isActivityMonthSelectable,
  parseActivityMonthKey,
} from "@/app/lib/activity-month-filter";
import { automationEase } from "@/app/lib/motion";

function getInitialViewYear(value: string): number {
  if (value === ACTIVITY_ALL_MONTHS_ID) {
    return new Date().getUTCFullYear();
  }
  return parseActivityMonthKey(value)?.year ?? new Date().getUTCFullYear();
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return buildActivityMonthKey(now.getUTCFullYear(), now.getUTCMonth() + 1);
}

export function ActivityMonthCalendarPicker({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (monthKey: string) => void;
  className?: string;
}) {
  const monthOptions = useMemo(() => buildActivityMonthFilterOptions(), []);
  const selectedLabel = useMemo(
    () =>
      monthOptions.find((option) => option.id === value)?.label ??
      "Select month",
    [monthOptions, value],
  );

  const [viewYear, setViewYear] = useState(() => getInitialViewYear(value));
  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);

  const {
    open,
    setOpen,
    mounted,
    anchorRef,
    menuRef,
    menuPosition,
    menuStyle,
  } = useAnchoredMenu({
    width: 300,
    align: "right",
    estimatedHeight: 340,
  });

  const { minYear, maxYear } = useMemo(() => {
    const now = new Date();
    return {
      minYear: now.getUTCFullYear() - 1,
      maxYear: now.getUTCFullYear(),
    };
  }, []);

  useEffect(() => {
    if (open) {
      setViewYear(getInitialViewYear(value));
    }
  }, [open, value]);

  const canGoPrevYear = viewYear > minYear;
  const canGoNextYear = viewYear < maxYear;

  const menu =
    open && menuPosition ? (
      <div ref={menuRef}>
        <motion.div
          role="dialog"
          aria-label="Choose month"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.24, ease: automationEase }}
          style={menuStyle}
          className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white p-3 shadow-lg ring-1 ring-zinc-950/[0.04]"
        >
          <button
            type="button"
            onClick={() => {
              onChange(ACTIVITY_ALL_MONTHS_ID);
              setOpen(false);
            }}
            className={`mb-3 flex w-full cursor-pointer items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition ${
              value === ACTIVITY_ALL_MONTHS_ID
                ? "bg-zinc-900 text-white"
                : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            All months (last {ACTIVITY_MONTH_COUNT})
          </button>

          <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-zinc-100 bg-zinc-50/80 px-2 py-1.5">
            <button
              type="button"
              aria-label="Previous year"
              disabled={!canGoPrevYear}
              onClick={() => setViewYear((year) => year - 1)}
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <p className="text-sm font-semibold tabular-nums text-zinc-900">
              {viewYear}
            </p>
            <button
              type="button"
              aria-label="Next year"
              disabled={!canGoNextYear}
              onClick={() => setViewYear((year) => year + 1)}
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {ACTIVITY_MONTH_SHORT_NAMES.map((label, index) => {
              const month = index + 1;
              const monthKey = buildActivityMonthKey(viewYear, month);
              const selectable = isActivityMonthSelectable(monthKey);
              const isSelected =
                value !== ACTIVITY_ALL_MONTHS_ID && value === monthKey;
              const isCurrent = monthKey === currentMonthKey;

              return (
                <button
                  key={monthKey}
                  type="button"
                  disabled={!selectable}
                  aria-label={formatActivityMonthLabel(monthKey)}
                  aria-pressed={isSelected}
                  onClick={() => {
                    onChange(monthKey);
                    setOpen(false);
                  }}
                  className={`rounded-lg px-2 py-2.5 text-sm font-medium transition ${
                    isSelected
                      ? "bg-zinc-900 text-white shadow-sm"
                      : selectable
                        ? isCurrent
                          ? "cursor-pointer bg-white text-zinc-900 ring-2 ring-zinc-900/15 hover:bg-zinc-50"
                          : "cursor-pointer bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                        : "cursor-not-allowed bg-zinc-50/60 text-zinc-300"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    ) : null;

  return (
    <div ref={anchorRef} className={className}>
      <label className="flex w-full min-w-0 flex-col gap-1 text-xs font-medium text-zinc-600 sm:w-auto sm:shrink-0">
        Month
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label="Choose month"
          className="flex h-[42px] w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-900 transition hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10 sm:min-w-[12rem]"
        >
          <Calendar className="size-4 shrink-0 text-zinc-500" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.24, ease: automationEase }}
            className="shrink-0 text-zinc-400"
          >
            <ChevronDown className="size-4" aria-hidden />
          </motion.span>
        </button>
      </label>

      {mounted
        ? createPortal(
            <AnimatePresence>{menu}</AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}
