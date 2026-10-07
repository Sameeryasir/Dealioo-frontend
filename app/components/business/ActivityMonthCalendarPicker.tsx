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
  getEarliestSelectableActivityMonth,
  isActivityMonthSelectable,
  parseActivityMonthKey,
} from "@/app/lib/activity-month-filter";
import { automationEase } from "@/app/lib/motion";

const slideTransition = {
  duration: 0.32,
  ease: automationEase,
} as const;

const yearSlideVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction === 0 ? 0 : direction * 24,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction === 0 ? 0 : direction * -24,
  }),
};

function getInitialViewYear(value: string): number {
  if (value === ACTIVITY_ALL_MONTHS_ID) {
    return new Date().getFullYear();
  }
  return parseActivityMonthKey(value)?.year ?? new Date().getFullYear();
}

export function ActivityMonthCalendarPicker({
  value,
  onChange,
  className = "",
  compact = false,
  showAllMonths = true,
  monthCount = ACTIVITY_MONTH_COUNT,
}: {
  value: string;
  onChange: (monthKey: string) => void;
  className?: string;
  compact?: boolean;
  showAllMonths?: boolean;
  monthCount?: number;
}) {
  const monthOptions = useMemo(
    () => buildActivityMonthFilterOptions(monthCount),
    [monthCount],
  );
  const selectedLabel = useMemo(() => {
    if (value === ACTIVITY_ALL_MONTHS_ID) {
      return "All months";
    }
    const fromOptions = monthOptions.find((option) => option.id === value)?.label;
    if (fromOptions) {
      return fromOptions;
    }
    return formatActivityMonthLabel(value);
  }, [monthOptions, value]);

  const [viewYear, setViewYear] = useState(() => getInitialViewYear(value));
  const [pickerView, setPickerView] = useState<"month" | "year">("month");
  const [yearDirection, setYearDirection] = useState(0);

  const {
    open,
    setOpen,
    mounted,
    anchorRef,
    menuRef,
    menuPosition,
    menuStyle,
  } = useAnchoredMenu({
    width: 320,
    align: "right",
    estimatedHeight: 340,
  });

  const { minYear, maxYear, yearOptions } = useMemo(() => {
    const now = new Date();
    const earliestYear = getEarliestSelectableActivityMonth(monthCount).getFullYear();
    const latestYear = now.getFullYear();
    const years: number[] = [];
    for (let year = latestYear; year >= earliestYear; year -= 1) {
      years.push(year);
    }
    return {
      minYear: earliestYear,
      maxYear: latestYear,
      yearOptions: years,
    };
  }, [monthCount]);

  useEffect(() => {
    if (open) {
      setViewYear(getInitialViewYear(value));
      setPickerView("month");
      setYearDirection(0);
    }
  }, [open, value]);

  const canGoPrevYear = viewYear > minYear;
  const canGoNextYear = viewYear < maxYear;

  const goToYear = (nextYear: number, direction: number) => {
    setYearDirection(direction);
    setViewYear(nextYear);
  };

  const headerLabel = useMemo(() => {
    if (pickerView === "year") {
      return String(viewYear);
    }
    if (value !== ACTIVITY_ALL_MONTHS_ID) {
      const parsed = parseActivityMonthKey(value);
      if (parsed && parsed.year === viewYear) {
        return formatActivityMonthLabel(value);
      }
    }
    return String(viewYear);
  }, [pickerView, value, viewYear]);

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
          className="overflow-hidden rounded-[1.1rem] border border-[#e8edf5] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
        >
          {showAllMonths ? (
            <div className="px-3 pt-2.5">
              <button
                type="button"
                onClick={() => {
                  onChange(ACTIVITY_ALL_MONTHS_ID);
                  setOpen(false);
                }}
                className={`mb-1 flex w-full cursor-pointer items-center justify-center py-1 text-[0.75rem] font-semibold transition ${
                  value === ACTIVITY_ALL_MONTHS_ID
                    ? "text-[#1877f2]"
                    : "text-slate-500 hover:text-[#1877f2]"
                }`}
              >
                All months
              </button>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-2.5">
            <button
              type="button"
              onClick={() =>
                setPickerView((current) =>
                  current === "month" ? "year" : "month",
                )
              }
              className="inline-flex min-w-0 cursor-pointer items-center gap-1 text-[0.9rem] font-bold text-[#07111f] transition hover:text-[#1877f2]"
              aria-label={
                pickerView === "month" ? "Choose year" : "Back to months"
              }
            >
              <span className="relative inline-flex min-h-[1.35rem] min-w-[6.5rem] items-center overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={headerLabel}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={slideTransition}
                    className="inline-block truncate"
                  >
                    {headerLabel}
                  </motion.span>
                </AnimatePresence>
              </span>
              <motion.span
                animate={{ rotate: pickerView === "year" ? 180 : 0 }}
                transition={slideTransition}
                className="shrink-0 text-slate-400"
              >
                <ChevronDown className="size-4" aria-hidden />
              </motion.span>
            </button>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Previous year"
                disabled={!canGoPrevYear || pickerView === "year"}
                onClick={() => goToYear(viewYear - 1, -1)}
                className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-[#e8edf5] bg-white text-slate-500 transition hover:border-[#1877f2]/30 hover:text-[#1877f2] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Next year"
                disabled={!canGoNextYear || pickerView === "year"}
                onClick={() => goToYear(viewYear + 1, 1)}
                className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-[#e8edf5] bg-white text-slate-500 transition hover:border-[#1877f2]/30 hover:text-[#1877f2] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden px-3 pb-3">
            <AnimatePresence mode="wait" initial={false} custom={yearDirection}>
              {pickerView === "year" ? (
                <motion.div
                  key="year-grid"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={slideTransition}
                  className="grid max-h-[14rem] grid-cols-3 gap-2 overflow-y-auto"
                >
                  {yearOptions.map((year) => {
                    const isSelectedYear = year === viewYear;
                    return (
                      <button
                        key={year}
                        type="button"
                        onClick={() => {
                          goToYear(year, year > viewYear ? 1 : -1);
                          setPickerView("month");
                        }}
                        className={`relative flex h-10 items-center justify-center rounded-xl text-[0.8rem] font-semibold transition ${
                          isSelectedYear
                            ? "text-white"
                            : "cursor-pointer bg-transparent text-[#07111f] hover:text-[#1877f2]"
                        }`}
                      >
                        {isSelectedYear ? (
                          <motion.span
                            layoutId="month-picker-selected"
                            className="absolute inset-0 rounded-xl bg-[#1877f2]"
                            transition={slideTransition}
                          />
                        ) : null}
                        <span className="relative z-10">{year}</span>
                      </button>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key={`month-grid-${viewYear}`}
                  custom={yearDirection}
                  variants={yearSlideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={slideTransition}
                  className="grid grid-cols-3 gap-2"
                >
                  {ACTIVITY_MONTH_SHORT_NAMES.map((label, index) => {
                    const month = index + 1;
                    const monthKey = buildActivityMonthKey(viewYear, month);
                    const selectable = isActivityMonthSelectable(
                      monthKey,
                      monthCount,
                    );
                    const isSelected =
                      value !== ACTIVITY_ALL_MONTHS_ID && value === monthKey;

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
                        className={`relative flex h-10 items-center justify-center rounded-xl text-[0.8rem] font-semibold transition ${
                          isSelected
                            ? "text-white"
                            : selectable
                              ? "cursor-pointer bg-transparent text-[#07111f] hover:text-[#1877f2]"
                              : "cursor-not-allowed bg-transparent text-slate-300"
                        }`}
                      >
                        {isSelected ? (
                          <motion.span
                            layoutId="month-picker-selected"
                            className="absolute inset-0 rounded-xl bg-[#1877f2]"
                            transition={slideTransition}
                          />
                        ) : null}
                        <span className="relative z-10">{label}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    ) : null;

  return (
    <div ref={anchorRef} className={className}>
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label="Choose month"
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 bg-transparent px-1 py-2 text-[0.75rem] font-bold text-[#07111f] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/15"
        >
          <Calendar className="size-3.5 shrink-0 text-[#1877f2]" aria-hidden />
          <span className="max-w-[10rem] truncate">{selectedLabel}</span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.24, ease: automationEase }}
            className="shrink-0 text-slate-400"
          >
            <ChevronDown className="size-3.5" aria-hidden />
          </motion.span>
        </button>
      ) : (
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
      )}

      {mounted
        ? createPortal(
            <AnimatePresence>{menu}</AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}
