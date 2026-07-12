"use client";

import {
  Activity,
  ArrowRight,
  DollarSign,
  Eye,
  Layers,
  MousePointerClick,
  Plus,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { AnalyticsMetricMiniChart } from "@/app/components/campaign/overview/charts/AnalyticsMetricMiniChart";
import {
  buildAnalyticsMonthlySeries,
  buildSignupBreakdownFromMonthly,
  buildSignupsPaymentsMonthlyData,
  computeConversionRateFromMonthly,
  OVERVIEW_MONTH_COUNT,
  sumAnalyticsFromMonthly,
  sumStatsFromMonthly,
} from "@/app/components/campaign/overview/charts/overview-chart-config";
import { SignupBreakdownPieChart } from "@/app/components/campaign/overview/charts/SignupBreakdownPieChart";
import { SignupsPaymentsBarChart } from "@/app/components/campaign/overview/charts/SignupsPaymentsBarChart";
import { Skeleton } from "@/app/components/skeleton";
import { useAnalyticsOverviewMonthly } from "@/app/hooks/use-analytics-overview-monthly";
import { useFunnelStatsMonthly } from "@/app/hooks/use-funnel-stats-monthly";
import { DASHBOARD_KPI_ICON } from "@/app/lib/dashboard-brand-tones";
import { formatCents } from "@/app/lib/money";
import { funnelPanelItem, funnelPanelStagger, standardEase } from "@/app/lib/motion";
import { OVERVIEW_CHART_COLORS } from "@/app/components/campaign/overview/charts/overview-chart-config";
import {
  hasAnalyticsMonthlyActivity,
  hasStatsMonthlyActivity,
} from "@/app/components/campaign/overview/charts/overview-monthly-activity";

const overviewCardClass =
  "relative overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]";

function OverviewKpiTile({
  label,
  value,
  hint,
  icon: Icon,
  iconBg,
  hoverTone = "blue",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  iconBg: string;
  hoverTone?: "blue" | "pink" | "green" | "orange";
}) {
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
          className={`funnel-overview-kpi-tile__value m-0 mt-0.5 truncate text-[1.15rem] font-extrabold leading-none tracking-tight text-black transition sm:text-[1.2rem] ${hoverText}`}
        >
          {value}
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
      <div className="funnel-overview-kpi-grid">
        {Array.from({ length: 4 }).map((_, i) => (
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

function NoRecordsFoundCard() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center sm:py-16">
      <p className="m-0 text-[0.95rem] font-extrabold text-[#07111f]">
        No records found
      </p>
      <p className="m-0 mt-1.5 max-w-sm text-[0.82rem] font-medium text-slate-500">
        No signups or payments yet for this campaign.
      </p>
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
  campaignName,
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
  const {
    monthly: statsMonthly,
    isLoading: isStatsMonthlyLoading,
    error: statsMonthlyError,
  } = useFunnelStatsMonthly(funnelId);
  const {
    monthly: analyticsMonthly,
    isLoading: isAnalyticsMonthlyLoading,
    error: analyticsMonthlyError,
  } = useAnalyticsOverviewMonthly(funnelId);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const showSkeleton =
    isFunnelIdLoading || isStatsMonthlyLoading || isAnalyticsMonthlyLoading;
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

  const hasStatsActivity = useMemo(
    () => (statsPoints ? hasStatsMonthlyActivity(statsPoints) : false),
    [statsPoints],
  );

  const hasAnalyticsActivity = useMemo(
    () => (analyticsPoints ? hasAnalyticsMonthlyActivity(analyticsPoints) : false),
    [analyticsPoints],
  );

  const showNoRecords =
    !showSkeleton &&
    funnelId != null &&
    statsPoints != null &&
    analyticsPoints != null &&
    !hasStatsActivity &&
    !hasAnalyticsActivity;

  useEffect(() => {
    if (showSkeleton) return;

    const message = statsMonthlyError ?? analyticsMonthlyError;
    if (message && !alertDismissed) {
      setAlertMessage(message);
    }
  }, [statsMonthlyError, analyticsMonthlyError, showSkeleton, alertDismissed]);

  useEffect(() => {
    setAlertDismissed(false);
    setAlertMessage(null);
  }, [funnelId]);

  const monthlyStatsTotals = useMemo(
    () => (statsPoints ? sumStatsFromMonthly(statsPoints) : null),
    [statsPoints],
  );

  const conversionRate = useMemo(
    () => (statsPoints ? computeConversionRateFromMonthly(statsPoints) : 0),
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

  const sessionsMonthly = useMemo(
    () =>
      analyticsPoints
        ? buildAnalyticsMonthlySeries(analyticsPoints, "sessions")
        : [],
    [analyticsPoints],
  );

  const displayName = campaignName?.trim() ? campaignName : "Campaign";
  const hasMonthlyCharts = hasStatsActivity && signupsPaymentsMonthly.length > 0;
  const hasAnalyticsMonthly = hasAnalyticsActivity;

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
        <div className="funnel-overview-performance-band__meta">
          <span
            className="inline-flex max-w-full items-center rounded-full bg-[#1877f2] px-2.5 py-1 text-[0.68rem] font-bold text-white shadow-[0_4px_12px_rgba(24,119,242,0.2)]"
            title={displayName}
          >
            {displayName}
          </span>
          <span className="inline-flex items-center rounded-full bg-[#f4f7fb] px-2.5 py-1 text-[0.68rem] font-semibold text-slate-600 ring-1 ring-[#e8edf5]">
            Last {OVERVIEW_MONTH_COUNT} months
          </span>
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
      ) : showNoRecords ? (
        <div className="rd-premium-panel__body rd-premium-panel__body--center">
          <NoRecordsFoundCard />
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
              className="funnel-overview-kpi-grid"
              aria-label="Campaign summary"
              variants={funnelPanelStagger}
            >
              <motion.div variants={funnelPanelItem}>
                <OverviewKpiTile
                  label="Signups"
                  value={monthlyStatsTotals.signups}
                  hint="Total"
                  icon={UserPlus}
                  iconBg={DASHBOARD_KPI_ICON.green}
                  hoverTone="green"
                />
              </motion.div>
              <motion.div variants={funnelPanelItem}>
                <OverviewKpiTile
                  label="Payments"
                  value={monthlyStatsTotals.payments}
                  hint="Completed"
                  icon={Users}
                  iconBg={DASHBOARD_KPI_ICON.blue}
                  hoverTone="blue"
                />
              </motion.div>
              <motion.div variants={funnelPanelItem}>
                <OverviewKpiTile
                  label="Revenue"
                  value={formatCents(
                    monthlyStatsTotals.revenue,
                    statsMonthly?.currency ?? "usd",
                  )}
                  hint="Earned"
                  icon={DollarSign}
                  iconBg={DASHBOARD_KPI_ICON.pink}
                  hoverTone="pink"
                />
              </motion.div>
              <motion.div variants={funnelPanelItem}>
                <OverviewKpiTile
                  label="Conversion"
                  value={`${conversionRate.toFixed(1)}%`}
                  hint="Rate"
                  icon={TrendingUp}
                  iconBg={DASHBOARD_KPI_ICON.orange}
                  hoverTone="orange"
                />
              </motion.div>
            </motion.section>

            {hasMonthlyCharts ? (
              <motion.section
                className="rd-premium-section"
                aria-label="Conversion charts"
                variants={funnelPanelItem}
              >
                <div className="rd-premium-section-head">
                  <h2>Conversion trends</h2>
                </div>
                <div className="funnel-overview-chart-grid">
                  <motion.div className="funnel-overview-chart-slot" variants={funnelPanelItem}>
                    <SignupsPaymentsBarChart data={signupsPaymentsMonthly} />
                  </motion.div>
                  <motion.div className="funnel-overview-chart-slot" variants={funnelPanelItem}>
                    <SignupBreakdownPieChart data={signupBreakdownMonthly} />
                  </motion.div>
                </div>
              </motion.section>
            ) : null}

            {analyticsTotals && hasAnalyticsMonthly ? (
              <motion.section
                className="rd-premium-section"
                aria-label="Behavior analytics"
                variants={funnelPanelItem}
              >
                <div className="rd-premium-section-head">
                  <h2>Behavior analytics</h2>
                </div>

                <motion.div
                  className="funnel-overview-kpi-grid"
                  variants={funnelPanelStagger}
                >
                  <motion.div variants={funnelPanelItem}>
                    <OverviewKpiTile
                      label="Page views"
                      value={analyticsTotals.pageViews}
                      hint="Total"
                      icon={Eye}
                      iconBg={DASHBOARD_KPI_ICON.blue}
                      hoverTone="blue"
                    />
                  </motion.div>
                  <motion.div variants={funnelPanelItem}>
                    <OverviewKpiTile
                      label="Button clicks"
                      value={analyticsTotals.buttonClicks}
                      hint="Total"
                      icon={MousePointerClick}
                      iconBg={DASHBOARD_KPI_ICON.pink}
                      hoverTone="pink"
                    />
                  </motion.div>
                  <motion.div variants={funnelPanelItem}>
                    <OverviewKpiTile
                      label="Unique visitors"
                      value={analyticsTotals.uniqueVisitors}
                      hint="Guests"
                      icon={Users}
                      iconBg={DASHBOARD_KPI_ICON.green}
                      hoverTone="green"
                    />
                  </motion.div>
                  <motion.div variants={funnelPanelItem}>
                    <OverviewKpiTile
                      label="Sessions"
                      value={analyticsTotals.sessions}
                      hint="Total"
                      icon={Activity}
                      iconBg={DASHBOARD_KPI_ICON.orange}
                      hoverTone="orange"
                    />
                  </motion.div>
                </motion.div>

                <div className="funnel-overview-chart-grid">
                  <motion.div className="funnel-overview-chart-slot" variants={funnelPanelItem}>
                    <AnalyticsMetricMiniChart
                      title="Page views by month"
                      subtitle="Monthly page views"
                      total={analyticsTotals.pageViews}
                      data={pageViewsMonthly}
                      strokeColor={OVERVIEW_CHART_COLORS.blue}
                    />
                  </motion.div>
                  <motion.div className="funnel-overview-chart-slot" variants={funnelPanelItem}>
                    <AnalyticsMetricMiniChart
                      title="Button clicks by month"
                      subtitle="Monthly button clicks"
                      total={analyticsTotals.buttonClicks}
                      data={buttonClicksMonthly}
                      strokeColor={OVERVIEW_CHART_COLORS.pink}
                    />
                  </motion.div>
                  <motion.div className="funnel-overview-chart-slot" variants={funnelPanelItem}>
                    <AnalyticsMetricMiniChart
                      title="Unique visitors by month"
                      subtitle="Monthly unique visitors"
                      total={analyticsTotals.uniqueVisitors}
                      data={uniqueVisitorsMonthly}
                      strokeColor={OVERVIEW_CHART_COLORS.green}
                    />
                  </motion.div>
                  <motion.div className="funnel-overview-chart-slot" variants={funnelPanelItem}>
                    <AnalyticsMetricMiniChart
                      title="Sessions by month"
                      subtitle="Monthly sessions"
                      total={analyticsTotals.sessions}
                      data={sessionsMonthly}
                      strokeColor={OVERVIEW_CHART_COLORS.orange}
                    />
                  </motion.div>
                </div>
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
