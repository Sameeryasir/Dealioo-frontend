"use client";

import {
  ArrowRight,
  DollarSign,
  Eye,
  Layers,
  MousePointerClick,
  Plus,
  UserPlus,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ActivityMonthCalendarPicker } from "@/app/components/business/ActivityMonthCalendarPicker";
import { PerformanceDateCalendar } from "@/app/components/business/PerformanceDateCalendar";
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { AnalyticsMetricMiniChart } from "@/app/components/campaign/overview/charts/AnalyticsMetricMiniChart";
import { FunnelRevenueMiniChart } from "@/app/components/campaign/overview/charts/FunnelRevenueMiniChart";
import {
  buildAnalyticsMonthlySeries,
  buildRevenueMonthlySeries,
  buildSignupBreakdownFromMonthly,
  buildSignupsPaymentsMonthlyData,
  sumAnalyticsFromMonthly,
  sumStatsFromMonthly,
} from "@/app/components/campaign/overview/charts/overview-chart-config";
import { SignupBreakdownPieChart } from "@/app/components/campaign/overview/charts/SignupBreakdownPieChart";
import { SignupsPaymentsBarChart } from "@/app/components/campaign/overview/charts/SignupsPaymentsBarChart";
import { Skeleton } from "@/app/components/skeleton";
import {
  buildActivityMonthKey,
  currentActivityDateKey,
  formatActivityDateLabel,
  formatActivityMonthLabel,
  getActivityMonthRangeForKey,
  resolveActivityDateRange,
} from "@/app/lib/activity-month-filter";
import { DASHBOARD_KPI_ICON } from "@/app/lib/dashboard-brand-tones";
import { useCountUp } from "@/app/hooks/use-count-up";
import { formatCents } from "@/app/lib/money";
import { funnelPanelItem, funnelPanelStagger, standardEase } from "@/app/lib/motion";
import { OVERVIEW_CHART_COLORS } from "@/app/components/campaign/overview/charts/overview-chart-config";
import { getAnalyticsOverviewMonthly } from "@/app/services/funnel/get-analytics-overview-monthly";
import { getFunnelStatsMonthly } from "@/app/services/funnel/get-funnel-stats-monthly";
import { useQuery } from "@tanstack/react-query";

const overviewCardClass =
  "relative overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]";

function OverviewKpiTile({
  label,
  value,
  hint,
  icon: Icon,
  iconBg,
  hoverTone = "blue",
  format = "number",
  currency = "usd",
}: {
  label: string;
  value: number;
  hint?: string;
  icon: LucideIcon;
  iconBg: string;
  hoverTone?: "blue" | "pink" | "green" | "orange";
  format?: "number" | "money" | "percent";
  currency?: string;
}) {
  const animated = useCountUp(value, true);
  const display =
    format === "money"
      ? formatCents(Math.round(animated), currency)
      : format === "percent"
        ? `${animated.toFixed(1)}%`
        : String(Math.round(animated));
  const finalLabel =
    format === "money"
      ? formatCents(Math.round(value), currency)
      : format === "percent"
        ? `${value.toFixed(1)}%`
        : String(value);

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
      className={`funnel-overview-kpi-tile group flex items-center gap-3 rounded-[1.1rem] border border-[#e8edf5] bg-white px-3.5 py-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.03)] ring-1 ring-black/[0.02] transition duration-200 hover:-translate-y-[2px] ${hoverBorder}`}
    >
      <span
        className={`funnel-overview-kpi-tile__icon flex size-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
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
          className={`funnel-overview-kpi-tile__value m-0 mt-0.5 truncate text-[1.15rem] font-extrabold leading-none tracking-tight text-black transition sm:text-[1.2rem] tabular-nums ${hoverText}`}
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
    <div className="funnel-overview-content" aria-busy="true" aria-label="Loading stats">
      <div className="funnel-overview-kpi-grid funnel-overview-kpi-grid--three">
        {Array.from({ length: 6 }).map((_, i) => (
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

      <div className="funnel-overview-chart-grid">
        <div className="funnel-overview-chart-slot min-h-[280px] rounded-[1.15rem] border border-[#e8edf5] bg-white px-4 py-4 shadow-[0_6px_18px_rgba(15,23,42,0.03)] sm:px-5 sm:py-5">
          <Skeleton funnel className="h-4 w-36" />
          <Skeleton funnel className="mt-2 h-3 w-28" />
          <Skeleton funnel className="mt-6 h-[220px] w-full rounded-xl" />
        </div>
        <div className="funnel-overview-chart-slot min-h-[280px] rounded-[1.15rem] border border-[#e8edf5] bg-white px-4 py-4 shadow-[0_6px_18px_rgba(15,23,42,0.03)] sm:px-5 sm:py-5">
          <Skeleton funnel className="h-4 w-32" />
          <Skeleton funnel className="mt-2 h-3 w-40" />
          <Skeleton funnel className="mt-6 h-[220px] w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

function NoFunnelEmptyState({
  onCreateFunnel,
}: {
  onCreateFunnel?: () => void;
}) {
  return (
    <motion.div
      className="flex min-h-0 w-full flex-1 flex-col items-center justify-center px-6 py-14 text-center sm:py-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: standardEase }}
    >
      <div className="relative mb-5 flex size-28 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full bg-[#e8f2ff]/80 blur-xl"
          aria-hidden
        />
        <span className="relative flex size-24 items-center justify-center rounded-[1.75rem] border border-[#dbeafe] bg-gradient-to-br from-[#f4f8ff] to-white shadow-[0_12px_32px_rgba(24,119,242,0.12)]">
          <Layers className="size-10 text-[#1877f2]" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="absolute -right-1 -bottom-1 flex size-9 items-center justify-center rounded-full border-2 border-white bg-[#e1306c] text-white shadow-md">
          <Plus className="size-4" strokeWidth={2.5} aria-hidden />
        </span>
      </div>

      <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#1877f2]">
        Funnel not set up
      </p>
      <h3 className="m-0 mt-2 text-[1.05rem] font-extrabold tracking-tight text-[#07111f]">
        No activity on the funnel yet
      </h3>
      <p className="mx-auto m-0 mt-2 max-w-md text-[0.82rem] font-medium leading-relaxed text-slate-500">
        Create your funnel first to start capturing signups, payments, and live
        analytics for this campaign.
      </p>

      {onCreateFunnel ? (
        <button
          type="button"
          onClick={onCreateFunnel}
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#1877f2] px-5 py-2.5 text-[0.8rem] font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe0]"
        >
          Create funnel
          <ArrowRight className="size-4" aria-hidden />
        </button>
      ) : null}
    </motion.div>
  );
}

export function FunnelOverviewPanel({
  funnelId,
  isFunnelIdLoading = false,
  onCreateFunnel,
  embedded = false,
}: {
  campaignName?: string;
  price?: number | string;
  funnelId?: number | null;
  isFunnelIdLoading?: boolean;
  onCreateFunnel?: () => void;
  embedded?: boolean;
}) {
  const [calendarMode, setCalendarMode] = useState<"month" | "day">("month");
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date();
    return buildActivityMonthKey(now.getUTCFullYear(), now.getUTCMonth() + 1);
  });
  const [dateFilter, setDateFilter] = useState(currentActivityDateKey);
  const periodRange = useMemo(() => {
    if (calendarMode === "day") return resolveActivityDateRange(dateFilter);
    return (
      getActivityMonthRangeForKey(monthFilter) ??
      resolveActivityDateRange(currentActivityDateKey())
    );
  }, [calendarMode, dateFilter, monthFilter]);
  const periodLabel =
    calendarMode === "day"
      ? formatActivityDateLabel(dateFilter)
      : formatActivityMonthLabel(monthFilter);
  const statsQuery = useQuery({
    queryKey: [
      "funnel-stats-range",
      funnelId,
      periodRange.from,
      periodRange.to,
    ],
    enabled: funnelId != null && funnelId > 0,
    staleTime: 30_000,
    queryFn: () =>
      getFunnelStatsMonthly(funnelId!, {
        from: periodRange.from,
        to: periodRange.to,
      }),
  });
  const analyticsQuery = useQuery({
    queryKey: [
      "funnel-analytics-range",
      funnelId,
      periodRange.from,
      periodRange.to,
    ],
    enabled: funnelId != null && funnelId > 0,
    staleTime: 30_000,
    queryFn: () =>
      getAnalyticsOverviewMonthly(funnelId!, {
        from: periodRange.from,
        to: periodRange.to,
      }),
  });
  const statsMonthly = statsQuery.data;
  const analyticsMonthly = analyticsQuery.data;

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const showSkeleton =
    isFunnelIdLoading ||
    (funnelId != null && (statsQuery.isPending || analyticsQuery.isPending));
  const showNoFunnelMessage = !showSkeleton && funnelId == null;

  const statsPoints = useMemo(() => {
    if (showSkeleton || funnelId == null) {
      return null;
    }
    return statsMonthly?.data ?? [];
  }, [showSkeleton, funnelId, statsMonthly]);

  const analyticsPoints = useMemo(() => {
    if (showSkeleton || funnelId == null) {
      return null;
    }
    return analyticsMonthly?.data ?? [];
  }, [showSkeleton, funnelId, analyticsMonthly]);

  useEffect(() => {
    if (showSkeleton) return;

    const message = statsQuery.isError
      ? "Could not load funnel stats for this period."
      : analyticsQuery.isError
        ? "Could not load behavior analytics for this period."
        : null;
    if (message && !alertDismissed) {
      setAlertMessage(message);
    }
  }, [statsQuery.isError, analyticsQuery.isError, showSkeleton, alertDismissed]);

  useEffect(() => {
    setAlertDismissed(false);
    setAlertMessage(null);
  }, [funnelId]);

  const monthlyStatsTotals = useMemo(
    () => (statsPoints ? sumStatsFromMonthly(statsPoints) : null),
    [statsPoints],
  );

  const signupsPaymentsMonthly = useMemo(
    () =>
      statsPoints ? buildSignupsPaymentsMonthlyData(statsPoints) : [],
    [statsPoints],
  );

  const signupBreakdownMonthly = useMemo(
    () =>
      statsPoints ? buildSignupBreakdownFromMonthly(statsPoints) : [],
    [statsPoints],
  );

  const analyticsTotals = useMemo(
    () =>
      analyticsPoints ? sumAnalyticsFromMonthly(analyticsPoints) : null,
    [analyticsPoints],
  );

  const pageViewsMonthly = useMemo(
    () =>
      analyticsPoints
        ? buildAnalyticsMonthlySeries(analyticsPoints, "pageViews")
        : [],
    [analyticsPoints],
  );

  const buttonClicksMonthly = useMemo(
    () =>
      analyticsPoints
        ? buildAnalyticsMonthlySeries(analyticsPoints, "buttonClicks")
        : [],
    [analyticsPoints],
  );

  const uniqueVisitorsMonthly = useMemo(
    () =>
      analyticsPoints
        ? buildAnalyticsMonthlySeries(analyticsPoints, "uniqueVisitors")
        : [],
    [analyticsPoints],
  );

  const revenueMonthly = useMemo(
    () => (statsPoints ? buildRevenueMonthlySeries(statsPoints) : []),
    [statsPoints],
  );

  const hasMonthlyCharts = signupsPaymentsMonthly.length > 0;

  const performanceBandClass = embedded
    ? "funnel-overview-performance-band relative shrink-0 border-b border-[#e8edf5] bg-white"
    : "funnel-overview-performance-band relative shrink-0 border-b border-[#e8edf5] bg-white";

  const panelBodyPadClass = "funnel-overview-body";
  const panelSkeletonPadClass = "funnel-overview-body";

  const panelBody = (
    <>
      <div className={performanceBandClass}>
        <span className="inline-flex w-fit max-w-full items-center rounded-full bg-[#1877f2]/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#1877f2] ring-1 ring-[#1877f2]/15">
          Campaign performance
        </span>
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
            />
          ) : (
            <PerformanceDateCalendar
              value={dateFilter}
              onChange={setDateFilter}
            />
          )}
        </div>
      </div>

      {showNoFunnelMessage ? (
        <div className="rd-premium-panel__body rd-premium-panel__body--center">
          <NoFunnelEmptyState onCreateFunnel={onCreateFunnel} />
        </div>
      ) : showSkeleton ? (
        <div className={`rd-premium-panel__body ${panelSkeletonPadClass}`}>
          <OverviewSkeleton />
        </div>
      ) : monthlyStatsTotals ? (
        <div className={`rd-premium-panel__body ${panelBodyPadClass}`}>
          <motion.div
            key="overview-content"
            className="funnel-overview-content"
            variants={funnelPanelStagger}
            initial="hidden"
            animate="show"
          >
            <motion.section
              className="funnel-overview-kpi-grid funnel-overview-kpi-grid--three"
              aria-label="Campaign summary"
              variants={funnelPanelStagger}
            >
              <motion.div variants={funnelPanelItem}>
                <OverviewKpiTile
                  label="Signups"
                  value={monthlyStatsTotals.signups}
                  hint={periodLabel}
                  icon={UserPlus}
                  iconBg={DASHBOARD_KPI_ICON.green}
                  hoverTone="green"
                />
              </motion.div>
              <motion.div variants={funnelPanelItem}>
                <OverviewKpiTile
                  label="Payments"
                  value={monthlyStatsTotals.payments}
                  hint={periodLabel}
                  icon={Users}
                  iconBg={DASHBOARD_KPI_ICON.blue}
                  hoverTone="blue"
                />
              </motion.div>
              <motion.div variants={funnelPanelItem}>
                <OverviewKpiTile
                  label="Revenue"
                  value={monthlyStatsTotals.revenue}
                  hint={periodLabel}
                  icon={DollarSign}
                  iconBg={DASHBOARD_KPI_ICON.pink}
                  hoverTone="pink"
                  format="money"
                  currency={statsMonthly?.currency ?? "usd"}
                />
              </motion.div>
              {analyticsTotals ? (
                <>
                  <motion.div variants={funnelPanelItem}>
                    <OverviewKpiTile
                      label="Page views"
                      value={analyticsTotals.pageViews}
                      hint={periodLabel}
                      icon={Eye}
                      iconBg={DASHBOARD_KPI_ICON.blue}
                      hoverTone="blue"
                    />
                  </motion.div>
                  <motion.div variants={funnelPanelItem}>
                    <OverviewKpiTile
                      label="Button clicks"
                      value={analyticsTotals.buttonClicks}
                      hint={periodLabel}
                      icon={MousePointerClick}
                      iconBg={DASHBOARD_KPI_ICON.pink}
                      hoverTone="pink"
                    />
                  </motion.div>
                  <motion.div variants={funnelPanelItem}>
                    <OverviewKpiTile
                      label="Unique visitors"
                      value={analyticsTotals.uniqueVisitors}
                      hint={periodLabel}
                      icon={Users}
                      iconBg={DASHBOARD_KPI_ICON.green}
                      hoverTone="green"
                    />
                  </motion.div>
                </>
              ) : null}
            </motion.section>

            {hasMonthlyCharts || analyticsTotals ? (
              <motion.section
                className="funnel-overview-chart-grid"
                aria-label="Campaign charts"
                variants={funnelPanelItem}
              >
                {hasMonthlyCharts ? (
                  <>
                    <motion.div
                      className="funnel-overview-chart-slot"
                      variants={funnelPanelItem}
                      key={`signups-payments-${periodLabel}`}
                    >
                      <SignupsPaymentsBarChart
                        data={signupsPaymentsMonthly}
                        caption={periodLabel}
                      />
                    </motion.div>
                    <motion.div
                      className="funnel-overview-chart-slot"
                      variants={funnelPanelItem}
                      key={`signup-breakdown-${periodLabel}`}
                    >
                      <SignupBreakdownPieChart
                        data={signupBreakdownMonthly}
                        caption={periodLabel}
                      />
                    </motion.div>
                  </>
                ) : null}
                {analyticsTotals ? (
                  <>
                    <motion.div
                      className="funnel-overview-chart-slot"
                      variants={funnelPanelItem}
                      key={`page-views-${periodLabel}`}
                    >
                      <AnalyticsMetricMiniChart
                        title="Page views"
                        subtitle={periodLabel}
                        caption={periodLabel}
                        total={analyticsTotals.pageViews}
                        data={pageViewsMonthly}
                        strokeColor={OVERVIEW_CHART_COLORS.blue}
                      />
                    </motion.div>
                    <motion.div
                      className="funnel-overview-chart-slot"
                      variants={funnelPanelItem}
                      key={`button-clicks-${periodLabel}`}
                    >
                      <AnalyticsMetricMiniChart
                        title="Button clicks"
                        subtitle={periodLabel}
                        caption={periodLabel}
                        total={analyticsTotals.buttonClicks}
                        data={buttonClicksMonthly}
                        strokeColor={OVERVIEW_CHART_COLORS.pink}
                      />
                    </motion.div>
                    <motion.div
                      className="funnel-overview-chart-slot"
                      variants={funnelPanelItem}
                      key={`unique-visitors-${periodLabel}`}
                    >
                      <AnalyticsMetricMiniChart
                        title="Unique visitors"
                        subtitle={periodLabel}
                        caption={periodLabel}
                        total={analyticsTotals.uniqueVisitors}
                        data={uniqueVisitorsMonthly}
                        strokeColor={OVERVIEW_CHART_COLORS.green}
                      />
                    </motion.div>
                    <motion.div
                      className="funnel-overview-chart-slot"
                      variants={funnelPanelItem}
                      key={`revenue-${periodLabel}`}
                    >
                      <FunnelRevenueMiniChart
                        data={revenueMonthly}
                        totalRevenueCents={monthlyStatsTotals.revenue}
                        currency={statsMonthly?.currency ?? "usd"}
                        caption={periodLabel}
                      />
                    </motion.div>
                  </>
                ) : null}
              </motion.section>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <div
        className="campaign-immersive-panel funnel-overview-root relative flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden"
        aria-label="Campaign overview"
      >
        <OverviewAlertDialog
          open={alertMessage != null}
          message={alertMessage ?? ""}
          onClose={() => {
            setAlertMessage(null);
            setAlertDismissed(true);
          }}
        />
        <span
          className="pointer-events-none absolute top-6 right-8 size-32 rounded-full bg-[#1877f2]/10 blur-3xl"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute bottom-8 left-6 size-24 rounded-full bg-[#e1306c]/8 blur-3xl"
          aria-hidden
        />
        <div className="funnel-overview-scroll">
          {panelBody}
        </div>
      </div>
    );
  }

  return (
    <section
      className="rd-premium flex min-h-0 w-full flex-1 flex-col"
      aria-label="Campaign overview"
    >
      <OverviewAlertDialog
        open={alertMessage != null}
        message={alertMessage ?? ""}
        onClose={() => {
          setAlertMessage(null);
          setAlertDismissed(true);
        }}
      />

      <div className="rd-premium-page flex min-h-0 w-full flex-1 flex-col px-3 py-4 sm:px-4 sm:py-5 lg:px-6">
        <article className={`${overviewCardClass} funnel-overview-root rd-premium-panel w-full min-w-0`}>
          <span
            className="pointer-events-none absolute -top-10 right-8 size-32 rounded-full bg-[#1877f2]/10 blur-3xl"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute bottom-8 left-6 size-24 rounded-full bg-[#e1306c]/8 blur-3xl"
            aria-hidden
          />
          {panelBody}
        </article>
      </div>
    </section>
  );
}
