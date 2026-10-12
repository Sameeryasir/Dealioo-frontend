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
    <>
      <div className="inline-flex rounded-full border border-[#e8edf5] bg-white p-0.5 shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
        <button
          type="button"
          onClick={() => onCalendarModeChange("month")}
          className={`cursor-pointer rounded-full px-3 py-1 text-[0.72rem] font-bold ${
            calendarMode === "month"
              ? "bg-[#1877f2] text-white"
              : "text-slate-600"
          }`}
        >
          Month
        </button>
        <button
          type="button"
          onClick={() => onCalendarModeChange("day")}
          className={`cursor-pointer rounded-full px-3 py-1 text-[0.72rem] font-bold ${
            calendarMode === "day"
              ? "bg-[#1877f2] text-white"
              : "text-slate-600"
          }`}
        >
          Day
        </button>
      </div>
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
    </>
  );
}
