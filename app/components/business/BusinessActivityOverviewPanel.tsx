"use client";

import { ActivityMonthCalendarPicker } from "@/app/components/business/ActivityMonthCalendarPicker";
import { PerformanceDateCalendar } from "@/app/components/business/PerformanceDateCalendar";
import {
  buildCheckInsMonthlyData,
  buildMembersMonthlyData,
  buildOrdersMonthlyData,
  buildRevenueMonthlyData,
  sumActivityFromMonthly,
} from "@/app/components/business/business-activity-chart-config";
import { BusinessMembersMiniChart } from "@/app/components/business/BusinessMembersMiniChart";
import { BusinessMonthlyBarChart } from "@/app/components/business/BusinessMonthlyBarChart";
import { BusinessRevenueMiniChart } from "@/app/components/business/BusinessRevenueMiniChart";
import { CheckInsBarChart } from "@/app/components/business/CheckInsBarChart";
import { Skeleton } from "@/app/components/skeleton";
import { OVERVIEW_CHART_COLORS } from "@/app/components/campaign/overview/charts/overview-chart-config";
import { DASHBOARD_KPI_ICON } from "@/app/lib/dashboard-brand-tones";
import {
  activityCalendarYearMonthCount,
  buildActivityMonthKey,
  currentActivityDateKey,
  formatActivityDateLabel,
  formatActivityMonthLabel,
  getActivityMonthRangeForKey,
  resolveActivityDateRange,
} from "@/app/lib/activity-month-filter";
import { formatCents } from "@/app/lib/money";
import { useCountUp } from "@/app/hooks/use-count-up";
import { getRestaurantActivityMonthly } from "@/app/services/activity/get-business-activity";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  Megaphone,
  ScanLine,
  ShoppingBag,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";

const overviewCardClass =
  "relative overflow-hidden rounded-[1.45rem] border border-[#e8edf5] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.07)] ring-1 ring-black/[0.02]";

function OverviewKpiTile({
  label,
  value,
  hint,
  icon: Icon,
  iconBg,
  hoverTone = "blue",
  format = "number",
}: {
  label: string;
  value: number;
  hint?: string;
  icon: LucideIcon;
  iconBg: string;
  hoverTone?: "blue" | "pink" | "green" | "orange";
  format?: "number" | "money";
}) {
  const animated = useCountUp(value, true);
  const display =
    format === "money"
      ? formatCents(Math.round(animated), "usd")
      : String(Math.round(animated));
  const finalLabel =
    format === "money" ? formatCents(Math.round(value), "usd") : String(value);

  const hoverBorder =
    hoverTone === "pink"
      ? "hover:border-[#e1306c]/45 hover:shadow-[0_14px_32px_rgba(225,48,108,0.14)]"
      : hoverTone === "green"
        ? "hover:border-[#34a853]/45 hover:shadow-[0_14px_32px_rgba(52,168,83,0.14)]"
        : hoverTone === "orange"
          ? "hover:border-[#f77737]/45 hover:shadow-[0_14px_32px_rgba(247,119,55,0.14)]"
          : "hover:border-[#1877f2]/45 hover:shadow-[0_14px_32px_rgba(24,119,242,0.14)]";

  const hoverText =
    hoverTone === "pink"
      ? "group-hover:text-[#e1306c]"
      : hoverTone === "green"
        ? "group-hover:text-[#34a853]"
        : hoverTone === "orange"
          ? "group-hover:text-[#f77737]"
          : "group-hover:text-[#1877f2]";

  return (
    <div
      className={`group flex items-center gap-3 rounded-[1.1rem] border border-[#e8edf5] bg-white px-3.5 py-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.03)] ring-1 ring-black/[0.02] transition duration-200 hover:-translate-y-[2px] ${hoverBorder}`}
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
      >
        <Icon className="size-4" strokeWidth={2.25} aria-hidden />
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p
          className={`m-0 truncate text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-600 transition ${hoverText}`}
        >
          {label}
        </p>
        <p
          className={`m-0 mt-0.5 truncate text-[1.15rem] font-extrabold leading-none tracking-tight text-black transition sm:text-[1.2rem] tabular-nums ${hoverText}`}
          aria-label={`${label}: ${finalLabel}`}
        >
          {display}
        </p>
        {hint ? (
          <p className="m-0 mt-1 truncate text-[0.72rem] font-medium text-slate-500">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading activity">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-[1.1rem] border border-[#e8edf5] bg-white px-3.5 py-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.03)]"
          >
            <Skeleton funnel className="size-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <Skeleton funnel className="h-3 w-16" />
              <Skeleton funnel className="mt-2 h-7 w-20" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[280px] rounded-[1.15rem] border border-[#e8edf5] bg-white px-4 py-4 shadow-[0_6px_18px_rgba(15,23,42,0.03)] sm:px-5 sm:py-5"
          >
            <Skeleton funnel className="h-4 w-36" />
            <Skeleton funnel className="mt-2 h-3 w-28" />
            <Skeleton funnel className="mt-6 h-[200px] w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BusinessActivityOverviewPanel({
  businessId,
}: {
  businessId?: number | null;
  businessName?: string;
}) {
  const [calendarMode, setCalendarMode] = useState<"month" | "day">("month");
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date();
    return buildActivityMonthKey(now.getUTCFullYear(), now.getUTCMonth() + 1);
  });
  const [dateFilter, setDateFilter] = useState(currentActivityDateKey);
  const dashboardMonthCount = useMemo(() => activityCalendarYearMonthCount(), []);
  const periodRange = useMemo(() => {
    if (calendarMode === "day") {
      return resolveActivityDateRange(dateFilter, dashboardMonthCount);
    }
    return (
      getActivityMonthRangeForKey(monthFilter, dashboardMonthCount) ??
      resolveActivityDateRange(currentActivityDateKey(), dashboardMonthCount)
    );
  }, [calendarMode, dashboardMonthCount, dateFilter, monthFilter]);
  const periodQuery = useQuery({
    queryKey: [
      "business-dashboard-activity",
      businessId,
      periodRange.from,
      periodRange.to,
    ],
    enabled: businessId != null && businessId > 0,
    staleTime: 30_000,
    queryFn: () =>
      getRestaurantActivityMonthly(businessId!, {
        from: periodRange.from,
        to: periodRange.to,
      }),
  });
  const periodLabel =
    calendarMode === "day"
      ? formatActivityDateLabel(dateFilter)
      : formatActivityMonthLabel(monthFilter);
  const visibleData = useMemo(
    () => periodQuery.data?.data ?? [],
    [periodQuery.data?.data],
  );
  const displayActiveCampaigns = periodQuery.data?.activeCampaigns ?? 0;
  const periodPaidCents = visibleData.reduce(
    (sum, row) => sum + (row.paidRevenueCents ?? 0),
    0,
  );
  const isQuietBusiness =
    !periodQuery.isPending &&
    displayActiveCampaigns === 0 &&
    (periodQuery.data?.totalOrders ?? 0) === 0 &&
    (periodQuery.data?.totalMembers ?? 0) === 0;
  const visibleTotals = useMemo(
    () => sumActivityFromMonthly(visibleData),
    [visibleData],
  );
  const visibleCheckIns = useMemo(
    () => buildCheckInsMonthlyData(visibleData),
    [visibleData],
  );
  const visibleRevenue = useMemo(
    () => buildRevenueMonthlyData(visibleData),
    [visibleData],
  );
  const visibleOrders = useMemo(
    () => buildOrdersMonthlyData(visibleData),
    [visibleData],
  );
  const visibleMembers = useMemo(
    () => buildMembersMonthlyData(visibleData),
    [visibleData],
  );
  const visibleNewMembers = useMemo(
    () => visibleMembers.reduce((sum, row) => sum + row.value, 0),
    [visibleMembers],
  );
  const periodOrders = visibleData.reduce(
    (sum, row) => sum + (row.orders ?? 0),
    0,
  );
  const periodMembers = visibleData.reduce(
    (sum, row) => sum + (row.members ?? 0),
    0,
  );
  const periodLoading = periodQuery.isPending;

  return (
    <article className={`${overviewCardClass} w-full`} aria-label="Business activity">
      <span
        className="pointer-events-none absolute -top-10 right-8 size-32 rounded-full bg-[#1877f2]/10 blur-3xl"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-8 left-6 size-24 rounded-full bg-[#e1306c]/8 blur-3xl"
        aria-hidden
      />

      <div className="relative shrink-0 border-b border-[#e8edf5] bg-white px-3 py-3.5 sm:px-4 sm:py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="inline-flex w-fit items-center rounded-full bg-[#1877f2]/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#1877f2] ring-1 ring-[#1877f2]/15">
              Business performance
            </span>
            <p className="m-0 mt-1.5 text-[0.8rem] font-medium text-slate-500">
              Campaigns, orders, members and revenue at a glance.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="inline-flex rounded-full border border-[#e8edf5] bg-white p-0.5 shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
              <button
                type="button"
                onClick={() => setCalendarMode("month")}
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
                onClick={() => setCalendarMode("day")}
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
                onChange={setMonthFilter}
                compact
                showAllMonths={false}
                monthCount={dashboardMonthCount}
              />
            ) : (
              <PerformanceDateCalendar
                value={dateFilter}
                onChange={setDateFilter}
                monthCount={dashboardMonthCount}
              />
            )}
          </div>
        </div>
      </div>

      {periodLoading ? (
        <div className="px-2.5 py-4 sm:px-3 sm:py-5">
          <OverviewSkeleton />
        </div>
      ) : (
        <div className="px-3 py-4 sm:px-4 sm:py-5">
          <div className="space-y-5">
            <section
              className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-5"
              aria-label="Business summary"
            >
              <OverviewKpiTile
                label="Active campaigns"
                value={displayActiveCampaigns}
                hint={isQuietBusiness ? "Publish your first deal" : "Published"}
                icon={Megaphone}
                iconBg={DASHBOARD_KPI_ICON.green}
                hoverTone="green"
              />
              <OverviewKpiTile
                label="Total orders"
                value={periodOrders}
                hint={periodLabel}
                icon={ShoppingBag}
                iconBg={DASHBOARD_KPI_ICON.orange}
                hoverTone="orange"
              />
              <OverviewKpiTile
                label="Total members"
                value={periodMembers}
                hint={periodLabel}
                icon={Users}
                iconBg={DASHBOARD_KPI_ICON.pink}
                hoverTone="pink"
              />
              <OverviewKpiTile
                label="QR check-ins"
                value={visibleTotals.checkIns}
                hint="Visits and redemptions"
                icon={ScanLine}
                iconBg={DASHBOARD_KPI_ICON.blue}
                hoverTone="blue"
              />
              <OverviewKpiTile
                label={calendarMode === "day" ? "Day's revenue" : "Month's revenue"}
                value={periodPaidCents}
                hint={periodLabel}
                icon={DollarSign}
                iconBg={calendarMode === "day" ? DASHBOARD_KPI_ICON.orange : DASHBOARD_KPI_ICON.pink}
                hoverTone={calendarMode === "day" ? "orange" : "pink"}
                format="money"
              />
            </section>

            <section className="rd-premium-section" aria-label="Performance charts">
              <div className="mb-1 px-0.5">
                <h2 className="m-0 text-[1.05rem] font-extrabold tracking-tight text-[#07111f]">
                  Performance insights
                </h2>
                <p className="m-0 mt-1 text-[0.78rem] font-medium text-slate-500">
                  {isQuietBusiness
                    ? "Charts stay flat until guests engage — then trends show up here."
                    : calendarMode === "day"
                      ? `Activity on ${periodLabel}.`
                      : `Activity in ${periodLabel}.`}
                </p>
              </div>
              <div className="grid gap-3 sm:gap-3.5 lg:grid-cols-2">
                <div className="min-h-[300px]">
                  <CheckInsBarChart data={visibleCheckIns} caption={periodLabel} />
                </div>
                <div className="min-h-[300px]">
                  <BusinessRevenueMiniChart
                    data={visibleRevenue}
                    totalRevenueCents={periodPaidCents}
                    months={1}
                    caption={periodLabel}
                  />
                </div>
                <div className="min-h-[300px]">
                  <BusinessMonthlyBarChart
                    title="Orders"
                    subtitle="Paid payments"
                    data={visibleOrders}
                    dataKey="value"
                    seriesName="Orders"
                    accent="orange"
                    barFill={OVERVIEW_CHART_COLORS.orange}
                    legendColor={OVERVIEW_CHART_COLORS.orange}
                    caption={periodLabel}
                  />
                </div>
                <div className="min-h-[300px]">
                  <BusinessMembersMiniChart
                    data={visibleMembers}
                    total={visibleNewMembers}
                    months={1}
                    caption={periodLabel}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </article>
  );
}
