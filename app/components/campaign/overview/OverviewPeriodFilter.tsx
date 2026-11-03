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
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#e8edf5]/90 bg-white/90 p-1.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.02]">
      <div className="inline-flex rounded-xl bg-[#f4f7fb] p-0.5">
        <button
          type="button"
          onClick={() => onCalendarModeChange("month")}
          className={`cursor-pointer rounded-[0.65rem] px-3.5 py-1.5 text-[0.72rem] font-bold transition ${
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
          className={`cursor-pointer rounded-[0.65rem] px-3.5 py-1.5 text-[0.72rem] font-bold transition ${
            calendarMode === "day"
              ? "bg-[#1877f2] text-white shadow-[0_6px_14px_rgba(24,119,242,0.28)]"
              : "text-slate-600 hover:text-[#07111f]"
          }`}
        >
          Day
        </button>
      </div>
      <span className="hidden h-6 w-px bg-[#e8edf5] sm:block" aria-hidden />
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
  );
}
