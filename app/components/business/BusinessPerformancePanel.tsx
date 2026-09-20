"use client";

import { ActivityMonthCalendarPicker } from "@/app/components/business/ActivityMonthCalendarPicker";
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { OVERVIEW_CHART_COLORS } from "@/app/components/campaign/overview/charts/overview-chart-config";
import { Skeleton } from "@/app/components/skeleton";
import {
  ACTIVITY_ALL_MONTHS_ID,
  buildActivityMonthFilterOptions,
  buildActivityMonthKey,
  formatActivityMonthLabel,
  resolveActivityMonthRange,
  resolveCollectiveMonthRange,
} from "@/app/lib/activity-month-filter";
import { campaignDashboardHref } from "@/app/lib/campaign-dashboard-tab";
import { useCountUp } from "@/app/hooks/use-count-up";
import { formatCents, formatDollars } from "@/app/lib/money";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  resolveUploadImageUrl,
  spacesImageEagerLoadProps,
} from "@/app/lib/resolve-upload-image-url";
import {
  getCampaignAddonCounts,
} from "@/app/services/addon-suggestion/get-campaign-addon-counts";
import {
  getBusinessTopEarningCampaigns,
  type BusinessConversionCampaign,
  type BusinessTopCampaign,
} from "@/app/services/funnel-event/get-business-top-campaigns";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Info,
  Layers,
  Link2,
  Megaphone,
  PackageSearch,
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
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_COLORS = [
  OVERVIEW_CHART_COLORS.blue,
  OVERVIEW_CHART_COLORS.green,
  OVERVIEW_CHART_COLORS.orange,
];
const CAMPAIGN_TONES = [
  { soft: "bg-[#e8f2ff]", ink: "text-[#1877f2]", line: "bg-[#1877f2]" },
  { soft: "bg-[#ecfdf5]", ink: "text-[#34a853]", line: "bg-[#34a853]" },
  { soft: "bg-[#fff7ed]", ink: "text-[#f77737]", line: "bg-[#f77737]" },
] as const;
const PERFORMANCE_CHART_HEIGHT_PX = 360;

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

function currentPerformanceMonthKey(): string {
  const now = new Date();
  return buildActivityMonthKey(now.getUTCFullYear(), now.getUTCMonth() + 1);
}

const panelCardClass =
  "rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]";

const campaignImageClass =
  "size-11 shrink-0 rounded-xl bg-[#f8fafc] object-contain p-1 ring-1 ring-[#e8edf5]";

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

function formatChartPointLabel(dateKey: string): string {
  const hourMatch = /^(\d{4}-\d{2}-\d{2})T(\d{2})$/.exec(dateKey);
  if (!hourMatch) return formatDayLabel(dateKey);
  const hour = Number(hourMatch[2]);
  if (!Number.isFinite(hour)) return dateKey;
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12} ${suffix}`;
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
  if (score >= 85) return "bg-[#ecfdf5] text-[#34a853]";
  if (score >= 70) return "bg-[#e8f2ff] text-[#1877f2]";
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
      <p className="m-0 text-xs text-[#34a853]">
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
  const tone = improving ? "text-[#34a853]" : "text-[#e1306c]";
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
  format = "text",
  ready = true,
}: {
  title: string;
  hint: string;
  value: number | string;
  footer?: ReactNode;
  icon: LucideIcon;
  iconWrapClass: string;
  iconClass: string;
  format?: "text" | "number" | "money";
  ready?: boolean;
}) {
  const numericTarget = typeof value === "number" ? value : 0;
  const animated = useCountUp(
    numericTarget,
    ready && format !== "text",
  );
  const display =
    format === "money"
      ? formatCents(Math.round(animated), "USD")
      : format === "number"
        ? String(Math.round(animated))
        : String(value);
  const ariaValue =
    format === "money"
      ? formatCents(Math.round(numericTarget), "USD")
      : format === "number"
        ? String(numericTarget)
        : String(value);

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
            <span title={hint} className="inline-flex cursor-pointer text-slate-300">
              <Info className="size-3.5" aria-hidden />
              <span className="sr-only">{hint}</span>
            </span>
          </p>
          <p
            className="m-0 mt-1 truncate text-xl font-semibold tabular-nums tracking-tight text-[#07111f]"
            aria-label={`${title}: ${ariaValue}`}
          >
            {ready || format === "text" ? display : "—"}
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
  const valueLabel = formatCents(numeric, "USD");
  const dayLabel = String(entry.payload?.fullLabel ?? label ?? "");

  return (
    <div className="min-w-[180px] rounded-xl border border-[#e8edf5] bg-white px-3 py-2.5 shadow-[0_12px_28px_rgba(15,23,42,0.12)]">
      <p className="m-0 mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-slate-400">
        {dayLabel}
      </p>
      <div className="flex items-center gap-2.5">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt=""
            width={44}
            height={44}
            className={campaignImageClass}
            {...spacesImageEagerLoadProps}
          />
        ) : null}
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

function BundleOpportunitiesSection({
  businessId,
  monthFilter,
  monthLabel,
  campaignCount,
  topTips,
  isPending,
}: {
  businessId: number;
  monthFilter: string;
  monthLabel: string;
  campaignCount: number;
  topTips: Array<{
    campaignId?: number;
    campaignName: string;
    imageUrl?: string | null;
    addonName: string;
    timesPurchased: number;
    topStatus?: "clear" | "tied" | "emerging";
  }>;
  isPending: boolean;
}) {
  const pageSize = 3;
  const [page, setPage] = useState(0);
  const detailsHref = `/business/${businessId}/dashboard/performance/bundle-opportunities?month=${encodeURIComponent(monthFilter)}`;

  const tipHref = (campaignId?: number) =>
    campaignId != null && campaignId > 0
      ? `${detailsHref}&campaignId=${encodeURIComponent(String(campaignId))}`
      : detailsHref;

  const totalPages = Math.max(1, Math.ceil(topTips.length / pageSize));

  useEffect(() => {
    setPage(0);
  }, [businessId, monthFilter, topTips.length]);

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  const pageTips = useMemo(() => {
    const start = page * pageSize;
    return topTips.slice(start, start + pageSize);
  }, [page, topTips]);

  if (isPending) {
    return (
      <div className={`${panelCardClass} px-4 py-4 sm:px-5`}>
        <Skeleton className="h-5 w-48 rounded-md" />
        <Skeleton className="mt-2 h-4 w-64 rounded-md" />
        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-[7.5rem] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${panelCardClass} px-4 py-4 sm:px-5`}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#1877f2]/10 text-[#1877f2]">
              <Layers className="size-3.5" strokeWidth={2.25} aria-hidden />
            </span>
            <h2 className="m-0 text-[0.95rem] font-semibold text-[#07111f]">
              Bundle opportunities
            </h2>
            {campaignCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f2ff] px-2 py-0.5 text-[0.65rem] font-semibold tabular-nums text-[#1877f2]">
                <Megaphone className="size-3" aria-hidden />
                {campaignCount} campaign{campaignCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
          <p className="m-0 mt-1 text-sm text-slate-500">
            Add-ons guests buy most often with each deal in {monthLabel}
          </p>
        </div>
        {totalPages > 1 ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Previous bundle opportunities page"
              disabled={page <= 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-[#e8edf5] bg-white text-slate-600 transition hover:border-[#c7d7fe] hover:text-[#1877f2] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <span className="min-w-[3.5rem] text-center text-xs tabular-nums text-slate-400">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              aria-label="Next bundle opportunities page"
              disabled={page >= totalPages - 1}
              onClick={() =>
                setPage((current) => Math.min(totalPages - 1, current + 1))
              }
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-[#e8edf5] bg-white text-slate-600 transition hover:border-[#c7d7fe] hover:text-[#1877f2] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>

      {campaignCount === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-[#dbe3ef] bg-[#f8fafc] px-4 py-8 text-center">
          <PackageSearch
            className="mx-auto size-7 text-slate-300"
            strokeWidth={1.75}
            aria-hidden
          />
          <p className="m-0 mt-3 text-sm font-semibold text-slate-600">
            No data found
          </p>
          <p className="m-0 mt-1 text-xs text-slate-400">
            Bundle tips appear after guests redeem deals with add-ons in this
            period.
          </p>
        </div>
      ) : (
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {pageTips.map((tip, index) => {
            const globalIndex = page * pageSize + index;
            const tone = CAMPAIGN_TONES[globalIndex % CAMPAIGN_TONES.length]!;
            const campaignLabel =
              formatTitleCase(tip.campaignName) || tip.campaignName;
            const addonLabel =
              formatTitleCase(tip.addonName) || tip.addonName;
            const topStatus = tip.topStatus ?? "emerging";
            const imageSrc = resolveUploadImageUrl(tip.imageUrl ?? null);

            return (
              <div
                key={`${tip.campaignName}:${tip.addonName}:${globalIndex}`}
                className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#e8edf5] bg-white p-4"
              >
                <span className={`mb-3 block h-1 w-10 rounded-full ${tone.line}`} aria-hidden />
                <div className="flex min-w-0 items-center gap-3">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt=""
                      width={44}
                      height={44}
                      className={campaignImageClass}
                      {...spacesImageEagerLoadProps}
                    />
                  ) : null}
                  <div className="min-w-0">
                    <p className="m-0 truncate text-sm font-semibold text-[#07111f]">
                      {campaignLabel}
                    </p>
                    <p className="m-0 mt-0.5 truncate text-xs text-slate-500">
                      {topStatus === "tied" ? "Tied add-on" : "Pair with"}{" "}
                      <span className="font-medium text-[#07111f]">
                        {addonLabel}
                      </span>
                    </p>
                  </div>
                </div>
                <p className="m-0 mt-4 text-sm text-slate-500">
                  <span className={`font-semibold tabular-nums ${tone.ink}`}>
                    {tip.timesPurchased}
                  </span>{" "}
                  {tip.timesPurchased === 1 ? "time" : "times"} together
                </p>
                <Link
                  href={tipHref(tip.campaignId)}
                  className={`mt-3 inline-flex items-center gap-1 text-sm font-semibold no-underline ${tone.ink}`}
                >
                  View details
                  <ArrowRight className="size-3.5" strokeWidth={2.25} aria-hidden />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ConversionPerformanceSection({
  campaigns,
  isPending,
  monthLabel,
  monthInProgress,
}: {
  campaigns: BusinessConversionCampaign[];
  isPending: boolean;
  monthLabel: string;
  monthInProgress: boolean;
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
          How often guests who view a deal go on to place a paid order, for your
          top 3 performing campaigns in {monthLabel}
          {monthInProgress ? " so far" : ""}.
        </p>
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {campaigns.map((campaign, index) => {
          const name =
            formatTitleCase(campaign.campaignName) || campaign.campaignName;
          const tone = CAMPAIGN_TONES[index % CAMPAIGN_TONES.length]!;
          const isBest = campaign.campaignId === bestCampaignId;
          const rateLabel = formatConversionRate(
            campaign.viewCount,
            campaign.orderCount,
          );
          const hasViews = campaign.viewCount > 0;

          return (
            <div
              key={campaign.campaignId}
              className="overflow-hidden rounded-xl border border-[#e8edf5] bg-white px-3.5 py-3"
            >
              <span className={`mb-2 block h-1 w-10 rounded-full ${tone.line}`} aria-hidden />
              <div className="flex items-start justify-between gap-2">
                <p className="m-0 truncate text-sm font-semibold text-[#07111f]">
                  {name}
                </p>
                {isBest ? (
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${tone.soft} ${tone.ink}`}>
                    Best converter
                  </span>
                ) : null}
              </div>

              <p className={`m-0 mt-2 text-xl font-semibold tabular-nums tracking-tight ${tone.ink}`}>
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
  businessId,
  chartData,
  chartCampaigns,
  monthFilter,
  monthLabel,
  todayMarkerLabel,
  isPending,
}: {
  businessId: number;
  chartData: Array<Record<string, string | number | null>>;
  chartCampaigns: BusinessTopCampaign[];
  monthFilter: string;
  monthLabel: string;
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

  const isFullMonthView = monthFilter !== ACTIVITY_ALL_MONTHS_ID;
  const xAxisInterval =
    chartData.length >= 28 ? 4 : chartData.length >= 16 ? 2 : 0;

  return (
    <div className={`${panelCardClass} overflow-hidden px-4 py-4 sm:px-5`}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#1877f2]/10 text-[#1877f2]">
                <ChartColumn className="size-3.5" strokeWidth={2.25} aria-hidden />
              </span>
              <h2 className="m-0 text-[0.95rem] font-semibold text-[#07111f]">
                Campaign Performance
              </h2>
              {chartCampaigns.length > 0 ? (
                <span className="rounded-full bg-[#e8f2ff] px-2 py-0.5 text-[0.65rem] font-semibold text-[#1877f2]">
                  Top 3
                </span>
              ) : null}
            </div>
            <p className="m-0 mt-1 text-sm text-slate-500">
              {`Top 3 performing campaigns in ${monthLabel}.`}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <Link
              href={`/business/${businessId}/dashboard/campaigns`}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#dbe7ff] bg-white px-3 text-[0.75rem] font-semibold text-[#1877f2] no-underline shadow-[0_4px_12px_rgba(15,23,42,0.04)] transition hover:border-[#1877f2]/40 hover:bg-[#e8f2ff]"
            >
              View all campaigns
              <ArrowRight className="size-3.5" strokeWidth={2.25} aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      <div
        className="mt-4 w-full min-w-0 rounded-2xl bg-[linear-gradient(180deg,#fbfdff_0%,#f8fafc_100%)] p-2 sm:p-3"
        style={{ height: PERFORMANCE_CHART_HEIGHT_PX + 24 }}
      >
        {isPending ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : chartData.length === 0 || chartCampaigns.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-xl text-center">
            <ChartColumn className="size-8 text-slate-300" aria-hidden />
            <p className="m-0 mt-2 text-sm font-medium text-slate-500">
              No daily campaign activity in this period
            </p>
            <p className="m-0 mt-1 text-xs text-slate-400">
              Trends appear after campaigns get orders or visits.
            </p>
          </div>
        ) : (
          <PerformanceChartMount>
            <ResponsiveContainer
              width="100%"
              height={PERFORMANCE_CHART_HEIGHT_PX}
              minWidth={0}
            >
              <LineChart
                data={chartData}
                margin={{ top: 16, right: 14, left: 2, bottom: 4 }}
                onMouseLeave={clearHovered}
              >
              <CartesianGrid
                strokeDasharray="3 6"
                stroke="#e2e8f0"
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
                tickFormatter={(value: string) =>
                  value.trim() ? value : ""
                }
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(value: number) =>
                  `$${Math.round(Number(value) / 100)}`
                }
              />
              {todayMarkerLabel ? (
                <ReferenceLine
                  x={todayMarkerLabel}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  strokeWidth={1.25}
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
                        stroke: "#94a3b8",
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
                    hoveredSeriesKey={hoveredSeriesKey}
                  />
                }
              />
              {chartCampaigns.map((campaign, index) => {
                const color = CHART_COLORS[index % CHART_COLORS.length]!;
                const seriesKey = `c${campaign.campaignId}`;
                const isActive =
                  hoveredSeriesKey == null || hoveredSeriesKey === seriesKey;
                return (
                  <Line
                    key={campaign.campaignId}
                    type="monotone"
                    dataKey={seriesKey}
                    name={seriesKey}
                    stroke={color}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    strokeOpacity={isActive ? 1 : 0.35}
                    connectNulls={false}
                    style={{ pointerEvents: "none" }}
                    legendType="none"
                    dot={(dotProps) => {
                      const raw = (dotProps as { value?: number | string | null })
                        .value;
                      if (raw == null) return null;
                      const value = Number(raw) || 0;
                      if (value <= 0) return null;
                      if (!isActive) return null;
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
                          r={hoveredSeriesKey === seriesKey ? 4 : 3}
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
              </LineChart>
            </ResponsiveContainer>
          </PerformanceChartMount>
        )}
      </div>

      {chartCampaigns.length > 0 && !isPending ? (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {chartCampaigns.map((campaign, index) => {
            const color = CHART_COLORS[index % CHART_COLORS.length]!;
            const seriesKey = `c${campaign.campaignId}`;
            const name =
              formatTitleCase(campaign.campaignName) || campaign.campaignName;
            const isActive =
              hoveredSeriesKey == null || hoveredSeriesKey === seriesKey;
            return (
              <button
                key={campaign.campaignId}
                type="button"
                onMouseEnter={() => setHoveredFast(seriesKey)}
                onMouseLeave={clearHovered}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.7rem] font-medium transition ${
                  isActive
                    ? "border-[#dbe7ff] bg-white text-[#07111f] shadow-[0_4px_12px_rgba(15,23,42,0.04)]"
                    : "border-transparent bg-transparent text-slate-400"
                }`}
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <span className="max-w-[10rem] truncate">{name}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
});

export function BusinessPerformancePanel({
  businessId,
}: {
  businessId: number;
}) {
  const [monthFilter, setMonthFilter] = useState(currentPerformanceMonthKey);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const monthOptions = useMemo(() => buildActivityMonthFilterOptions(), []);
  const monthRange = useMemo(() => {
    if (monthFilter === ACTIVITY_ALL_MONTHS_ID) {
      return {
        ...resolveActivityMonthRange(monthFilter, monthOptions),
        inProgress: false,
      };
    }
    return resolveCollectiveMonthRange(`${monthFilter}-01`);
  }, [monthFilter, monthOptions]);

  const monthName =
    monthFilter === ACTIVITY_ALL_MONTHS_ID
      ? monthOptions.find((option) => option.id === ACTIVITY_ALL_MONTHS_ID)
          ?.label ?? "All months"
      : formatActivityMonthLabel(monthFilter);
  const periodLabel = monthRange.inProgress ? `${monthName} so far` : monthName;

  const query = useQuery({
    queryKey: [
      "business-top-earning-campaigns",
      businessId,
      monthFilter,
      monthRange.from,
      monthRange.to,
    ],
    enabled: Number.isFinite(businessId) && businessId > 0,
    staleTime: 15_000,
    refetchOnMount: "always",
    queryFn: () =>
      getBusinessTopEarningCampaigns(businessId, {
        from: monthRange.from,
        to: monthRange.to,
        limit: 3,
      }),
  });

  const addonCountsQuery = useQuery({
    queryKey: [
      "business-addon-counts",
      businessId,
      monthRange.from,
      monthRange.to,
    ],
    enabled: Number.isFinite(businessId) && businessId > 0,
    staleTime: 15_000,
    refetchOnMount: "always",
    queryFn: () =>
      getCampaignAddonCounts(businessId, {
        from: monthRange.from,
        to: monthRange.to,
        limit: 3,
      }),
  });

  useEffect(() => {
    setAlertDismissed(false);
  }, [businessId, monthFilter, query.errorUpdatedAt]);

  const campaigns = query.data?.campaigns ?? [];
  const addonCountCampaigns = addonCountsQuery.data?.campaigns ?? [];
  const campaignsWithAddonCounts = useMemo(
    () =>
      addonCountCampaigns.filter((campaign) => campaign.addons.length > 0),
    [addonCountCampaigns],
  );
  const bundlePreviewTips = useMemo(() => {
    const imageByCampaignId = new Map(
      campaigns.map((campaign) => [campaign.campaignId, campaign.imageUrl] as const),
    );
    const tips: Array<{
      campaignId: number;
      campaignName: string;
      imageUrl: string | null;
      addonName: string;
      timesPurchased: number;
      topStatus: "clear" | "tied" | "emerging";
    }> = [];
    for (const campaign of campaignsWithAddonCounts) {
      const top = campaign.addons[0];
      if (!top) continue;
      const storedImage =
        campaign.imageUrl?.trim() ||
        imageByCampaignId.get(campaign.campaignId)?.trim() ||
        null;
      tips.push({
        campaignId: campaign.campaignId,
        campaignName: campaign.campaignName,
        imageUrl: storedImage,
        addonName: top.name,
        timesPurchased: top.times,
        topStatus: campaign.topStatus ?? "emerging",
      });
    }
    return tips;
  }, [campaigns, campaignsWithAddonCounts]);
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
  const dailyByCampaign = query.data?.dailyByCampaign ?? [];
  const totalEarningsCents = query.data?.totalEarningsCents ?? 0;
  const totalOrderCount = query.data?.totalOrderCount ?? 0;
  const totalUniqueCustomerCount =
    query.data?.totalUniqueCustomerCount ?? 0;
  const previousPeriod = query.data?.previousPeriod ?? null;
  const topCampaign = campaigns[0] ?? null;
  const comparisonLabel = "previous month";
  const monthHint = monthRange.inProgress
    ? "Added up from the 1st of this month through today, then compared with those same days last month."
    : "Added up for the whole month, then compared with the full previous month.";
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
      const day = row.date.slice(0, 10);
      const key = row.earningsCents;
      byDayCampaign.set(`${day}:${row.campaignId}`, key);
    }

    const pointKeys = [...byDayCampaign.keys()]
      .map((key) => key.slice(0, 10))
      .filter((day, index, days) => days.indexOf(day) === index)
      .sort();

    if (pointKeys.length === 0) return [];

    return pointKeys.map((date) => {
      const point: Record<string, string | number | null> = {
        date,
        label: formatChartPointLabel(date),
        fullLabel: formatChartPointLabel(date),
      };
      for (const campaign of chartCampaigns) {
        point[`c${campaign.campaignId}`] = byDayCampaign.get(
          `${date}:${campaign.campaignId}`,
        ) ?? 0;
      }
      return point;
    });
  }, [
    chartCampaigns,
    dailyByCampaign,
  ]);

  const todayMarkerLabel = null;

  return (
    <section className="rd-premium w-full" aria-label="Performance">
      <div className="flex flex-col gap-4">
        <header className={`${panelCardClass} px-4 py-4 sm:px-5`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <Link
                href={`/business/${businessId}/dashboard`}
                className="mb-2 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#1877f2] no-underline"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                Back to dashboard
              </Link>
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#1877f2]/12 text-[#1877f2]">
                  <ChartColumn className="size-4" strokeWidth={2.25} aria-hidden />
                </span>
                <div>
                  <h1 className="m-0 text-lg font-semibold text-[#07111f]">
                    Performance
                  </h1>
                  <p className="m-0 mt-0.5 text-sm text-slate-500">
                    Top 3 performing campaigns in {periodLabel}
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
            hint={`Paid deal earnings for the month (add-ons excluded). ${monthHint}`}
            value={totalEarningsCents}
            format="money"
            ready={!query.isPending}
            icon={CircleDollarSign}
            iconWrapClass="bg-[#e8f2ff]"
            iconClass="text-[#1877f2]"
            footer={
              query.isPending ? null : (
                <KpiHealthFooter
                  changePercent={earningsChange}
                  comparisonLabel={comparisonLabel}
                  monthInProgress={monthRange.inProgress}
                  currentValue={totalEarningsCents}
                  previousValue={previousPeriod?.totalEarningsCents}
                />
              )
            }
          />
          <PerformanceKpiCard
            title="Paid Orders"
            hint={`Paid deal payments for the month. ${monthHint}`}
            value={totalOrderCount}
            format="number"
            ready={!query.isPending}
            icon={Link2}
            iconWrapClass="bg-[#fff7ed]"
            iconClass="text-[#f77737]"
            footer={
              query.isPending ? null : (
                <KpiHealthFooter
                  changePercent={ordersChange}
                  comparisonLabel={comparisonLabel}
                  monthInProgress={monthRange.inProgress}
                  currentValue={totalOrderCount}
                  previousValue={previousPeriod?.totalOrderCount}
                />
              )
            }
          />
          <PerformanceKpiCard
            title="Unique Customers"
            hint={`Different guests who paid during the month. ${monthHint}`}
            value={totalUniqueCustomerCount}
            format="number"
            ready={!query.isPending}
            icon={Users}
            iconWrapClass="bg-[#fdf2f8]"
            iconClass="text-[#e1306c]"
            footer={
              query.isPending ? null : (
                <KpiHealthFooter
                  changePercent={uniqueChange}
                  comparisonLabel={comparisonLabel}
                  monthInProgress={monthRange.inProgress}
                  currentValue={totalUniqueCustomerCount}
                  previousValue={previousPeriod?.totalUniqueCustomerCount}
                />
              )
            }
          />
          <PerformanceKpiCard
            title="Top Campaign"
            hint="Highest-earning campaign for the selected month."
            value={
              query.isPending
                ? "—"
                : topCampaign
                  ? formatTitleCase(topCampaign.campaignName) ||
                    topCampaign.campaignName
                  : "No paid campaigns yet"
            }
            icon={Trophy}
            iconWrapClass="bg-[#ecfdf5]"
            iconClass="text-[#34a853]"
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
          businessId={businessId}
          chartData={chartData}
          chartCampaigns={chartCampaigns}
          monthFilter={monthFilter}
          monthLabel={periodLabel}
          todayMarkerLabel={todayMarkerLabel}
          isPending={query.isPending}
        />

        <ConversionPerformanceSection
          campaigns={conversionCampaigns}
          isPending={query.isPending}
          monthLabel={monthName}
          monthInProgress={monthRange.inProgress}
        />

        <BundleOpportunitiesSection
          businessId={businessId}
          monthFilter={monthFilter}
          monthLabel={periodLabel}
          campaignCount={campaignsWithAddonCounts.length}
          topTips={bundlePreviewTips}
          isPending={addonCountsQuery.isPending}
        />

        <div className={`${panelCardClass} overflow-hidden`}>
          <div className="border-b border-[#eef2f7] px-4 py-3 sm:px-5">
            <h2 className="m-0 text-sm font-semibold text-[#07111f]">
              Top 3 performing campaigns
            </h2>
            <p className="m-0 mt-0.5 text-xs text-slate-500">
              Orders, customers, repeat rate, and earnings in {periodLabel}
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
                    {campaigns.map((campaign) => {
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
                              className="flex cursor-pointer items-center gap-3 text-inherit no-underline"
                            >
                              {imageSrc ? (
                                <img
                                  src={imageSrc}
                                  alt=""
                                  width={44}
                                  height={44}
                                  className={campaignImageClass}
                                  {...spacesImageEagerLoadProps}
                                />
                              ) : null}
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
                              className="inline-flex cursor-pointer items-center gap-0.5 text-[0.75rem] font-semibold text-[#1877f2] no-underline"
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
