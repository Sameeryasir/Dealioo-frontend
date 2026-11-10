"use client";

import { ActivityMonthCalendarPicker } from "@/app/components/business/ActivityMonthCalendarPicker";
import { PerformanceDateCalendar } from "@/app/components/business/PerformanceDateCalendar";

export function OverviewPeriodFilter({
  calendarMode,
  onCalendarModeChange,
  monthFilter,
  onMonthFilterChange,
  dateFilter,
  onDateFilterChange,
  monthCount,
}: {
  calendarMode: "month" | "day";
  onCalendarModeChange: (mode: "month" | "day") => void;
  monthFilter: string;
  onMonthFilterChange: (month: string) => void;
  dateFilter: string;
  onDateFilterChange: (date: string) => void;
  monthCount: number;
}) {
  return (
    <div className="flex w-full min-w-0 items-center gap-1.5 rounded-xl border border-[#e8edf5]/90 bg-white/90 p-1 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.02] sm:w-auto sm:gap-2 sm:rounded-2xl sm:p-1.5">
      <div className="inline-flex shrink-0 rounded-lg bg-[#f4f7fb] p-0.5 sm:rounded-xl">
        <button
          type="button"
          onClick={() => onCalendarModeChange("month")}
          className={`cursor-pointer rounded-md px-2.5 py-1 text-[0.68rem] font-bold transition sm:rounded-[0.65rem] sm:px-3.5 sm:py-1.5 sm:text-[0.72rem] ${
            calendarMode === "month"
              ? "bg-[#1877f2] text-white shadow-[0_6px_14px_rgba(24,119,242,0.28)]"
              : "text-slate-600 hover:text-[#07111f]"
          }`}
        >
          Month
        </button>
        <button
          type="button"
          onClick={() => onCalendarModeChange("day")}
          className={`cursor-pointer rounded-md px-2.5 py-1 text-[0.68rem] font-bold transition sm:rounded-[0.65rem] sm:px-3.5 sm:py-1.5 sm:text-[0.72rem] ${
            calendarMode === "day"
              ? "bg-[#1877f2] text-white shadow-[0_6px_14px_rgba(24,119,242,0.28)]"
              : "text-slate-600 hover:text-[#07111f]"
          }`}
        >
          Day
        </button>
      </div>
      <span className="hidden h-6 w-px bg-[#e8edf5] sm:block" aria-hidden />
      <div className="min-w-0 flex-1 sm:w-auto sm:flex-none">
        {calendarMode === "month" ? (
          <ActivityMonthCalendarPicker
            value={monthFilter}
            onChange={onMonthFilterChange}
            compact
            showAllMonths={false}
            monthCount={monthCount}
          />
        ) : (
          <PerformanceDateCalendar
            value={dateFilter}
            onChange={onDateFilterChange}
            monthCount={monthCount}
          />
        )}
      </div>
    </div>
  );
}
