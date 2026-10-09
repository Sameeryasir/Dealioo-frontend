"use client";

import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAnchoredMenu } from "@/app/hooks/use-anchored-menu";
import {
  ADS_PERIOD_PRESETS,
  buildAdsMonthKey,
  formatAdsInsightsPeriodLabel,
  parseAdsMonthPeriod,
} from "@/app/lib/ads-insights-period";

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function currentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function AdsDatePeriodPicker({
  value,
  onChange,
  disabled = false,
  loading = false,
}: {
  value: string;
  onChange: (period: string) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const label = formatAdsInsightsPeriodLabel(value);
  const selectedMonth = useMemo(() => {
    const custom = parseAdsMonthPeriod(value);
    if (custom) return custom;
    const { year, month } = currentYearMonth();
    if (value === "this_month") return { year, month, key: buildAdsMonthKey(year, month) };
    if (value === "last_month") {
      const last = new Date(year, month - 2, 1);
      const lastYear = last.getFullYear();
      const lastMonth = last.getMonth() + 1;
      return {
        year: lastYear,
        month: lastMonth,
        key: buildAdsMonthKey(lastYear, lastMonth),
      };
    }
    return null;
  }, [value]);
  const [viewYear, setViewYear] = useState(
    () => selectedMonth?.year ?? currentYearMonth().year,
  );

  const {
    open,
    setOpen,
    mounted,
    anchorRef,
    menuRef,
    menuPosition,
    menuStyle,
  } = useAnchoredMenu({
    width: 360,
    align: "left",
    estimatedHeight: 420,
    placement: "flip",
  });

  useEffect(() => {
    if (open) {
      setViewYear(selectedMonth?.year ?? currentYearMonth().year);
    }
  }, [open, selectedMonth?.year]);

  const { minYear, maxYear } = useMemo(() => {
    const { year } = currentYearMonth();
    return { minYear: year - 10, maxYear: year };
  }, []);

  const selectPeriod = (period: string) => {
    onChange(period);
    setOpen(false);
  };

  const selectMonth = (month: number) => {
    const { year: cy, month: cm } = currentYearMonth();
    if (viewYear > cy || (viewYear === cy && month > cm)) return;
    if (viewYear === cy && month === cm) {
      selectPeriod("this_month");
      return;
    }
    const lastMonthDate = new Date(cy, cm - 2, 1);
    if (
      viewYear === lastMonthDate.getFullYear() &&
      month === lastMonthDate.getMonth() + 1
    ) {
      selectPeriod("last_month");
      return;
    }
    selectPeriod(buildAdsMonthKey(viewYear, month));
  };

  return (
    <div ref={anchorRef} className="relative inline-flex">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-xl border border-[#EEF2F7] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#07111f] shadow-sm transition hover:bg-[#f4f8ff] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin text-[#1877f2]" aria-hidden />
        ) : (
          <Calendar className="size-4 text-[#1877f2]" aria-hidden />
        )}
        <span className="max-w-[12rem] truncate sm:max-w-[16rem]">{label}</span>
        <ChevronDown
          className={`size-4 text-slate-400 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {mounted && open && menuPosition
        ? createPortal(
            <div
              ref={menuRef}
              role="dialog"
              aria-label="Ads date range"
              style={menuStyle}
              className="z-[80] overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-xl shadow-slate-900/10"
            >
              <div className="border-b border-[#eef2f7] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date range
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[#07111f]">
                  {label}
                </p>
              </div>

              <div className="grid gap-0 sm:grid-cols-[11rem_minmax(0,1fr)]">
                <div className="border-b border-[#eef2f7] p-2 sm:border-b-0 sm:border-r">
                  <ul className="space-y-0.5">
                    {ADS_PERIOD_PRESETS.map((preset) => {
                      const active = value === preset.value;
                      return (
                        <li key={preset.value}>
                          <button
                            type="button"
                            onClick={() => selectPeriod(preset.value)}
                            className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                              active
                                ? "bg-[#e8f1ff] text-[#1877f2]"
                                : "text-slate-700 hover:bg-[#f8fafc]"
                            }`}
                          >
                            <span>{preset.label}</span>
                            {active ? (
                              <Check className="size-3.5 shrink-0" aria-hidden />
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setViewYear((y) => Math.max(minYear, y - 1))}
                      disabled={viewYear <= minYear}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-[#eef2f7] text-slate-600 transition hover:bg-[#f8fafc] disabled:opacity-40"
                      aria-label="Previous year"
                    >
                      <ChevronLeft className="size-4" aria-hidden />
                    </button>
                    <p className="text-sm font-semibold text-[#07111f]">{viewYear}</p>
                    <button
                      type="button"
                      onClick={() => setViewYear((y) => Math.min(maxYear, y + 1))}
                      disabled={viewYear >= maxYear}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-[#eef2f7] text-slate-600 transition hover:bg-[#f8fafc] disabled:opacity-40"
                      aria-label="Next year"
                    >
                      <ChevronRight className="size-4" aria-hidden />
                    </button>
                  </div>

                  <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                    Custom month
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {MONTH_SHORT.map((name, index) => {
                      const month = index + 1;
                      const { year: cy, month: cm } = currentYearMonth();
                      const disabledMonth =
                        viewYear > cy || (viewYear === cy && month > cm);
                      const active =
                        selectedMonth?.year === viewYear &&
                        selectedMonth?.month === month;
                      return (
                        <button
                          key={name}
                          type="button"
                          disabled={disabledMonth}
                          onClick={() => selectMonth(month)}
                          className={`rounded-lg px-2 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${
                            active
                              ? "bg-[#1877f2] text-white"
                              : "bg-[#f8fafc] text-slate-700 hover:bg-[#e8f1ff] hover:text-[#1877f2]"
                          }`}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export { AdsDatePeriodPicker as MetaAdsDatePeriodPicker };
export { ADS_PERIOD_PRESETS as META_ADS_PERIOD_PRESETS };
