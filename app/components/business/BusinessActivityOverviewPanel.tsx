"use client";

import { ActivityMonthCalendarPicker } from "@/app/components/business/ActivityMonthCalendarPicker";
import { PerformanceDateCalendar } from "@/app/components/business/PerformanceDateCalendar";
import {
  buildCheckInsMonthlyData,
  buildMembersMonthlyData,
  buildOrdersMonthlyData,
  buildRevenueMonthlyData,
  findPeakCheckInsDay,
  findPeakMonthInYear,
  findPeakRevenueDay,
  sumActivityFromMonthly,
  resolvePeriodRevenueCents,
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
  currentActivityDateKey,
  currentActivityMonthKey,
  formatActivityDateLabel,
  formatActivityMonthLabel,
  getActivityMonthRangeForKey,
  resolveActivityDateRange,
  resolveActivityPreviousComparisonRange,
} from "@/app/lib/activity-month-filter";
import { formatCents } from "@/app/lib/money";
import { getUserTimeZone } from "@/app/lib/datetime";
import { useCountUp } from "@/app/hooks/use-count-up";
import { getRestaurantActivityMonthly } from "@/app/services/activity/get-business-activity";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Megaphone,
  ScanLine,
  ShoppingBag,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

function percentChange(
  current: number,
  previous: number | null | undefined,
): number | null {
  if (previous == null) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

const overviewCardClass =
  "relative overflow-hidden rounded-[1.45rem] border border-[#e8edf5] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.07)] ring-1 ring-black/[0.02]";

function OverviewKpiChange({
  changePercent,
  comparisonLabel,
  periodInProgress,
  currentValue,
  previousValue,
}: {
  changePercent: number | null;
  comparisonLabel: string;
  periodInProgress: boolean;
  currentValue: number;
  previousValue: number | null | undefined;
}) {
  if (changePercent == null && previousValue === 0 && currentValue > 0) {
    return (
      <p className="m-0 mt-1 truncate text-[0.72rem] font-medium text-[#34a853]">
        <span className="font-semibold">New</span> vs. {comparisonLabel}
      </p>
    );
  }

  if (changePercent == null) {
    return (
      <p className="m-0 mt-1 truncate text-[0.72rem] font-medium text-slate-400">
        No prior period to compare
      </p>
    );
  }

  if (changePercent === 0) {
    return (
      <p className="m-0 mt-1 truncate text-[0.72rem] font-medium text-slate-500">
        <span className="font-semibold tabular-nums text-slate-600">0%</span>{" "}
        flat vs. {comparisonLabel}
      </p>
    );
  }

  const improving = changePercent > 0;
  const Icon = improving ? ArrowUpRight : ArrowDownRight;
  const tone = improving ? "text-[#34a853]" : "text-[#e1306c]";
  const healthLabel = periodInProgress
    ? improving
      ? "Ahead so far"
      : "Behind so far"
    : improving
      ? "Up"
      : "Down";

  return (
    <p
      className={`m-0 mt-1 flex min-w-0 items-center gap-1 truncate text-[0.72rem] font-medium ${tone}`}
      title={`${Math.abs(changePercent)}% vs. ${comparisonLabel} · ${healthLabel}`}
    >
      <Icon className="size-3 shrink-0" strokeWidth={2.5} aria-hidden />
      <span className="tabular-nums font-semibold">
        {Math.abs(changePercent)}%
      </span>
      <span className="truncate text-slate-500">
        vs. {comparisonLabel}
        <span className={`font-semibold ${tone}`}> · {healthLabel}</span>
      </span>
    </p>
  );
}

function OverviewKpiBreakdown({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  if (items.length === 0) return null;
  return (
    <p className="m-0 mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[0.68rem] font-medium leading-tight text-slate-500">
      {items.map((item, index) => (
        <span key={item.label} className="inline-flex min-w-0 items-center gap-1">
          {index > 0 ? (
            <span className="text-slate-300" aria-hidden>
              ·
            </span>
          ) : null}
          <span className="truncate">
            {item.label}{" "}
            <span className="font-semibold tabular-nums text-slate-700">
              {item.value}
            </span>
          </span>
        </span>
      ))}
    </p>
  );
}

function OverviewKpiTile({
  label,
  value,
  hint,
  icon: Icon,
  iconBg,
  hoverTone = "blue",
  format = "number",
  changePercent,
  comparisonLabel,
  periodInProgress = false,
  previousValue,
  showComparison = false,
  breakdown,
  footer,
}: {
  label: string;
  value: number;
  hint?: string;
  icon: LucideIcon;
  iconBg: string;
  hoverTone?: "blue" | "pink" | "green" | "orange";
  format?: "number" | "money";
  changePercent?: number | null;
  comparisonLabel?: string;
  periodInProgress?: boolean;
  previousValue?: number | null;
  showComparison?: boolean;
  breakdown?: Array<{ label: string; value: string }>;
  footer?: ReactNode;
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
        {breakdown ? <OverviewKpiBreakdown items={breakdown} /> : null}
        {showComparison && comparisonLabel ? (
          <OverviewKpiChange
            changePercent={changePercent ?? null}
            comparisonLabel={comparisonLabel}
            periodInProgress={periodInProgress}
            currentValue={value}
            previousValue={previousValue}
          />
        ) : !breakdown && hint ? (
          <p className="m-0 mt-1 truncate text-[0.72rem] font-medium text-slate-500">
            {hint}
          </p>
        ) : null}
        {footer}
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading activity">
      <section
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3"
        aria-label="Business summary"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-[1.1rem] border border-[#e8edf5] bg-white px-3.5 py-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.03)] ring-1 ring-black/[0.02]"
          >
            <Skeleton funnel className="size-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 text-left">
              <Skeleton funnel className="h-3 w-16" />
              <Skeleton funnel className="mt-0.5 h-5 w-20 sm:h-6" />
              <Skeleton funnel className="mt-1 h-3 w-24" />
            </div>
          </div>
        ))}
      </section>

      <section className="rd-premium-section" aria-label="Performance charts">
        <div className="mb-1 px-0.5">
          <Skeleton funnel className="h-5 w-44 rounded-md" />
          <Skeleton funnel className="mt-1 h-3 w-64 max-w-full rounded-md" />
        </div>
        <div className="grid gap-3 sm:gap-3.5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-h-[300px]">
              <div className="relative flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-[1.2rem] border border-[#e8edf5] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]">
                <span
                  className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[#1877f2]/25"
                  aria-hidden
                />
                <div className="relative shrink-0 px-4 pb-2 pt-4 sm:px-5 sm:pt-5">
                  <Skeleton funnel className="h-4 w-28 rounded-md sm:w-32" />
                  <Skeleton funnel className="mt-0.5 h-3 w-36 rounded-md" />
                </div>
                <div className="relative mx-3 mb-3 flex min-h-[300px] flex-1 flex-col rounded-[1rem] bg-white px-2 py-2 ring-1 ring-[#e8edf5]/80 sm:mx-4 sm:mb-4 sm:px-3 sm:py-3">
                  <div className="h-[250px] w-full min-w-0">
                    <Skeleton funnel className="h-full w-full rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
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
  // Local calendar month so “today” matches the viewer’s timezone.
  const [monthFilter, setMonthFilter] = useState(currentActivityMonthKey);
  const [dateFilter, setDateFilter] = useState(currentActivityDateKey);
  const dashboardMonthCount = useMemo(() => activityCalendarYearMonthCount(), []);
  const viewerTimeZone = useMemo(() => getUserTimeZone(), []);
  const periodRange = useMemo(() => {
    if (calendarMode === "day") {
      return resolveActivityDateRange(dateFilter, dashboardMonthCount);
    }
    return (
      getActivityMonthRangeForKey(monthFilter, dashboardMonthCount) ??
      resolveActivityDateRange(currentActivityDateKey(), dashboardMonthCount)
    );
  }, [calendarMode, dashboardMonthCount, dateFilter, monthFilter]);

  const previousRange = useMemo(
    () =>
      resolveActivityPreviousComparisonRange(
        periodRange.from,
        periodRange.to,
      ),
    [periodRange.from, periodRange.to],
  );

  const periodQuery = useQuery({
    queryKey: [
      "business-dashboard-activity",
      businessId,
      periodRange.from,
      periodRange.to,
      previousRange?.from ?? null,
      previousRange?.to ?? null,
      viewerTimeZone,
    ],
    enabled: businessId != null && businessId > 0,
    staleTime: 30_000,
    queryFn: () =>
      getRestaurantActivityMonthly(businessId!, {
        from: periodRange.from,
        to: periodRange.to,
        previousFrom: previousRange?.from,
        previousTo: previousRange?.to,
        timezone: viewerTimeZone,
      }),
  });

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const yearPeakQuery = useQuery({
    queryKey: ["business-dashboard-year-peak", businessId, currentYear],
    enabled: businessId != null && businessId > 0,
    staleTime: 60_000,
    queryFn: () =>
      getRestaurantActivityMonthly(businessId!, {
        months: 12,
      }),
  });
  const peakMonth = useMemo(
    () =>
      findPeakMonthInYear(yearPeakQuery.data?.data ?? [], currentYear),
    [currentYear, yearPeakQuery.data?.data],
  );

  const periodLabel =
    calendarMode === "day"
      ? formatActivityDateLabel(dateFilter)
      : formatActivityMonthLabel(monthFilter);
  const comparisonLabel =
    calendarMode === "day" ? "same day last month" : "previous month";
  const periodInProgress =
    calendarMode === "month" && monthFilter === currentActivityMonthKey();

  const visibleData = useMemo(
    () => periodQuery.data?.data ?? [],
    [periodQuery.data?.data],
  );
  const previousData = useMemo(
    () => periodQuery.data?.previous?.data ?? [],
    [periodQuery.data?.previous?.data],
  );
  const displayActiveCampaigns = periodQuery.data?.activeCampaigns ?? 0;
  const periodRevenueCents = visibleData.reduce(
    (sum, row) => sum + resolvePeriodRevenueCents(row),
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
  const previousTotals = useMemo(
    () => sumActivityFromMonthly(previousData),
    [previousData],
  );
  const visibleCheckIns = useMemo(
    () => buildCheckInsMonthlyData(visibleData),
    [visibleData],
  );
  const visibleRevenue = useMemo(
    () => buildRevenueMonthlyData(visibleData),
    [visibleData],
  );
  // Month view is day-bucketed; day view is hourly — only label a peak day in month mode.
  const peakCheckInsDay = useMemo(
    () =>
      calendarMode === "month"
        ? findPeakCheckInsDay(visibleCheckIns)
        : null,
    [calendarMode, visibleCheckIns],
  );
  const peakRevenueDay = useMemo(
    () =>
      calendarMode === "month"
        ? findPeakRevenueDay(visibleRevenue)
        : null,
    [calendarMode, visibleRevenue],
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
  const previousOrders = previousData.reduce(
    (sum, row) => sum + (row.orders ?? 0),
    0,
  );
  const previousMembers = previousData.reduce(
    (sum, row) => sum + (row.members ?? 0),
    0,
  );
  const previousRevenueCents = previousTotals.revenueCents;
  const previousCheckIns = previousTotals.checkIns;
  const newGuests = periodQuery.data?.newGuests ?? 0;
  const returningGuests = periodQuery.data?.returningGuests ?? 0;
  const activeGuests = newGuests + returningGuests;
  // Repeat rate = returning / active only — never divide by check-ins or members.
  const repeatRatePercent =
    activeGuests > 0
      ? Math.round((returningGuests / activeGuests) * 100)
      : null;
  const payingGuests = periodQuery.data?.payingGuests ?? 0;
  // Avg spend uses paying guests only so free check-ins do not understate spend.
  const avgSpendCents =
    payingGuests > 0 ? Math.round(periodRevenueCents / payingGuests) : null;
  const previousNewGuests = periodQuery.data?.previous?.newGuests ?? 0;
  const previousReturningGuests =
    periodQuery.data?.previous?.returningGuests ?? 0;
  const previousActiveGuests = previousNewGuests + previousReturningGuests;

  const showComparison =
    previousRange != null &&
    !periodQuery.isPending &&
    !periodQuery.isError &&
    Array.isArray(periodQuery.data?.previous?.data);

  const ordersChange = percentChange(periodOrders, previousOrders);
  const membersChange = percentChange(periodMembers, previousMembers);
  const checkInsChange = percentChange(
    visibleTotals.checkIns,
    previousCheckIns,
  );
  const revenueChange = percentChange(
    periodRevenueCents,
    previousRevenueCents,
  );
  const activeGuestsChange = percentChange(
    activeGuests,
    previousActiveGuests,
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

      <div className="space-y-5 px-3 py-4 sm:px-4 sm:py-5">
        {peakMonth ? (
          <aside
            className="flex items-center gap-3 px-0.5"
            aria-label={`Winner month ${peakMonth.label}`}
          >
            <span className="flex size-10 shrink-0 items-center justify-center text-[#1877f2]">
              <Trophy className="size-5" strokeWidth={2.25} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-500">
                Winner month · {currentYear}
              </p>
              <p className="m-0 mt-0.5 truncate text-[1.05rem] font-extrabold tracking-tight text-[#07111f]">
                {formatActivityMonthLabel(peakMonth.month)}
              </p>
              <p className="m-0 mt-0.5 truncate text-[0.75rem] font-medium text-slate-600">
                Peak of the year till now
                {peakMonth.revenueCents > 0 ? (
                  <>
                    {" · "}
                    <span className="font-bold tabular-nums text-slate-800">
                      {formatCents(peakMonth.revenueCents, "usd")}
                    </span>
                  </>
                ) : null}
                {peakMonth.checkIns > 0 ? (
                  <>
                    {" · "}
                    <span className="font-semibold tabular-nums text-slate-700">
                      {peakMonth.checkIns.toLocaleString()} check-ins
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          </aside>
        ) : null}

      {periodLoading ? (
          <OverviewSkeleton />
      ) : (
          <div className="space-y-5">
            <section
              className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3"
              aria-label="Business summary"
            >
              <OverviewKpiTile
                label="Campaigns"
                value={displayActiveCampaigns}
                hint={isQuietBusiness ? "Publish your first deal" : "Published"}
                icon={Megaphone}
                iconBg={DASHBOARD_KPI_ICON.green}
                hoverTone="green"
              />
              <OverviewKpiTile
                label="Orders"
                value={periodOrders}
                hint={periodLabel}
                icon={ShoppingBag}
                iconBg={DASHBOARD_KPI_ICON.orange}
                hoverTone="orange"
                showComparison={showComparison}
                changePercent={ordersChange}
                comparisonLabel={comparisonLabel}
                periodInProgress={periodInProgress}
                previousValue={previousOrders}
              />
              <OverviewKpiTile
                label="Members"
                value={periodMembers}
                hint={periodLabel}
                icon={Users}
                iconBg={DASHBOARD_KPI_ICON.pink}
                hoverTone="pink"
                showComparison={showComparison}
                changePercent={membersChange}
                comparisonLabel={comparisonLabel}
                periodInProgress={periodInProgress}
                previousValue={previousMembers}
                breakdown={[
                  {
                    label: "Offer",
                    value: String(visibleTotals.funnelMembers),
                  },
                  {
                    label: "Store",
                    value: String(visibleTotals.restaurantMembers),
                  },
                ]}
              />
              <OverviewKpiTile
                label="Guests"
                value={activeGuests}
                hint="Unique guests in this period"
                icon={UserRound}
                iconBg={DASHBOARD_KPI_ICON.green}
                hoverTone="green"
                showComparison={showComparison}
                changePercent={activeGuestsChange}
                comparisonLabel={comparisonLabel}
                periodInProgress={periodInProgress}
                previousValue={previousActiveGuests}
                breakdown={[
                  {
                    label: "New",
                    value: String(newGuests),
                  },
                  {
                    label: "Return",
                    value: String(returningGuests),
                  },
                  {
                    label: "Repeat",
                    value:
                      repeatRatePercent == null
                        ? "—"
                        : `${repeatRatePercent}%`,
                  },
                ]}
              />
              <OverviewKpiTile
                label="Check-ins"
                value={visibleTotals.checkIns}
                hint="Visits and redemptions"
                icon={ScanLine}
                iconBg={DASHBOARD_KPI_ICON.blue}
                hoverTone="blue"
                showComparison={showComparison}
                changePercent={checkInsChange}
                comparisonLabel={comparisonLabel}
                periodInProgress={periodInProgress}
                previousValue={previousCheckIns}
                breakdown={[
                  {
                    label: "QR",
                    value: String(visibleTotals.scannedCheckIns),
                  },
                  {
                    label: "Store",
                    value: String(visibleTotals.inStoreCheckIns),
                  },
                ]}
              />
              <OverviewKpiTile
                label="Revenue"
                value={periodRevenueCents}
                hint={periodLabel}
                icon={DollarSign}
                iconBg={calendarMode === "day" ? DASHBOARD_KPI_ICON.orange : DASHBOARD_KPI_ICON.pink}
                hoverTone={calendarMode === "day" ? "orange" : "pink"}
                format="money"
                showComparison={showComparison}
                changePercent={revenueChange}
                comparisonLabel={comparisonLabel}
                periodInProgress={periodInProgress}
                previousValue={previousRevenueCents}
                breakdown={[
                  {
                    label: "Offer",
                    value: formatCents(visibleTotals.offerSalesCents, "usd"),
                  },
                  {
                    label: "Extras",
                    value: formatCents(
                      visibleTotals.extraItemsRevenueCents,
                      "usd",
                    ),
                  },
                  {
                    label: "Avg",
                    value:
                      avgSpendCents == null
                        ? "—"
                        : formatCents(avgSpendCents, "usd"),
                  },
                ]}
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
                <div className="min-h-[300px]" key={`checkins-${periodLabel}`}>
                  <CheckInsBarChart
                    data={visibleCheckIns}
                    caption={periodLabel}
                    scannedCount={visibleTotals.scannedCheckIns}
                    inStoreCount={visibleTotals.inStoreCheckIns}
                    peakDayLabel={peakCheckInsDay?.label}
                    peakDayValue={peakCheckInsDay?.value}
                  />
                </div>
                <div className="min-h-[300px]" key={`revenue-${periodLabel}`}>
                  <BusinessRevenueMiniChart
                    data={visibleRevenue}
                    totalRevenueCents={periodRevenueCents}
                    offerSalesCents={visibleTotals.offerSalesCents}
                    extraItemsCents={visibleTotals.extraItemsRevenueCents}
                    months={1}
                    caption={periodLabel}
                    peakDayLabel={
                      calendarMode === "month"
                        ? peakRevenueDay?.label
                        : null
                    }
                    peakDayCents={
                      calendarMode === "month"
                        ? peakRevenueDay?.value
                        : null
                    }
                  />
                </div>
                <div className="min-h-[300px]" key={`orders-${periodLabel}`}>
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
                <div className="min-h-[300px]" key={`members-${periodLabel}`}>
                  <BusinessMembersMiniChart
                    data={visibleMembers}
                    total={visibleNewMembers}
                    funnelCount={visibleTotals.funnelMembers}
                    restaurantCount={visibleTotals.restaurantMembers}
                    months={1}
                    caption={periodLabel}
                  />
                </div>
              </div>
            </section>
          </div>
      )}
      </div>
    </article>
  );
}
