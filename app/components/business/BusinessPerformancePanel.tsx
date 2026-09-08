"use client";

import { ActivityMonthCalendarPicker } from "@/app/components/business/ActivityMonthCalendarPicker";
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { Skeleton } from "@/app/components/skeleton";
import {
  ACTIVITY_ALL_MONTHS_ID,
  buildActivityMonthFilterOptions,
  buildActivityMonthKey,
  formatActivityMonthLabel,
  parseActivityMonthKey,
  resolveActivityMonthRange,
} from "@/app/lib/activity-month-filter";
import { campaignDashboardHref } from "@/app/lib/campaign-dashboard-tab";
import { formatCents, formatDollars } from "@/app/lib/money";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  resolveUploadImageUrl,
  spacesImageEagerLoadProps,
} from "@/app/lib/resolve-upload-image-url";
import {
  getBusinessTopEarningCampaigns,
  type BusinessConversionCampaign,
  type BusinessTopCampaign,
} from "@/app/services/funnel-event/get-business-top-campaigns";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Info,
  Link2,
  Megaphone,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartMetric = "earnings" | "orders" | "customers";

const CHART_METRIC_BUTTONS: Array<{ id: ChartMetric; label: string }> = [
  { id: "earnings", label: "Earnings" },
  { id: "orders", label: "Orders" },
  { id: "customers", label: "Customers" },
];

const CHART_COLORS = ["#3b82f6", "#a855f7", "#10b981", "#EA580C", "#DB2777"];
const PERFORMANCE_CHART_HEIGHT_PX = 340;

function PerformanceChartMount({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  if (!ready) {
    return (
      <div
        className="w-full min-w-0 animate-pulse rounded-xl bg-[#f1f5f9]"
        style={{ height: PERFORMANCE_CHART_HEIGHT_PX }}
        aria-hidden
      />
    );
  }

  return <>{children}</>;
}

type PerformanceScoreBreakdown = {
  score: number;
  earningsPoints: number;
  ordersPoints: number;
  repeatPoints: number;
  avgRevPoints: number;
};

function currentMonthKey(): string {
  const now = new Date();
  return buildActivityMonthKey(now.getUTCFullYear(), now.getUTCMonth() + 1);
}

const panelCardClass =
  "rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]";

function percentChange(
  current: number,
  previous: number | null | undefined,
): number | null {
  if (previous == null) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function formatTitleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatDayLabel(dateKey: string): string {
  const [yearRaw, monthRaw, dayRaw] = dateKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return dateKey;
  }
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function enumerateUtcDateKeys(fromKey: string, toKey: string): string[] {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(fromKey) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(toKey) ||
    fromKey > toKey
  ) {
    return [];
  }
  const [fromY, fromM, fromD] = fromKey.split("-").map(Number);
  const [toY, toM, toD] = toKey.split("-").map(Number);
  const cursor = new Date(Date.UTC(fromY!, fromM! - 1, fromD!));
  const end = new Date(Date.UTC(toY!, toM! - 1, toD!));
  const keys: string[] = [];
  while (cursor.getTime() <= end.getTime()) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

function fullMonthUtcDateKeys(monthKey: string): string[] {
  const parsed = parseActivityMonthKey(monthKey);
  if (!parsed) return [];
  const startKey = `${monthKey}-01`;
  const endKey = new Date(Date.UTC(parsed.year, parsed.month, 0))
    .toISOString()
    .slice(0, 10);
  return enumerateUtcDateKeys(startKey, endKey);
}

function utcTodayDateKey(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
    .toISOString()
    .slice(0, 10);
}

function repeatRatePercent(campaign: BusinessTopCampaign): number {
  if (campaign.uniqueCustomerCount <= 0) return 0;
  return Math.round(
    (campaign.repeatedCustomerCount / campaign.uniqueCustomerCount) * 100,
  );
}

function avgRevenueCentsPerCustomer(campaign: BusinessTopCampaign): number {
  if (campaign.uniqueCustomerCount <= 0) return 0;
  return Math.round(campaign.earningsCents / campaign.uniqueCustomerCount);
}

function performanceScoreBreakdown(
  campaign: BusinessTopCampaign,
  campaigns: BusinessTopCampaign[],
): PerformanceScoreBreakdown {
  const maxEarnings = Math.max(...campaigns.map((row) => row.earningsCents), 1);
  const maxOrders = Math.max(...campaigns.map((row) => row.orderCount), 1);
  const maxAvg = Math.max(
    ...campaigns.map((row) => avgRevenueCentsPerCustomer(row)),
    1,
  );
  const earningsPoints = (campaign.earningsCents / maxEarnings) * 50;
  const ordersPoints = (campaign.orderCount / maxOrders) * 20;
  const repeatPoints = Math.min(100, repeatRatePercent(campaign)) * 0.15;
  const avgRevPoints = (avgRevenueCentsPerCustomer(campaign) / maxAvg) * 15;
  const score = Math.max(
    1,
    Math.min(
      99,
      Math.round(earningsPoints + ordersPoints + repeatPoints + avgRevPoints),
    ),
  );
  return {
    score,
    earningsPoints: Math.round(earningsPoints),
    ordersPoints: Math.round(ordersPoints),
    repeatPoints: Math.round(repeatPoints),
    avgRevPoints: Math.round(avgRevPoints),
  };
}

function conversionRatePercent(views: number, paidOrders: number): number | null {
  if (views <= 0) return null;
  return Math.round((paidOrders / views) * 10000) / 100;
}

function formatConversionRate(views: number, paidOrders: number): string {
  const rate = conversionRatePercent(views, paidOrders);
  if (rate == null) return "—";
  return `${rate}%`;
}

function scoreTone(score: number): string {
  if (score >= 85) return "bg-emerald-50 text-emerald-700";
  if (score >= 70) return "bg-[#EEF4FF] text-[#1D4ED8]";
  return "bg-slate-100 text-slate-600";
}

function KpiHealthFooter({
  changePercent,
  comparisonLabel,
  monthInProgress,
  currentValue,
  previousValue,
}: {
  changePercent: number | null;
  comparisonLabel: string;
  monthInProgress: boolean;
  currentValue: number;
  previousValue: number | null | undefined;
}) {
  if (changePercent == null && previousValue === 0 && currentValue > 0) {
    return (
      <p className="m-0 text-xs text-emerald-600">
        <span className="font-semibold">New</span> vs. {comparisonLabel}
      </p>
    );
  }

  if (changePercent == null) {
    return (
      <p className="m-0 text-xs text-slate-400">No prior period to compare</p>
    );
  }

  if (changePercent === 0) {
    return (
      <p className="m-0 text-xs text-slate-500">
        <span className="font-semibold tabular-nums text-slate-600">0%</span>{" "}
        flat vs. {comparisonLabel}
      </p>
    );
  }

  const improving = changePercent > 0;
  const Icon = improving ? ArrowUpRight : ArrowDownRight;
  const tone = improving ? "text-emerald-600" : "text-rose-600";
  const healthLabel = monthInProgress
    ? improving
      ? "Ahead so far"
      : "Behind so far"
    : improving
      ? "Improving"
      : "Declining";

  return (
    <p className="m-0 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500">
      <span className={`inline-flex items-center gap-0.5 font-semibold ${tone}`}>
        <Icon className="size-3.5" aria-hidden />
        <span className="tabular-nums">{Math.abs(changePercent)}%</span>
      </span>
      <span>vs. {comparisonLabel}</span>
      <span className={`font-semibold ${tone}`}>· {healthLabel}</span>
    </p>
  );
}

function PerformanceKpiCard({
  title,
  hint,
  value,
  footer,
  icon: Icon,
  iconWrapClass,
  iconClass,
}: {
  title: string;
  hint: string;
  value: string;
  footer?: ReactNode;
  icon: LucideIcon;
  iconWrapClass: string;
  iconClass: string;
}) {
  return (
    <div className={`${panelCardClass} px-4 py-4`}>
      <div className="flex items-start gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconWrapClass}`}
        >
          <Icon
            className={`size-5 ${iconClass}`}
            strokeWidth={2.25}
            aria-hidden
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 flex items-center gap-1 text-[0.78rem] font-medium text-slate-500">
            {title}
            <span title={hint} className="inline-flex text-slate-300">
              <Info className="size-3.5" aria-hidden />
              <span className="sr-only">{hint}</span>
            </span>
          </p>
          <p className="m-0 mt-1 truncate text-xl font-semibold tabular-nums tracking-tight text-[#07111f]">
            {value}
          </p>
          {footer ? <div className="mt-2">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

function CampaignChartTooltip({
  active,
  label,
  payload,
  chartCampaigns,
  chartMetric,
  hoveredSeriesKey,
}: {
  active?: boolean;
  label?: string | number;
  payload?: Array<{
    dataKey?: string | number;
    name?: string | number;
    value?: number | string;
    color?: string;
    payload?: Record<string, string | number | null>;
  }>;
  chartCampaigns: BusinessTopCampaign[];
  chartMetric: ChartMetric;
  hoveredSeriesKey: string | null;
}) {
  if (!active || !payload?.length || !hoveredSeriesKey) return null;

  const entry = payload.find(
    (row) => String(row.dataKey ?? row.name ?? "") === hoveredSeriesKey,
  );
  if (!entry) return null;

  const dataKey = String(entry.dataKey ?? entry.name ?? "");
  const campaign = chartCampaigns.find(
    (row) => `c${row.campaignId}` === dataKey,
  );
  const pointValue = entry.payload?.[dataKey];
  const rawValue = entry.value ?? pointValue;
  if (rawValue == null || rawValue === "") return null;

  const numeric = Math.max(0, Math.round(Number(rawValue) || 0));
  if (numeric <= 0) return null;

  const name =
    formatTitleCase(campaign?.campaignName ?? "") ||
    campaign?.campaignName ||
    dataKey;
  const imageSrc = resolveUploadImageUrl(campaign?.imageUrl ?? null);
  const valueLabel =
    chartMetric === "earnings"
      ? formatCents(numeric, "USD")
      : String(numeric);
  const dayLabel = String(entry.payload?.fullLabel ?? label ?? "");

  return (
    <div className="min-w-[180px] rounded-xl border border-[#e8edf5] bg-white px-3 py-2.5 shadow-[0_12px_28px_rgba(15,23,42,0.12)]">
      <p className="m-0 mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-slate-400">
        {dayLabel}
      </p>
      <div className="flex items-center gap-2.5">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt=""
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-[#e8edf5]"
            {...spacesImageEagerLoadProps}
          />
        ) : (
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-[#e8edf5]"
            style={{
              backgroundColor: `${entry.color ?? "#1877f2"}18`,
              color: entry.color ?? "#1877f2",
            }}
          >
            <Megaphone className="size-4" aria-hidden />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-sm font-semibold text-[#07111f]">
            {name}
          </p>
          <p
            className="m-0 mt-0.5 text-xs font-semibold tabular-nums"
            style={{ color: entry.color ?? "#64748b" }}
          >
            {valueLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

function CampaignBillingBadge({
  campaignType,
}: {
  campaignType?: "prepaid" | "postpaid" | null;
}) {
  if (campaignType === "postpaid") {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[0.68rem] font-medium text-slate-600">
        Postpaid
      </span>
    );
  }
  if (campaignType === "prepaid") {
    return (
      <span className="inline-flex items-center rounded-full bg-[#EEF4FF] px-2 py-0.5 text-[0.68rem] font-medium text-[#1D4ED8]">
        Prepaid
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[0.68rem] font-medium text-slate-500">
      —
    </span>
  );
}

function ConversionPerformanceSection({
  campaigns,
  isPending,
}: {
  campaigns: BusinessConversionCampaign[];
  isPending: boolean;
}) {
  const bestCampaignId = useMemo(() => {
    let bestId: number | null = null;
    let bestRate = -1;
    for (const row of campaigns) {
      const rate = conversionRatePercent(row.viewCount, row.orderCount);
      if (rate == null) continue;
      if (rate > bestRate) {
        bestRate = rate;
        bestId = row.campaignId;
      }
    }
    return bestId;
  }, [campaigns]);

  if (isPending) {
    return (
      <div className={`${panelCardClass} px-4 py-4 sm:px-5`}>
        <Skeleton className="h-5 w-48 rounded-md" />
        <Skeleton className="mt-2 h-4 w-72 rounded-md" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) return null;

  return (
    <div className={`${panelCardClass} px-4 py-4 sm:px-5`}>
      <div className="min-w-0">
        <h2 className="m-0 text-[0.95rem] font-semibold text-[#07111f]">
          Conversion Performance
        </h2>
        <p className="m-0 mt-0.5 text-sm text-slate-500">
          Paid orders ÷ page views for your top campaigns this period.
        </p>
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {campaigns.map((campaign) => {
          const name =
            formatTitleCase(campaign.campaignName) || campaign.campaignName;
          const isBest = campaign.campaignId === bestCampaignId;
          const rateLabel = formatConversionRate(
            campaign.viewCount,
            campaign.orderCount,
          );
          const hasViews = campaign.viewCount > 0;

          return (
            <div
              key={campaign.campaignId}
              className="rounded-xl border border-[#e8edf5] bg-[#fbfdff] px-3.5 py-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="m-0 truncate text-sm font-semibold text-[#07111f]">
                  {name}
                </p>
                {isBest ? (
                  <span className="shrink-0 rounded-full bg-[#EEF4FF] px-2 py-0.5 text-[0.65rem] font-semibold text-[#1D4ED8]">
                    Best converter
                  </span>
                ) : null}
              </div>

              <p className="m-0 mt-2 text-xl font-semibold tabular-nums tracking-tight text-[#07111f]">
                {hasViews ? rateLabel : "No views yet"}
              </p>
              <p className="m-0 mt-0.5 text-[0.65rem] font-medium text-slate-400">
                {hasViews
                  ? `${campaign.orderCount} paid · ${campaign.viewCount} views`
                  : `${campaign.orderCount} paid · 0 views`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UniqueCustomersCell({ campaign }: { campaign: BusinessTopCampaign }) {
  return (
    <div className="group relative inline-flex justify-center">
      <span className="cursor-default text-sm tabular-nums text-slate-700 underline decoration-dotted decoration-slate-300 underline-offset-2">
        {campaign.uniqueCustomerCount}
      </span>
      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-44 -translate-x-1/2 rounded-xl border border-[#e8edf5] bg-white px-3 py-2.5 text-left shadow-[0_12px_28px_rgba(15,23,42,0.12)] group-hover:block group-focus-within:block">
        <p className="m-0 text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-slate-400">
          Customer Breakdown
        </p>
        <dl className="m-0 mt-2 space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center justify-between gap-3">
            <dt className="m-0">New customers</dt>
            <dd className="m-0 font-semibold tabular-nums text-[#07111f]">
              {campaign.newCustomerCount}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="m-0">Returning customers</dt>
            <dd className="m-0 font-semibold tabular-nums text-[#07111f]">
              {campaign.returningCustomerCount}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-[#eef2f7] pt-1.5">
            <dt className="m-0 font-medium">Total</dt>
            <dd className="m-0 font-semibold tabular-nums text-[#07111f]">
              {campaign.uniqueCustomerCount}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function PerformanceScoreCell({
  campaign,
  campaigns,
}: {
  campaign: BusinessTopCampaign;
  campaigns: BusinessTopCampaign[];
}) {
  const breakdown = performanceScoreBreakdown(campaign, campaigns);
  return (
    <div className="group relative inline-flex justify-center">
      <button
        type="button"
        className={`inline-flex min-w-[2.25rem] cursor-default items-center justify-center rounded-full px-2.5 py-1 text-[0.75rem] font-semibold tabular-nums ${scoreTone(breakdown.score)}`}
        aria-label={`Performance score ${breakdown.score} out of 99`}
      >
        {breakdown.score}
      </button>
      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-52 -translate-x-1/2 rounded-xl border border-[#e8edf5] bg-white px-3 py-2.5 text-left shadow-[0_12px_28px_rgba(15,23,42,0.12)] group-hover:block group-focus-within:block">
        <div className="flex items-baseline justify-between gap-2">
          <p className="m-0 text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-slate-400">
            Performance Score
          </p>
          <p className="m-0 text-sm font-semibold tabular-nums text-[#07111f]">
            {breakdown.score} / 99
          </p>
        </div>
        <dl className="m-0 mt-2 space-y-1.5 text-xs text-slate-600">
          {(
            [
              {
                label: "Earnings",
                value: breakdown.earningsPoints,
                max: 50,
              },
              { label: "Orders", value: breakdown.ordersPoints, max: 20 },
              {
                label: "Repeat customers",
                value: breakdown.repeatPoints,
                max: 15,
              },
              {
                label: "Revenue per customer",
                value: breakdown.avgRevPoints,
                max: 15,
              },
            ] as const
          ).map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3"
            >
              <dt className="m-0">{row.label}</dt>
              <dd className="m-0 font-semibold tabular-nums text-[#07111f]">
                {row.value} / {row.max}
              </dd>
            </div>
          ))}
        </dl>
        <p className="m-0 mt-2 border-t border-[#eef2f7] pt-2 text-[0.65rem] leading-snug text-slate-400">
          Score is relative to campaigns in the selected period.
        </p>
      </div>
    </div>
  );
}

const CampaignPerformanceChart = memo(function CampaignPerformanceChart({
  chartData,
  chartCampaigns,
  chartMetric,
  chartMetricButtons,
  onMetricChange,
  monthFilter,
  monthLabel,
  monthOptions,
  onMonthChange,
  todayMarkerLabel,
  isPending,
}: {
  chartData: Array<Record<string, string | number | null>>;
  chartCampaigns: BusinessTopCampaign[];
  chartMetric: ChartMetric;
  chartMetricButtons: Array<{ id: ChartMetric; label: string }>;
  onMetricChange: (metric: ChartMetric) => void;
  monthFilter: string;
  monthLabel: string;
  monthOptions: Array<{ id: string; label: string }>;
  onMonthChange: (monthKey: string) => void;
  todayMarkerLabel: string | null;
  isPending: boolean;
}) {
  const hoveredSeriesKeyRef = useRef<string | null>(null);
  const [hoveredSeriesKey, setHoveredSeriesKey] = useState<string | null>(null);

  const setHoveredFast = useCallback((key: string | null) => {
    if (hoveredSeriesKeyRef.current === key) return;
    hoveredSeriesKeyRef.current = key;
    setHoveredSeriesKey(key);
  }, []);

  const clearHovered = useCallback(() => setHoveredFast(null), [setHoveredFast]);

  const calendarMonths = useMemo(
    () => monthOptions.filter((option) => option.id !== ACTIVITY_ALL_MONTHS_ID),
    [monthOptions],
  );
  const calendarMonthIndex = calendarMonths.findIndex(
    (option) => option.id === monthFilter,
  );
  const canGoOlder =
    calendarMonthIndex >= 0 && calendarMonthIndex < calendarMonths.length - 1;
  const canGoNewer = calendarMonthIndex > 0;
  const isFullMonthView = monthFilter !== ACTIVITY_ALL_MONTHS_ID;
  const xAxisInterval =
    chartData.length >= 28 ? 4 : chartData.length >= 16 ? 2 : 0;
  const monthInProgress = todayMarkerLabel != null;

  return (
    <div className={`${panelCardClass} overflow-hidden px-4 py-4 sm:px-5`}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 className="m-0 text-[0.95rem] font-semibold text-[#07111f]">
              Campaign Performance
            </h2>
            <p className="m-0 mt-0.5 text-sm text-slate-500">
              {monthInProgress
                ? `Full calendar for ${monthLabel}. Lines stop at today — later days are not $0 yet.`
                : `Full calendar for ${monthLabel} — earnings, orders, and customers.`}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Previous month"
                disabled={!canGoOlder}
                onClick={() => {
                  const next = calendarMonths[calendarMonthIndex + 1];
                  if (next) onMonthChange(next.id);
                }}
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-[#e8edf5] bg-white text-slate-600 transition hover:border-[#c7d7fe] hover:text-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <ActivityMonthCalendarPicker
                value={monthFilter}
                onChange={onMonthChange}
                compact
              />
              <button
                type="button"
                aria-label="Next month"
                disabled={!canGoNewer}
                onClick={() => {
                  const next = calendarMonths[calendarMonthIndex - 1];
                  if (next) onMonthChange(next.id);
                }}
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-[#e8edf5] bg-white text-slate-600 transition hover:border-[#c7d7fe] hover:text-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>

            <div className="flex shrink-0 flex-wrap gap-1 rounded-full border border-[#e8edf5] bg-[#f8fafc] p-1">
              {chartMetricButtons.map((button) => {
                const active = chartMetric === button.id;
                return (
                  <button
                    key={button.id}
                    type="button"
                    onClick={() => onMetricChange(button.id)}
                    className={`cursor-pointer rounded-full px-3.5 py-1.5 text-[0.75rem] font-semibold transition ${
                      active
                        ? "bg-[#1877f2] text-white shadow-[0_4px_12px_rgba(24,119,242,0.25)]"
                        : "text-slate-500 hover:bg-white hover:text-[#1877f2]"
                    }`}
                  >
                    {button.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div
        className="mt-4 w-full min-w-0"
        style={{ height: PERFORMANCE_CHART_HEIGHT_PX }}
      >
        {isPending ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : chartData.length === 0 || chartCampaigns.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl bg-[#f8fafc] text-sm text-slate-400">
            No daily campaign activity in this period
          </div>
        ) : (
          <PerformanceChartMount>
            <ResponsiveContainer
              width="100%"
              height={PERFORMANCE_CHART_HEIGHT_PX}
              minWidth={0}
            >
              <AreaChart
                data={chartData}
                margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
                onMouseLeave={clearHovered}
              >
              <defs>
                {chartCampaigns.map((campaign, index) => {
                  const color = CHART_COLORS[index % CHART_COLORS.length]!;
                  return (
                    <linearGradient
                      key={campaign.campaignId}
                      id={`perf-area-${campaign.campaignId}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid
                strokeDasharray="0"
                stroke="#eef2f7"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                interval={xAxisInterval}
                tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                minTickGap={isFullMonthView ? 18 : 24}
                dy={8}
                padding={{ left: 8, right: 8 }}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(value: number) =>
                  chartMetric === "earnings"
                    ? `$${Math.round(Number(value) / 100)}`
                    : String(Math.round(Number(value) || 0))
                }
              />
              {todayMarkerLabel ? (
                <ReferenceLine
                  x={todayMarkerLabel}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  label={{
                    value: "Today",
                    position: "insideTopRight",
                    fill: "#64748b",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
              ) : null}
              <Tooltip
                shared
                active={hoveredSeriesKey != null}
                isAnimationActive={false}
                animationDuration={0}
                cursor={
                  hoveredSeriesKey
                    ? {
                        stroke: "#cbd5e1",
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                      }
                    : false
                }
                wrapperStyle={{
                  outline: "none",
                  visibility: hoveredSeriesKey ? "visible" : "hidden",
                  pointerEvents: "none",
                }}
                content={
                  <CampaignChartTooltip
                    chartCampaigns={chartCampaigns}
                    chartMetric={chartMetric}
                    hoveredSeriesKey={hoveredSeriesKey}
                  />
                }
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                iconSize={8}
                height={36}
                wrapperStyle={{ paddingTop: 4 }}
                formatter={(value) => {
                  const campaign = chartCampaigns.find(
                    (row) => `c${row.campaignId}` === String(value),
                  );
                  return (
                    formatTitleCase(campaign?.campaignName ?? "") ||
                    campaign?.campaignName ||
                    String(value)
                  );
                }}
              />
              {chartCampaigns.map((campaign, index) => {
                const color = CHART_COLORS[index % CHART_COLORS.length]!;
                const seriesKey = `c${campaign.campaignId}`;
                return (
                  <Area
                    key={campaign.campaignId}
                    type="monotone"
                    dataKey={seriesKey}
                    name={seriesKey}
                    stroke={color}
                    strokeWidth={2.25}
                    fill={`url(#perf-area-${campaign.campaignId})`}
                    fillOpacity={1}
                    connectNulls={false}
                    style={{ pointerEvents: "none" }}
                    dot={(dotProps) => {
                      const raw = (dotProps as { value?: number | string | null })
                        .value;
                      if (raw == null) return null;
                      const value = Number(raw) || 0;
                      if (value <= 0) return null;
                      const cx = Number(
                        (dotProps as { cx?: number }).cx ?? 0,
                      );
                      const cy = Number(
                        (dotProps as { cy?: number }).cy ?? 0,
                      );
                      return (
                        <circle
                          key={`${seriesKey}-${(dotProps as { index?: number }).index ?? 0}`}
                          cx={cx}
                          cy={cy}
                          r={3}
                          fill="#ffffff"
                          stroke={color}
                          strokeWidth={2}
                        />
                      );
                    }}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                );
              })}
              {chartCampaigns.map((campaign) => {
                const seriesKey = `c${campaign.campaignId}`;
                return (
                  <Line
                    key={`hit-${campaign.campaignId}`}
                    type="monotone"
                    dataKey={seriesKey}
                    name={seriesKey}
                    stroke="transparent"
                    strokeWidth={18}
                    connectNulls={false}
                    dot={(dotProps) => {
                      const raw = (dotProps as { value?: number | string | null })
                        .value;
                      if (raw == null) return null;
                      const value = Number(raw) || 0;
                      if (value <= 0) return null;
                      const cx = Number(
                        (dotProps as { cx?: number }).cx ?? 0,
                      );
                      const cy = Number(
                        (dotProps as { cy?: number }).cy ?? 0,
                      );
                      return (
                        <circle
                          key={`hit-dot-${seriesKey}-${(dotProps as { index?: number }).index ?? 0}`}
                          cx={cx}
                          cy={cy}
                          r={12}
                          fill="transparent"
                          stroke="transparent"
                          style={{ cursor: "pointer" }}
                          onMouseEnter={() => setHoveredFast(seriesKey)}
                          onMouseMove={() => setHoveredFast(seriesKey)}
                          onMouseLeave={clearHovered}
                        />
                      );
                    }}
                    activeDot={false}
                    legendType="none"
                    isAnimationActive={false}
                    onMouseEnter={() => setHoveredFast(seriesKey)}
                    onMouseMove={() => setHoveredFast(seriesKey)}
                    onMouseLeave={clearHovered}
                  />
                );
              })}
              </AreaChart>
            </ResponsiveContainer>
          </PerformanceChartMount>
        )}
      </div>
    </div>
  );
});

export function BusinessPerformancePanel({
  businessId,
}: {
  businessId: number;
}) {
  const [monthFilter, setMonthFilter] = useState(currentMonthKey);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [chartMetric, setChartMetric] = useState<ChartMetric>("earnings");

  const monthOptions = useMemo(() => buildActivityMonthFilterOptions(), []);
  const range = useMemo(
    () => resolveActivityMonthRange(monthFilter, monthOptions),
    [monthFilter, monthOptions],
  );

  const monthLabel =
    monthFilter === ACTIVITY_ALL_MONTHS_ID
      ? monthOptions.find((option) => option.id === ACTIVITY_ALL_MONTHS_ID)
          ?.label ?? "All months"
      : formatActivityMonthLabel(monthFilter);

  const query = useQuery({
    queryKey: [
      "business-top-earning-campaigns",
      businessId,
      monthFilter,
      range.from,
      range.to,
    ],
    enabled: Number.isFinite(businessId) && businessId > 0,
    staleTime: 15_000,
    refetchOnMount: "always",
    queryFn: () =>
      getBusinessTopEarningCampaigns(businessId, {
        from: range.from,
        to: range.to,
        limit: 10,
      }),
  });

  useEffect(() => {
    setAlertDismissed(false);
  }, [businessId, monthFilter, query.errorUpdatedAt]);

  const campaigns = query.data?.campaigns ?? [];
  const conversionCampaigns = useMemo(() => {
    const fromApi = query.data?.conversionCampaigns ?? [];
    const byId = new Map(
      campaigns.map((row) => [row.campaignId, row] as const),
    );
    const base =
      fromApi.length > 0
        ? fromApi
        : campaigns.slice(0, 3).map((row) => ({
            campaignId: row.campaignId,
            campaignName: row.campaignName,
            campaignType: row.campaignType,
            imageUrl: row.imageUrl,
            viewCount: row.viewCount,
            signupCount: row.signupCount,
            orderCount: row.orderCount,
          }));

    return base.map((row) => {
      const fallback = byId.get(row.campaignId);
      return {
        ...row,
        viewCount:
          row.viewCount > 0 ? row.viewCount : (fallback?.viewCount ?? 0),
        signupCount:
          row.signupCount > 0 ? row.signupCount : (fallback?.signupCount ?? 0),
        orderCount:
          row.orderCount > 0 ? row.orderCount : (fallback?.orderCount ?? 0),
      };
    });
  }, [campaigns, query.data?.conversionCampaigns]);
  const dailyTotals = query.data?.dailyTotals ?? [];
  const dailyByCampaign = query.data?.dailyByCampaign ?? [];
  const totalEarningsCents = query.data?.totalEarningsCents ?? 0;
  const totalOrderCount = query.data?.totalOrderCount ?? 0;
  const totalUniqueCustomerCount =
    query.data?.totalUniqueCustomerCount ?? 0;
  const previousPeriod = query.data?.previousPeriod ?? null;
  const topCampaign = campaigns[0] ?? null;
  const monthInProgress = monthFilter === currentMonthKey();
  const comparisonLabel =
    monthFilter === ACTIVITY_ALL_MONTHS_ID
      ? "previous period"
      : monthInProgress
        ? "same days last month"
        : "previous month";
  const earningsChange = percentChange(
    totalEarningsCents,
    previousPeriod?.totalEarningsCents,
  );
  const ordersChange = percentChange(
    totalOrderCount,
    previousPeriod?.totalOrderCount,
  );
  const uniqueChange = percentChange(
    totalUniqueCustomerCount,
    previousPeriod?.totalUniqueCustomerCount,
  );
  const errorMessage = query.isError
    ? getApiErrorMessage(query.error, "Could not load performance.")
    : null;

  const chartCampaigns = useMemo(() => campaigns.slice(0, 3), [campaigns]);

  const chartData = useMemo(() => {
    if (chartCampaigns.length === 0) return [];

    const byDayCampaign = new Map<string, number>();
    for (const row of dailyByCampaign) {
      const key =
        chartMetric === "earnings"
          ? row.earningsCents
          : chartMetric === "orders"
            ? row.orderCount
            : row.uniqueCustomerCount;
      byDayCampaign.set(`${row.date}:${row.campaignId}`, key);
    }

    const dayKeys =
      monthFilter !== ACTIVITY_ALL_MONTHS_ID
        ? fullMonthUtcDateKeys(monthFilter)
        : dailyTotals.map((day) => day.date);

    if (dayKeys.length === 0) return [];

    const todayKey = utcTodayDateKey();
    const isCurrentMonth = monthFilter === currentMonthKey();

    return dayKeys.map((date) => {
      const isFutureDay = isCurrentMonth && date > todayKey;
      const point: Record<string, string | number | null> = {
        date,
        label:
          monthFilter !== ACTIVITY_ALL_MONTHS_ID
            ? String(Number(date.slice(8, 10)))
            : formatDayLabel(date),
        fullLabel: formatDayLabel(date),
      };
      for (const campaign of chartCampaigns) {
        point[`c${campaign.campaignId}`] = isFutureDay
          ? null
          : (byDayCampaign.get(`${date}:${campaign.campaignId}`) ?? 0);
      }
      return point;
    });
  }, [
    chartCampaigns,
    chartMetric,
    dailyByCampaign,
    dailyTotals,
    monthFilter,
  ]);

  const todayMarkerLabel =
    monthFilter === currentMonthKey()
      ? String(Number(utcTodayDateKey().slice(8, 10)))
      : null;

  const chartMetricButtons = CHART_METRIC_BUTTONS;

  return (
    <section className="rd-premium w-full" aria-label="Performance">
      <div className="flex flex-col gap-4">
        <header className={`${panelCardClass} px-4 py-4 sm:px-5`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#1877f2]/12 text-[#1877f2]">
                  <ChartColumn className="size-4" strokeWidth={2.25} aria-hidden />
                </span>
                <div>
                  <h1 className="m-0 text-lg font-semibold text-[#07111f]">
                    Performance
                  </h1>
                  <p className="m-0 mt-0.5 text-sm text-slate-500">
                    Highest-earning campaigns for {monthLabel}
                  </p>
                </div>
              </div>
            </div>
            <ActivityMonthCalendarPicker
              value={monthFilter}
              onChange={setMonthFilter}
              compact
            />
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <PerformanceKpiCard
            title="Total Earnings"
            hint={
              monthInProgress
                ? "Paid deal earnings so far this month (add-ons excluded). Percent compares the same days so far vs last month."
                : "Paid deal earnings for the selected month (add-ons excluded). Percent shows change vs the previous month."
            }
            value={
              query.isPending ? "—" : formatCents(totalEarningsCents, "USD")
            }
            icon={CircleDollarSign}
            iconWrapClass="bg-[#EEF4FF]"
            iconClass="text-[#1D4ED8]"
            footer={
              query.isPending ? null : (
                <KpiHealthFooter
                  changePercent={earningsChange}
                  comparisonLabel={comparisonLabel}
                  monthInProgress={monthInProgress}
                  currentValue={totalEarningsCents}
                  previousValue={previousPeriod?.totalEarningsCents}
                />
              )
            }
          />
          <PerformanceKpiCard
            title="Paid Orders"
            hint={
              monthInProgress
                ? "Paid deal payments so far this month. Percent compares the same days so far vs last month."
                : "Number of paid deal payments in the selected month."
            }
            value={query.isPending ? "—" : String(totalOrderCount)}
            icon={Link2}
            iconWrapClass="bg-[#F3E8FF]"
            iconClass="text-[#7C3AED]"
            footer={
              query.isPending ? null : (
                <KpiHealthFooter
                  changePercent={ordersChange}
                  comparisonLabel={comparisonLabel}
                  monthInProgress={monthInProgress}
                  currentValue={totalOrderCount}
                  previousValue={previousPeriod?.totalOrderCount}
                />
              )
            }
          />
          <PerformanceKpiCard
            title="Unique Customers"
            hint={
              monthInProgress
                ? "Distinct paying guests so far this month. Percent compares the same days so far vs last month."
                : "Distinct guests who paid for a deal in the selected month."
            }
            value={
              query.isPending ? "—" : String(totalUniqueCustomerCount)
            }
            icon={Users}
            iconWrapClass="bg-[#ECFDF5]"
            iconClass="text-[#059669]"
            footer={
              query.isPending ? null : (
                <KpiHealthFooter
                  changePercent={uniqueChange}
                  comparisonLabel={comparisonLabel}
                  monthInProgress={monthInProgress}
                  currentValue={totalUniqueCustomerCount}
                  previousValue={previousPeriod?.totalUniqueCustomerCount}
                />
              )
            }
          />
          <PerformanceKpiCard
            title="Top Campaign"
            hint="Highest-earning campaign in the selected month."
            value={
              query.isPending
                ? "—"
                : topCampaign
                  ? formatTitleCase(topCampaign.campaignName) ||
                    topCampaign.campaignName
                  : "No paid campaigns yet"
            }
            icon={Trophy}
            iconWrapClass="bg-[#FFF7ED]"
            iconClass="text-[#EA580C]"
            footer={
              query.isPending ? null : (
                <p className="m-0 text-xs text-slate-500">
                  {topCampaign
                    ? `${formatCents(topCampaign.earningsCents, "USD")} earned`
                    : "—"}
                </p>
              )
            }
          />
        </div>

        <CampaignPerformanceChart
          chartData={chartData}
          chartCampaigns={chartCampaigns}
          chartMetric={chartMetric}
          chartMetricButtons={chartMetricButtons}
          onMetricChange={setChartMetric}
          monthFilter={monthFilter}
          monthLabel={monthLabel}
          monthOptions={monthOptions}
          onMonthChange={setMonthFilter}
          todayMarkerLabel={todayMarkerLabel}
          isPending={query.isPending}
        />

        <ConversionPerformanceSection
          campaigns={conversionCampaigns}
          isPending={query.isPending}
        />

        <div className={`${panelCardClass} overflow-hidden`}>
          <div className="border-b border-[#eef2f7] px-4 py-3 sm:px-5">
            <h2 className="m-0 text-sm font-semibold text-[#07111f]">
              Highest-earning campaigns
            </h2>
            <p className="m-0 mt-0.5 text-xs text-slate-500">
              Orders, customers, repeat rate, and earnings for {monthLabel}
            </p>
          </div>

          {query.isPending ? (
            <div className="space-y-3 p-4 sm:p-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="px-4 py-10 text-center sm:px-5">
              <Megaphone className="mx-auto size-8 text-slate-300" aria-hidden />
              <p className="m-0 mt-3 text-sm font-medium text-slate-600">
                No paid campaign activity for this period.
              </p>
              <p className="m-0 mt-1 text-xs text-slate-400">
                Try another month, or check back after guests pay.
              </p>
              <Link
                href={`/business/${businessId}/dashboard/campaigns`}
                className="mt-4 inline-flex rounded-full bg-[#1877f2] px-4 py-2 text-sm font-semibold text-white no-underline"
              >
                View campaigns
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#eef2f7] bg-[#f8fafc]/80 text-[0.68rem] font-semibold uppercase tracking-[0.06em] text-slate-400">
                      <th className="px-4 py-3 font-semibold sm:px-5" scope="col">
                        Campaign
                      </th>
                      <th
                        className="px-3 py-3 text-center font-semibold"
                        scope="col"
                      >
                        Type
                      </th>
                      <th
                        className="px-3 py-3 text-center font-semibold tabular-nums"
                        scope="col"
                      >
                        Orders
                      </th>
                      <th
                        className="px-3 py-3 text-center font-semibold tabular-nums"
                        scope="col"
                      >
                        Unique customers
                      </th>
                      <th
                        className="px-3 py-3 text-center font-semibold tabular-nums"
                        scope="col"
                      >
                        Repeat rate
                      </th>
                      <th
                        className="px-3 py-3 text-center font-semibold"
                        scope="col"
                      >
                        Performance score
                      </th>
                      <th
                        className="px-4 py-3 text-right font-semibold tabular-nums sm:px-5"
                        scope="col"
                      >
                        Earnings
                      </th>
                      <th className="px-3 py-3 text-right font-semibold" scope="col">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign, index) => {
                      const imageSrc = resolveUploadImageUrl(campaign.imageUrl);
                      const name =
                        formatTitleCase(campaign.campaignName) ||
                        campaign.campaignName;
                      const href = campaignDashboardHref(
                        businessId,
                        campaign.campaignId,
                      );

                      return (
                        <tr
                          key={campaign.campaignId}
                          className="border-b border-[#eef2f7] last:border-b-0 transition hover:bg-[#f8fafc]"
                        >
                          <td className="px-4 py-3.5 sm:px-5">
                            <Link
                              href={href}
                              className="flex items-center gap-3 text-inherit no-underline"
                            >
                              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[0.7rem] font-semibold tabular-nums text-slate-500">
                                {index + 1}
                              </span>
                              {imageSrc ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={imageSrc}
                                  alt=""
                                  width={40}
                                  height={40}
                                  className="size-10 shrink-0 rounded-xl object-cover"
                                  {...spacesImageEagerLoadProps}
                                />
                              ) : (
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1877f2]/10 text-[#1877f2]">
                                  <Megaphone className="size-4" aria-hidden />
                                </span>
                              )}
                              <span className="min-w-0">
                                <span className="truncate text-sm font-semibold text-[#07111f]">
                                  {name}
                                </span>
                                {campaign.price != null ? (
                                  <span className="mt-0.5 block text-xs text-slate-500">
                                    Offer price {formatDollars(campaign.price)}
                                  </span>
                                ) : null}
                              </span>
                            </Link>
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <CampaignBillingBadge
                              campaignType={campaign.campaignType}
                            />
                          </td>
                          <td className="px-3 py-3.5 text-center text-sm tabular-nums text-slate-700">
                            {campaign.orderCount}
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <UniqueCustomersCell campaign={campaign} />
                          </td>
                          <td className="px-3 py-3.5 text-center text-sm tabular-nums text-slate-700">
                            {repeatRatePercent(campaign)}%
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <PerformanceScoreCell
                              campaign={campaign}
                              campaigns={campaigns}
                            />
                          </td>
                          <td className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-[#07111f] sm:px-5">
                            {formatCents(campaign.earningsCents, "USD")}
                          </td>
                          <td className="px-3 py-3.5 text-right">
                            <Link
                              href={href}
                              className="inline-flex items-center gap-0.5 text-[0.75rem] font-semibold text-[#1877f2] no-underline"
                            >
                              Open
                              <ArrowUpRight className="size-3" aria-hidden />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {errorMessage && !alertDismissed ? (
        <OverviewAlertDialog
          open
          message={errorMessage}
          onClose={() => setAlertDismissed(true)}
        />
      ) : null}
    </section>
  );
}
