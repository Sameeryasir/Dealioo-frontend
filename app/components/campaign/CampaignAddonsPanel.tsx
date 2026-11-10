"use client";

import { ActivityMonthCalendarPicker } from "@/app/components/business/ActivityMonthCalendarPicker";
import { CampaignAddonsOverviewSection } from "@/app/components/campaign/overview/CampaignAddonsOverviewSection";
import {
  activityCalendarYearMonthCount,
  currentActivityDateKey,
  currentActivityMonthKey,
  formatActivityMonthLabel,
  getActivityMonthRangeForKey,
  resolveActivityDateRange,
} from "@/app/lib/activity-month-filter";
import { Package } from "lucide-react";
import { useMemo, useState } from "react";

type CampaignAddonsPanelProps = {
  businessId: number;
  campaignId: number;
  embedded?: boolean;
};

export function CampaignAddonsPanel({
  businessId,
  campaignId,
  embedded = false,
}: CampaignAddonsPanelProps) {
  const [monthFilter, setMonthFilter] = useState(currentActivityMonthKey);
  const dashboardMonthCount = useMemo(
    () => activityCalendarYearMonthCount(),
    [],
  );

  const periodRange = useMemo(
    () =>
      getActivityMonthRangeForKey(monthFilter, dashboardMonthCount) ??
      resolveActivityDateRange(currentActivityDateKey(), dashboardMonthCount),
    [dashboardMonthCount, monthFilter],
  );

  const periodLabel = formatActivityMonthLabel(monthFilter);

  const shellClass = embedded
    ? "campaign-immersive-panel funnel-overview-root relative flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden"
    : "rd-premium flex min-h-0 w-full flex-1 flex-col";

  return (
    <section className={shellClass} aria-label="Campaign add-ons">
      <div className="funnel-overview-scroll">
        <div className="funnel-overview-performance-band sticky top-0 z-10 shrink-0 border-b border-[#e8edf5]/50 bg-transparent backdrop-blur-md supports-[backdrop-filter]:bg-white/15">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f2ff] text-[#1877f2]">
              <Package className="size-5" strokeWidth={2.25} aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="m-0 text-[1.05rem] font-extrabold tracking-tight text-[#07111f] sm:text-[1.15rem]">
                Add-ons
              </h2>
              <p className="m-0 mt-0.5 truncate text-[0.78rem] font-medium text-slate-500 sm:text-[0.8rem]">
                What guests bought with this deal in {periodLabel}.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#e8edf5]/90 bg-white/90 p-1.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.02]">
            <ActivityMonthCalendarPicker
              value={monthFilter}
              onChange={setMonthFilter}
              compact
              showAllMonths={false}
              monthCount={dashboardMonthCount}
            />
          </div>
        </div>

        <div className="funnel-overview-body flex min-h-0 flex-1 flex-col">
          <CampaignAddonsOverviewSection
            businessId={businessId}
            campaignId={campaignId}
            from={periodRange.from}
            to={periodRange.to}
            periodLabel={periodLabel}
            monthFilter={monthFilter}
          />
        </div>
      </div>
    </section>
  );
}
