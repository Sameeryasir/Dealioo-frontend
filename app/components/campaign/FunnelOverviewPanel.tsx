"use client";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  DollarSign,
  Layers,
  Plus,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ActivityMonthCalendarPicker } from "@/app/components/business/ActivityMonthCalendarPicker";
import { PerformanceDateCalendar } from "@/app/components/business/PerformanceDateCalendar";
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import {
  FunnelDropoffMiniChart,
  FunnelDropoffMiniChartSkeleton,
} from "@/app/components/campaign/overview/charts/FunnelDropoffMiniChart";
import { OverviewLineChartSkeleton } from "@/app/components/campaign/overview/charts/OverviewLineChartSkeleton";
import {
  buildVisitorsAdSourceSeries,
  VisitorsAdSourcesMiniChart,
} from "@/app/components/campaign/overview/charts/VisitorsAdSourcesMiniChart";
import {
  formatMonthLabel,
  sumAnalyticsFromMonthly,
  sumStatsFromMonthly,
} from "@/app/components/campaign/overview/charts/overview-chart-config";
import { Skeleton } from "@/app/components/skeleton";
import {
  currentActivityDateKey,
  currentActivityMonthKey,
  formatActivityDateLabel,
  formatActivityMonthLabel,
  getActivityMonthRangeForKey,
  activityCalendarYearMonthCount,
  resolveActivityDateRange,
  resolveActivityPreviousComparisonRange,
} from "@/app/lib/activity-month-filter";
import { DASHBOARD_KPI_ICON } from "@/app/lib/dashboard-brand-tones";
import { useCountUp } from "@/app/hooks/use-count-up";
import { formatCents } from "@/app/lib/money";
import { getUserTimeZone } from "@/app/lib/datetime";
import { funnelPanelItem, funnelPanelStagger, standardEase } from "@/app/lib/motion";
import { OVERVIEW_AD_SOURCE_COLORS } from "@/app/components/campaign/overview/charts/overview-chart-config";
import { getAnalyticsOverviewMonthly } from "@/app/services/funnel/get-analytics-overview-monthly";
import {
  getFunnelStatsMonthly,
  type FunnelStatsMonthlyPoint,
} from "@/app/services/funnel/get-funnel-stats-monthly";
import { getFunnelGuestAdSources } from "@/app/services/funnel-event/get-funnel-guest-ad-sources";
import { useQuery } from "@tanstack/react-query";

const overviewCardClass =
  "relative overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]";

type AdSourceWinner = "meta" | "google" | "tie";

function percentChange(
  current: number,
  previous: number | null | undefined,
): number | null {
  if (previous == null) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function resolveAdSourceWinner(
  meta: number,
  google: number,
): AdSourceWinner | null {
  if (meta <= 0 && google <= 0) return null;
  if (meta === google) return "tie";
  return meta > google ? "meta" : "google";
}

function findPeakFunnelMonthInYear(
  points: FunnelStatsMonthlyPoint[],
  year: number,
): { month: string; label: string; revenue: number; signups: number; payments: number } | null {
  const yearPrefix = `${year}-`;
  let peak: {
    month: string;
    label: string;
    revenue: number;
    signups: number;
    payments: number;
  } | null = null;

  for (const row of points) {
    if (!row.month.startsWith(yearPrefix)) continue;
    if (row.revenue <= 0 && row.signups <= 0 && row.payments <= 0) continue;
    const next = {
      month: row.month,
      label: formatMonthLabel(row.month),
      revenue: row.revenue,
      signups: row.signups,
      payments: row.payments,
    };
    if (!peak) {
      peak = next;
      continue;
    }
    if (
      next.revenue > peak.revenue ||
      (next.revenue === peak.revenue &&
        next.signups + next.payments > peak.signups + peak.payments)
    ) {
      peak = next;
    }
  }
  return peak;
}

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
  items: Array<{ label: string; value: string; color?: string }>;
}) {
  if (items.length === 0) return null;

  const usePills = items.some((item) => item.color);
  if (usePills) {
    return (
      <ul className="m-0 mt-1.5 flex list-none flex-wrap items-center gap-1.5 p-0">
        {items.map((item) => (
          <li
            key={item.label}
            className="inline-flex items-center gap-1 rounded-full bg-[#f8fafc] px-2 py-0.5 ring-1 ring-[#e8edf5]"
          >
            {item.color ? (
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
            ) : null}
            <span className="text-[0.65rem] font-semibold text-slate-600">
              {item.label}
            </span>
            <span className="text-[0.65rem] font-extrabold tabular-nums text-[#07111f]">
              {item.value}
            </span>
          </li>
        ))}
      </ul>
    );
  }

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
  currency = "usd",
  breakdown,
  showComparison = false,
  changePercent,
  comparisonLabel,
  periodInProgress = false,
  previousValue,
}: {
  label: string;
  value: number;
  hint?: string;
  icon: LucideIcon;
  iconBg: string;
  hoverTone?: "blue" | "pink" | "green" | "orange";
  format?: "number" | "money" | "percent";
  currency?: string;
  breakdown?: Array<{ label: string; value: string; color?: string }>;
  showComparison?: boolean;
  changePercent?: number | null;
  comparisonLabel?: string;
  periodInProgress?: boolean;
  previousValue?: number | null;
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
      className={`funnel-overview-kpi-tile group flex h-full min-h-[7.5rem] items-start gap-3 rounded-[1.2rem] border border-[#e8edf5] bg-white px-3.5 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02] transition duration-200 hover:-translate-y-[2px] ${hoverBorder}`}
    >
      <span
        className={`funnel-overview-kpi-tile__icon flex size-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
      >
        <Icon className="size-4" strokeWidth={2.25} aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 flex-col text-left">
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
        {breakdown ? <OverviewKpiBreakdown items={breakdown} /> : null}
        {showComparison && comparisonLabel ? (
          <OverviewKpiChange
            changePercent={changePercent ?? null}
            comparisonLabel={comparisonLabel}
            periodInProgress={periodInProgress}
            currentValue={value}
            previousValue={previousValue}
          />
        ) : (
          <p className="m-0 mt-1 truncate text-[0.72rem] font-medium text-slate-500">
            {hint ?? "\u00a0"}
          </p>
        )}
      </div>
    </div>
  );
}

function OverviewKpiTileSkeleton() {
  return (
    <div className="flex h-full min-h-[7.5rem] items-start gap-3 rounded-[1.2rem] border border-[#e8edf5] bg-white px-3.5 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]">
      <Skeleton funnel className="size-10 shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col text-left">
        <Skeleton funnel className="h-3 w-16" />
        <Skeleton funnel className="mt-2 h-7 w-20" />
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <Skeleton funnel className="h-5 w-14 rounded-full" />
          <Skeleton funnel className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton funnel className="mt-1.5 h-3 w-24" />
      </div>
    </div>
  );
}

function OverviewHighlightSkeleton() {
  return (
    <div className="funnel-overview-highlight-card" aria-hidden>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Skeleton funnel className="size-10 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <Skeleton funnel className="h-3 w-28" />
          <Skeleton funnel className="mt-1.5 h-5 w-36" />
          <Skeleton funnel className="mt-1.5 h-3 w-48 max-w-full" />
        </div>
      </div>
      <Skeleton funnel className="h-9 w-40 rounded-xl" />
    </div>
  );
}

function OverviewSkeleton() {
  const lineChartSkeletons = [
    { title: "Unique visitors", accent: "blue" as const },
    { title: "Signups", accent: "green" as const },
    { title: "Payments", accent: "orange" as const },
    { title: "Revenue", accent: "pink" as const },
  ];

  return (
    <div
      className="funnel-overview-content"
      aria-busy="true"
      aria-label="Loading campaign overview"
    >
      <OverviewHighlightSkeleton />

      <section className="funnel-overview-kpi-grid" aria-label="Loading summary">
        {Array.from({ length: 4 }).map((_, index) => (
          <OverviewKpiTileSkeleton key={index} />
        ))}
      </section>

      <section
        className="funnel-overview-chart-grid funnel-overview-chart-grid--dropoff-first"
        aria-label="Loading charts"
      >
        <div className="funnel-overview-chart-slot">
          <FunnelDropoffMiniChartSkeleton />
        </div>
        {lineChartSkeletons.map((chart) => (
          <div key={chart.title} className="funnel-overview-chart-slot">
            <OverviewLineChartSkeleton
              title={chart.title}
              accent={chart.accent}
            />
          </div>
        ))}
      </section>
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
  /** Kept for call-site compatibility; Ads & traffic overview section removed. */
  businessId?: number | null;
  campaignId?: number | null;
  campaignName?: string;
  price?: number | string;
  funnelId?: number | null;
  isFunnelIdLoading?: boolean;
  onCreateFunnel?: () => void;
  embedded?: boolean;
}) {
  const [calendarMode, setCalendarMode] = useState<"month" | "day">("month");
  const [monthFilter, setMonthFilter] = useState(currentActivityMonthKey);
  const [dateFilter, setDateFilter] = useState(currentActivityDateKey);
  const viewerTimeZone = useMemo(() => getUserTimeZone(), []);
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
  const periodLabel =
    calendarMode === "day"
      ? formatActivityDateLabel(dateFilter)
      : formatActivityMonthLabel(monthFilter);
  const previousRange = useMemo(
    () =>
      resolveActivityPreviousComparisonRange(
        periodRange.from,
        periodRange.to,
      ),
    [periodRange.from, periodRange.to],
  );
  const comparisonLabel =
    calendarMode === "day" ? "same day last month" : "previous month";
  const periodInProgress =
    calendarMode === "month" && monthFilter === currentActivityMonthKey();
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const statsQuery = useQuery({
    queryKey: [
      "funnel-stats-range",
      funnelId,
      periodRange.from,
      periodRange.to,
      viewerTimeZone,
    ],
    enabled: funnelId != null && funnelId > 0,
    staleTime: 5_000,
    queryFn: () =>
      getFunnelStatsMonthly(funnelId!, {
        from: periodRange.from,
        to: periodRange.to,
        timezone: viewerTimeZone,
      }),
  });
  const previousStatsQuery = useQuery({
    queryKey: [
      "funnel-stats-previous",
      funnelId,
      previousRange?.from ?? null,
      previousRange?.to ?? null,
      viewerTimeZone,
    ],
    enabled:
      funnelId != null &&
      funnelId > 0 &&
      previousRange?.from != null &&
      previousRange?.to != null,
    staleTime: 5_000,
    queryFn: () =>
      getFunnelStatsMonthly(funnelId!, {
        from: previousRange!.from,
        to: previousRange!.to,
        timezone: viewerTimeZone,
      }),
  });
  const analyticsQuery = useQuery({
    queryKey: [
      "funnel-analytics-range",
      funnelId,
      periodRange.from,
      periodRange.to,
      viewerTimeZone,
    ],
    enabled: funnelId != null && funnelId > 0,
    staleTime: 5_000,
    queryFn: () =>
      getAnalyticsOverviewMonthly(funnelId!, {
        from: periodRange.from,
        to: periodRange.to,
        timezone: viewerTimeZone,
      }),
  });
  const previousAnalyticsQuery = useQuery({
    queryKey: [
      "funnel-analytics-previous",
      funnelId,
      previousRange?.from ?? null,
      previousRange?.to ?? null,
      viewerTimeZone,
    ],
    enabled:
      funnelId != null &&
      funnelId > 0 &&
      previousRange?.from != null &&
      previousRange?.to != null,
    staleTime: 5_000,
    queryFn: () =>
      getAnalyticsOverviewMonthly(funnelId!, {
        from: previousRange!.from,
        to: previousRange!.to,
        timezone: viewerTimeZone,
      }),
  });
  const adSourcesQuery = useQuery({
    queryKey: [
      "funnel-guest-ad-sources",
      funnelId,
      periodRange.from,
      periodRange.to,
      viewerTimeZone,
    ],
    enabled: funnelId != null && funnelId > 0,
    staleTime: 5_000,
    queryFn: () =>
      getFunnelGuestAdSources(funnelId!, {
        from: periodRange.from,
        to: periodRange.to,
        timezone: viewerTimeZone,
      }),
  });
  const yearStatsQuery = useQuery({
    queryKey: ["funnel-stats-year-peak", funnelId, currentYear],
    enabled: funnelId != null && funnelId > 0,
    staleTime: 60_000,
    queryFn: () => getFunnelStatsMonthly(funnelId!, { months: 12 }),
  });

  const statsMonthly = statsQuery.data;
  const analyticsMonthly = analyticsQuery.data;
  const adSources = adSourcesQuery.data;
  const previousStatsTotals = useMemo(
    () =>
      previousStatsQuery.data?.data
        ? sumStatsFromMonthly(previousStatsQuery.data.data)
        : null,
    [previousStatsQuery.data],
  );
  const previousAnalyticsTotals = useMemo(
    () =>
      previousAnalyticsQuery.data?.data
        ? sumAnalyticsFromMonthly(previousAnalyticsQuery.data.data)
        : null,
    [previousAnalyticsQuery.data],
  );
  const peakMonth = useMemo(
    () =>
      findPeakFunnelMonthInYear(yearStatsQuery.data?.data ?? [], currentYear),
    [currentYear, yearStatsQuery.data],
  );
  const sourceWinner = useMemo(() => {
    if (!adSources) return null;
    const meta = adSources.meta + (adSources.payments?.meta ?? 0);
    const google = adSources.google + (adSources.payments?.google ?? 0);
    return resolveAdSourceWinner(meta, google);
  }, [adSources]);

  const showComparison =
    previousRange != null &&
    (previousStatsTotals != null || previousAnalyticsTotals != null);
  const metaGoogleBreakdown = (
    meta: number,
    google: number,
  ): Array<{ label: string; value: string; color: string }> => [
    {
      label: "Meta",
      value: String(meta),
      color: OVERVIEW_AD_SOURCE_COLORS.meta,
    },
    {
      label: "Google",
      value: String(google),
      color: OVERVIEW_AD_SOURCE_COLORS.google,
    },
  ];
  const signupsAdBreakdown = adSources
    ? metaGoogleBreakdown(adSources.meta, adSources.google)
    : undefined;
  const paymentsAdBreakdown = adSources?.payments
    ? metaGoogleBreakdown(adSources.payments.meta, adSources.payments.google)
    : undefined;
  const revenueCurrency = statsMonthly?.currency ?? "usd";
  const revenueAdBreakdown = adSources?.revenue
    ? metaGoogleBreakdown(
        adSources.revenue.meta,
        adSources.revenue.google,
      ).map((item) => ({
        ...item,
        value: formatCents(Number(item.value) || 0, revenueCurrency),
      }))
    : undefined;
  const visitorsAdSeries = useMemo(
    () => buildVisitorsAdSourceSeries(adSources?.data ?? []),
    [adSources?.data],
  );
  const paymentsAdSeries = useMemo(
    () => buildVisitorsAdSourceSeries(adSources?.payments?.data ?? []),
    [adSources?.payments?.data],
  );
  const revenueAdSeries = useMemo(
    () => buildVisitorsAdSourceSeries(adSources?.revenue?.data ?? []),
    [adSources?.revenue?.data],
  );

  const [dismissedErrorFunnelId, setDismissedErrorFunnelId] = useState<
    number | null
  >(null);

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

  const alertMessage =
    showSkeleton || dismissedErrorFunnelId === funnelId
      ? null
      : statsQuery.isError
        ? "Could not load funnel stats for this period."
        : analyticsQuery.isError
          ? "Could not load behavior analytics for this period."
          : null;

  const monthlyStatsTotals = useMemo(
    () => (statsPoints ? sumStatsFromMonthly(statsPoints) : null),
    [statsPoints],
  );

  const analyticsTotals = useMemo(
    () =>
      analyticsPoints ? sumAnalyticsFromMonthly(analyticsPoints) : null,
    [analyticsPoints],
  );

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
            {peakMonth || sourceWinner ? (
              <motion.aside
                className="funnel-overview-highlight-card"
                aria-label="Peak month and ad source winner"
                variants={funnelPanelItem}
              >
                {peakMonth ? (
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff] text-[#1877f2]">
                      <Trophy className="size-5" strokeWidth={2.25} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-500">
                        Peak month · {currentYear}
                      </p>
                      <p className="m-0 mt-0.5 truncate text-[1.05rem] font-extrabold tracking-tight text-[#07111f]">
                        {formatActivityMonthLabel(peakMonth.month)}
                      </p>
                      <p className="m-0 mt-0.5 truncate text-[0.75rem] font-medium text-slate-600">
                        {peakMonth.revenue > 0 ? (
                          <span className="font-bold tabular-nums text-slate-800">
                            {formatCents(peakMonth.revenue, revenueCurrency)}
                          </span>
                        ) : null}
                        {peakMonth.signups > 0 || peakMonth.payments > 0 ? (
                          <>
                            {peakMonth.revenue > 0 ? " · " : null}
                            <span className="font-semibold tabular-nums text-slate-700">
                              {peakMonth.signups.toLocaleString()} signups
                            </span>
                            {" · "}
                            <span className="font-semibold tabular-nums text-slate-700">
                              {peakMonth.payments.toLocaleString()} payments
                            </span>
                          </>
                        ) : null}
                      </p>
                    </div>
                  </div>
                ) : null}
                {sourceWinner ? (
                  <div className="flex min-w-0 items-center gap-2 rounded-xl bg-[#f8fafc] px-3 py-2 ring-1 ring-[#e8edf5]">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          sourceWinner === "google"
                            ? OVERVIEW_AD_SOURCE_COLORS.google
                            : sourceWinner === "meta"
                              ? OVERVIEW_AD_SOURCE_COLORS.meta
                              : "#94a3b8",
                      }}
                      aria-hidden
                    />
                    <p className="m-0 text-[0.72rem] font-semibold text-slate-600">
                      Winner ·{" "}
                      <span
                        className="font-extrabold"
                        style={{
                          color:
                            sourceWinner === "google"
                              ? OVERVIEW_AD_SOURCE_COLORS.google
                              : sourceWinner === "meta"
                                ? OVERVIEW_AD_SOURCE_COLORS.meta
                                : "#07111f",
                        }}
                      >
                        {sourceWinner === "tie"
                          ? "Meta & Google tied"
                          : sourceWinner === "meta"
                            ? "Meta"
                            : "Google"}
                      </span>
                      <span className="font-medium text-slate-500">
                        {" "}
                        · {periodLabel}
                      </span>
                    </p>
                  </div>
                ) : null}
              </motion.aside>
            ) : null}

            <motion.section
              className="funnel-overview-kpi-grid"
              aria-label="Campaign summary"
              variants={funnelPanelStagger}
            >
              <motion.div className="h-full" variants={funnelPanelItem}>
                <OverviewKpiTile
                  label="Signups"
                  value={monthlyStatsTotals.signups}
                  hint={periodLabel}
                  icon={UserPlus}
                  iconBg={DASHBOARD_KPI_ICON.green}
                  hoverTone="green"
                  breakdown={signupsAdBreakdown}
                  showComparison={showComparison}
                  changePercent={percentChange(
                    monthlyStatsTotals.signups,
                    previousStatsTotals?.signups,
                  )}
                  comparisonLabel={comparisonLabel}
                  periodInProgress={periodInProgress}
                  previousValue={previousStatsTotals?.signups}
                />
              </motion.div>
              <motion.div className="h-full" variants={funnelPanelItem}>
                <OverviewKpiTile
                  label="Payments"
                  value={monthlyStatsTotals.payments}
                  hint={periodLabel}
                  icon={Users}
                  iconBg={DASHBOARD_KPI_ICON.orange}
                  hoverTone="orange"
                  breakdown={paymentsAdBreakdown}
                  showComparison={showComparison}
                  changePercent={percentChange(
                    monthlyStatsTotals.payments,
                    previousStatsTotals?.payments,
                  )}
                  comparisonLabel={comparisonLabel}
                  periodInProgress={periodInProgress}
                  previousValue={previousStatsTotals?.payments}
                />
              </motion.div>
              <motion.div className="h-full" variants={funnelPanelItem}>
                <OverviewKpiTile
                  label="Revenue"
                  value={monthlyStatsTotals.revenue}
                  hint={periodLabel}
                  icon={DollarSign}
                  iconBg={
                    calendarMode === "day"
                      ? DASHBOARD_KPI_ICON.orange
                      : DASHBOARD_KPI_ICON.pink
                  }
                  hoverTone={calendarMode === "day" ? "orange" : "pink"}
                  format="money"
                  currency={revenueCurrency}
                  breakdown={revenueAdBreakdown}
                  showComparison={showComparison}
                  changePercent={percentChange(
                    monthlyStatsTotals.revenue,
                    previousStatsTotals?.revenue,
                  )}
                  comparisonLabel={comparisonLabel}
                  periodInProgress={periodInProgress}
                  previousValue={previousStatsTotals?.revenue}
                />
              </motion.div>
              {analyticsTotals ? (
                <motion.div className="h-full" variants={funnelPanelItem}>
                  <OverviewKpiTile
                    label="Unique visitors"
                    value={analyticsTotals.uniqueVisitors}
                    hint={periodLabel}
                    icon={Users}
                    iconBg={DASHBOARD_KPI_ICON.blue}
                    hoverTone="blue"
                    breakdown={signupsAdBreakdown}
                    showComparison={showComparison}
                    changePercent={percentChange(
                      analyticsTotals.uniqueVisitors,
                      previousAnalyticsTotals?.uniqueVisitors,
                    )}
                    comparisonLabel={comparisonLabel}
                    periodInProgress={periodInProgress}
                    previousValue={previousAnalyticsTotals?.uniqueVisitors}
                  />
                </motion.div>
              ) : null}
            </motion.section>

            {analyticsTotals || monthlyStatsTotals ? (
              <motion.section
                className={`funnel-overview-chart-grid${
                  analyticsTotals && monthlyStatsTotals
                    ? " funnel-overview-chart-grid--dropoff-first"
                    : ""
                }`}
                aria-label="Campaign charts"
                variants={funnelPanelItem}
              >
                {analyticsTotals && monthlyStatsTotals ? (
                  <motion.div
                    className="funnel-overview-chart-slot"
                    variants={funnelPanelItem}
                    key={`funnel-dropoff-${periodLabel}`}
                  >
                    <FunnelDropoffMiniChart
                      pageViews={analyticsTotals.pageViews}
                      signups={monthlyStatsTotals.signups}
                      payments={monthlyStatsTotals.payments}
                      caption={periodLabel}
                    />
                  </motion.div>
                ) : null}
                {analyticsTotals ? (
                  <motion.div
                    className="funnel-overview-chart-slot"
                    variants={funnelPanelItem}
                    key={`visitors-ads-${periodLabel}`}
                  >
                    <VisitorsAdSourcesMiniChart
                      title="Unique visitors"
                      data={visitorsAdSeries}
                      metaTotal={adSources?.meta ?? 0}
                      googleTotal={adSources?.google ?? 0}
                      caption={periodLabel}
                      accent="blue"
                    />
                  </motion.div>
                ) : null}
                {monthlyStatsTotals ? (
                  <>
                    <motion.div
                      className="funnel-overview-chart-slot"
                      variants={funnelPanelItem}
                      key={`signups-ads-${periodLabel}`}
                    >
                      <VisitorsAdSourcesMiniChart
                        title="Signups"
                        data={visitorsAdSeries}
                        metaTotal={adSources?.meta ?? 0}
                        googleTotal={adSources?.google ?? 0}
                        caption={periodLabel}
                        accent="green"
                      />
                    </motion.div>
                    <motion.div
                      className="funnel-overview-chart-slot"
                      variants={funnelPanelItem}
                      key={`payments-ads-${periodLabel}`}
                    >
                      <VisitorsAdSourcesMiniChart
                        title="Payments"
                        data={paymentsAdSeries}
                        metaTotal={adSources?.payments?.meta ?? 0}
                        googleTotal={adSources?.payments?.google ?? 0}
                        caption={periodLabel}
                        accent="orange"
                      />
                    </motion.div>
                    <motion.div
                      className="funnel-overview-chart-slot"
                      variants={funnelPanelItem}
                      key={`revenue-ads-${periodLabel}`}
                    >
                      <VisitorsAdSourcesMiniChart
                        title="Revenue"
                        data={revenueAdSeries}
                        metaTotal={adSources?.revenue?.meta ?? 0}
                        googleTotal={adSources?.revenue?.google ?? 0}
                        caption={periodLabel}
                        accent={calendarMode === "day" ? "orange" : "pink"}
                        yAxisWidth={52}
                        formatTotal={(cents) =>
                          formatCents(cents, revenueCurrency)
                        }
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
            setDismissedErrorFunnelId(funnelId ?? null);
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
          setDismissedErrorFunnelId(funnelId ?? null);
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
