"use client";

import {
  Activity,
  DollarSign,
  Eye,
  MousePointerClick,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
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
import type { FunnelAnalyticsMonthlyPoint } from "@/app/services/funnel/get-analytics-overview-monthly";
import type { FunnelStatsMonthlyPoint } from "@/app/services/funnel/get-funnel-stats-monthly";
import { SignupBreakdownPieChart } from "@/app/components/campaign/overview/charts/SignupBreakdownPieChart";
import { SignupsPaymentsBarChart } from "@/app/components/campaign/overview/charts/SignupsPaymentsBarChart";
import { MetricStatCardAccent } from "@/app/components/shared/MetricStatCard";
import { Skeleton } from "@/app/components/skeleton";
import { useAnalyticsOverviewMonthly } from "@/app/hooks/use-analytics-overview-monthly";
import { useFunnelStatsMonthly } from "@/app/hooks/use-funnel-stats-monthly";
import { formatCents } from "@/app/lib/money";
import { funnelPanelItem, funnelPanelStagger, standardEase } from "@/app/lib/motion";
import { panelCardClass, panelCardPaddingClass } from "@/app/lib/panel-styles";
import { OVERVIEW_CHART_COLORS } from "@/app/components/campaign/overview/charts/overview-chart-config";
import {
  buildMockAnalyticsMonthlyPoints,
  buildMockStatsMonthlyPoints,
  mergeAnalyticsWithMockPreview,
  mergeStatsWithMockPreview,
} from "@/app/components/campaign/overview/charts/overview-mock-monthly-data";

function OverviewSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading stats">
      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-full ${panelCardClass} ${panelCardPaddingClass}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton funnel className="h-3 w-16" />
                <Skeleton funnel className="h-8 w-20" />
                <Skeleton funnel className="h-3 w-28" />
              </div>
              <Skeleton funnel className="size-11 shrink-0 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid auto-rows-fr gap-5 lg:grid-cols-2">
        <div className={`h-full min-h-[280px] ${panelCardClass} ${panelCardPaddingClass}`}>
          <Skeleton funnel className="h-4 w-36" />
          <Skeleton funnel className="mt-2 h-3 w-28" />
          <Skeleton funnel className="mt-6 h-[220px] w-full rounded-xl" />
        </div>
        <div className={`h-full min-h-[280px] ${panelCardClass} ${panelCardPaddingClass}`}>
          <Skeleton funnel className="h-4 w-32" />
          <Skeleton funnel className="mt-2 h-3 w-40" />
          <Skeleton funnel className="mt-6 h-[220px] w-full rounded-full" />
        </div>
      </div>

      <div>
        <Skeleton funnel className="h-4 w-36" />
        <Skeleton funnel className="mt-2 h-3 w-56" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} funnel className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <Skeleton funnel className="h-48 w-full rounded-2xl" />
          <Skeleton funnel className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function NoRecordsFoundCard() {
  return (
    <div
      className={`${panelCardClass} ${panelCardPaddingClass} py-14 text-center`}
    >
      <p className="text-sm font-semibold text-zinc-900">No records found</p>
      <p className="mt-1.5 text-sm text-zinc-500">
        No signups or payments yet for this campaign.
      </p>
    </div>
  );
}

export function FunnelOverviewPanel({
  campaignName,
  funnelId,
  isFunnelIdLoading = false,
}: {
  campaignName?: string;
  price?: number | string;
  funnelId?: number | null;
  isFunnelIdLoading?: boolean;
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

  const statsMerge = useMemo(() => {
    if (showSkeleton || funnelId == null) {
      return { points: null as FunnelStatsMonthlyPoint[] | null, usedMock: false };
    }
    if (statsMonthly?.data?.length) {
      return mergeStatsWithMockPreview(statsMonthly.data);
    }
    return { points: buildMockStatsMonthlyPoints(), usedMock: true };
  }, [showSkeleton, funnelId, statsMonthly]);

  const analyticsMerge = useMemo(() => {
    if (showSkeleton || funnelId == null) {
      return {
        points: null as FunnelAnalyticsMonthlyPoint[] | null,
        usedMock: false,
      };
    }
    if (analyticsMonthly?.data?.length) {
      return mergeAnalyticsWithMockPreview(analyticsMonthly.data);
    }
    return { points: buildMockAnalyticsMonthlyPoints(), usedMock: true };
  }, [showSkeleton, funnelId, analyticsMonthly]);

  const statsPoints = statsMerge.points;
  const analyticsPoints = analyticsMerge.points;

  const showNoRecords = false;

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
  const hasMonthlyCharts = signupsPaymentsMonthly.length > 0;
  const hasAnalyticsMonthly = (analyticsPoints?.length ?? 0) > 0;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-zinc-50 via-white to-zinc-100/70">
      <OverviewAlertDialog
        open={alertMessage != null}
        message={alertMessage ?? ""}
        onClose={() => {
          setAlertMessage(null);
          setAlertDismissed(true);
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
        <motion.header
          className="mb-8 rounded-2xl border border-zinc-200/80 bg-white/90 px-5 py-5 shadow-sm ring-1 ring-zinc-950/[0.03] backdrop-blur-sm sm:px-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: standardEase }}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Overview
            </p>
            <h2 className="font-display mt-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
              {displayName}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600">
              Conversion metrics and live funnel behavior analytics, month
              view (last {OVERVIEW_MONTH_COUNT} months).
            </p>
          </div>
        </motion.header>

        {showNoFunnelMessage ? (
          <p className="rounded-2xl border border-amber-200/90 bg-amber-50 px-4 py-3.5 text-sm text-amber-950 shadow-sm">
            No funnel id yet. Open the Funnel tab and save once to load stats.
          </p>
        ) : null}

        {showSkeleton ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: standardEase }}
          >
            <OverviewSkeleton />
          </motion.div>
        ) : null}

        {showNoRecords ? <NoRecordsFoundCard /> : null}

        {monthlyStatsTotals && !showSkeleton && !showNoRecords ? (
          <motion.div
            key="overview-content"
            className="space-y-8"
            variants={funnelPanelStagger}
            initial="hidden"
            animate="show"
          >
            <motion.div
              className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4"
              variants={funnelPanelStagger}
            >
              <motion.div className="h-full" variants={funnelPanelItem}>
                <MetricStatCardAccent
                  label="Signups"
                  value={monthlyStatsTotals.signups}
                  icon={UserPlus}
                  tone="emerald"
                />
              </motion.div>
              <motion.div className="h-full" variants={funnelPanelItem}>
                <MetricStatCardAccent
                  label="Payments"
                  value={monthlyStatsTotals.payments}
                  icon={Users}
                  tone="blue"
                  highlight={monthlyStatsTotals.payments > 0}
                />
              </motion.div>
              <motion.div className="h-full" variants={funnelPanelItem}>
                <MetricStatCardAccent
                  label="Revenue"
                  value={formatCents(
                    monthlyStatsTotals.revenue,
                    statsMonthly?.currency ?? "usd",
                  )}
                  icon={DollarSign}
                  tone="violet"
                />
              </motion.div>
              <motion.div className="h-full" variants={funnelPanelItem}>
                <MetricStatCardAccent
                  label="Conversion"
                  value={`${conversionRate.toFixed(1)}%`}
                  icon={TrendingUp}
                  tone="zinc"
                  highlight={conversionRate >= 50}
                />
              </motion.div>
            </motion.div>

            {hasMonthlyCharts ? (
              <motion.div
                className="grid auto-rows-fr gap-5 lg:grid-cols-2"
                variants={funnelPanelStagger}
              >
                <motion.div className="h-full min-h-[300px]" variants={funnelPanelItem}>
                  <SignupsPaymentsBarChart data={signupsPaymentsMonthly} />
                </motion.div>
                <motion.div className="h-full min-h-[300px]" variants={funnelPanelItem}>
                  <SignupBreakdownPieChart data={signupBreakdownMonthly} />
                </motion.div>
              </motion.div>
            ) : null}

            {analyticsTotals && hasAnalyticsMonthly ? (
              <motion.div className="space-y-5" variants={funnelPanelItem}>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Behavior analytics
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Page views, clicks, sessions, and customers, month view
                  </p>
                </div>

                <motion.div
                  className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4"
                  variants={funnelPanelStagger}
                >
                  <motion.div className="h-full" variants={funnelPanelItem}>
                    <MetricStatCardAccent
                      label="Page views"
                      value={analyticsTotals.pageViews}
                      icon={Eye}
                      tone="blue"
                    />
                  </motion.div>
                  <motion.div className="h-full" variants={funnelPanelItem}>
                    <MetricStatCardAccent
                      label="Button clicks"
                      value={analyticsTotals.buttonClicks}
                      icon={MousePointerClick}
                      tone="violet"
                    />
                  </motion.div>
                  <motion.div className="h-full" variants={funnelPanelItem}>
                    <MetricStatCardAccent
                      label="Unique visitors"
                      value={analyticsTotals.uniqueVisitors}
                      icon={Users}
                      tone="emerald"
                    />
                  </motion.div>
                  <motion.div className="h-full" variants={funnelPanelItem}>
                    <MetricStatCardAccent
                      label="Sessions"
                      value={analyticsTotals.sessions}
                      icon={Activity}
                      tone="zinc"
                    />
                  </motion.div>
                </motion.div>

                <motion.div
                  className="grid auto-rows-fr gap-5 lg:grid-cols-2"
                  variants={funnelPanelStagger}
                >
                  <motion.div className="h-full" variants={funnelPanelItem}>
                    <AnalyticsMetricMiniChart
                      title="Page views by month"
                      subtitle="Monthly page views"
                      total={analyticsTotals.pageViews}
                      data={pageViewsMonthly}
                      strokeColor={OVERVIEW_CHART_COLORS.blue}
                    />
                  </motion.div>
                  <motion.div className="h-full" variants={funnelPanelItem}>
                    <AnalyticsMetricMiniChart
                      title="Button clicks by month"
                      subtitle="Monthly button clicks"
                      total={analyticsTotals.buttonClicks}
                      data={buttonClicksMonthly}
                      strokeColor={OVERVIEW_CHART_COLORS.violet}
                    />
                  </motion.div>
                  <motion.div className="h-full" variants={funnelPanelItem}>
                    <AnalyticsMetricMiniChart
                      title="Unique visitors by month"
                      subtitle="Monthly unique visitors"
                      total={analyticsTotals.uniqueVisitors}
                      data={uniqueVisitorsMonthly}
                      strokeColor={OVERVIEW_CHART_COLORS.emerald}
                    />
                  </motion.div>
                  <motion.div className="h-full" variants={funnelPanelItem}>
                    <AnalyticsMetricMiniChart
                      title="Sessions by month"
                      subtitle="Monthly sessions"
                      total={analyticsTotals.sessions}
                      data={sessionsMonthly}
                      strokeColor={OVERVIEW_CHART_COLORS.zinc}
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            ) : null}
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
