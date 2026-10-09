"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  ImageIcon,
  Link2,
  Loader2,
  Megaphone,
  MoreHorizontal,
  MousePointerClick,
  Pause,
  Pencil,
  Play,
  Plus,
  SlidersHorizontal,
  RefreshCw,
  Search,
  Target,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { isAdminUser } from "@/app/lib/is-admin-user";
import {
  adsCampaignSelectDotClass,
  adsCampaignsTable,
} from "@/app/components/campaign/ads-campaigns-table-styles";
import {
  FacebookLogo,
  InstagramLogo,
  MetaLogo,
} from "@/app/components/landing/LandingIntegrationLogos";
import {
  formatMetaActionType,
  formatMetaCount,
  formatMetaDeliveryStatus,
  formatMetaFrequency,
  formatMetaPercent,
  formatMetaRateMoney,
  formatMetaSpend,
  pickPrimaryMetaAction,
} from "@/app/lib/format-meta-ads";
import { AdsDatePeriodPicker } from "@/app/components/campaign/AdsDatePeriodPicker";
import { adsInsightsPeriodsMatch } from "@/app/lib/ads-insights-period";
import type {
  FacebookAdBreakdownRow,
  FacebookAdCampaign,
  FacebookAdCampaignStats,
  FacebookAdDailyInsight,
} from "@/app/services/facebook/get-facebook-ad-campaign-stats";

type MetaAdsAnalyticsDashboardProps = {
  stats: FacebookAdCampaignStats;
  insightsLoading?: boolean;
  adsManagerUrl: string;
  onCreateCampaign: () => void;
  canCreateCampaign?: boolean;
  onRefresh: () => void;
  period: string;
  onPeriodChange: (period: string) => void;
  onDeleteCampaign: (campaign: FacebookAdCampaign) => void;
  onToggleCampaignStatus?: (
    campaign: FacebookAdCampaign,
    status: "ACTIVE" | "PAUSED",
  ) => void;
  onEditCampaign?: (
    campaign: FacebookAdCampaign,
    updates: {
      name: string;
      status: "ACTIVE" | "PAUSED";
      dailyBudget: number;
    },
  ) => void;
  onOpenInBuilder?: (campaign: FacebookAdCampaign) => void;
  canDeleteCampaign?: boolean;
  canManageCampaign?: boolean;
  deletingCampaignId: string | null;
  statusUpdatingId?: string | null;
  editingCampaignId?: string | null;
  errorMessage?: string | null;
  campaignSearch: string;
  onCampaignSearchChange: (query: string) => void;
  onCampaignPageChange: (page: number) => void;
};

const INSTAGRAM_GRADIENT_ID = "meta-placement-instagram-gradient";
const INSTAGRAM_GRADIENT_CSS =
  "linear-gradient(45deg, #405DE6 0%, #833AB4 25%, #FD1D1D 50%, #F77737 75%, #FCAF45 100%)";

function placementFill(name: string, index: number): string {
  const key = name.trim().toLowerCase().replace(/_/g, " ");
  if (key.includes("instagram")) return `url(#${INSTAGRAM_GRADIENT_ID})`;
  if (key.includes("facebook")) return "#1877F2";
  if (key.includes("thread")) return "#000000";
  if (key.includes("messenger")) return "#00B2FF";
  if (key.includes("audience")) return "#94a3b8";
  const fallback = ["#1877F2", "#833AB4", "#F77737", "#94a3b8", "#10b981"];
  return fallback[index % fallback.length];
}

function placementLegendBackground(name: string, index: number): string {
  const key = name.trim().toLowerCase().replace(/_/g, " ");
  if (key.includes("instagram")) return INSTAGRAM_GRADIENT_CSS;
  if (key.includes("thread")) return "#000000";
  return placementFill(name, index);
}

function ThreadsLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden role="img">
      <rect width="24" height="24" rx="6" fill="#000000" />
      <path
        fill="#FFFFFF"
        transform="translate(4.2 4.2) scale(0.65)"
        d="M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z"
      />
    </svg>
  );
}

function placementDisplayName(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/_/g, " ");
  if (key.includes("facebook")) return "Facebook";
  if (key.includes("instagram")) return "Instagram";
  if (key.includes("thread")) return "Threads";
  if (key.includes("messenger")) return "Messenger";
  if (key.includes("audience")) return "Audience Network";
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function PlacementBrandIcon({ name }: { name: string }) {
  const key = name.trim().toLowerCase().replace(/_/g, " ");
  if (key.includes("facebook")) {
    return <FacebookLogo className="size-5" />;
  }
  if (key.includes("instagram")) {
    return <InstagramLogo className="size-5" idSuffix="placement" />;
  }
  if (key.includes("thread")) {
    return <ThreadsLogo className="size-5" />;
  }
  return (
    <span className="flex size-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
      {placementDisplayName(name).slice(0, 1)}
    </span>
  );
}

function parseNum(raw: string | null | undefined, asFloat = false): number {
  if (raw == null || raw.trim() === "") return 0;
  const n = asFloat ? Number.parseFloat(raw) : Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

function statusBadgeClass(status: string | null | undefined): string {
  const normalized = status?.toUpperCase() ?? "";
  if (normalized === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (normalized === "PAUSED" || normalized.includes("PAUSED")) {
    return "bg-amber-50 text-amber-800 ring-amber-200";
  }
  return "bg-slate-50 text-slate-700 ring-slate-200";
}

function isMetaCampaignActive(status: string | null | undefined): boolean {
  const normalized = status?.toUpperCase() ?? "";
  return normalized === "ACTIVE" || normalized === "ENABLED";
}

function isMetaCampaignPaused(status: string | null | undefined): boolean {
  const normalized = status?.toUpperCase() ?? "";
  return normalized === "PAUSED" || normalized.includes("PAUSED");
}

function metaDailyBudgetDollars(raw: string | null | undefined): string {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n) || n <= 0) return "20";
  return (n / 100).toFixed(n % 100 === 0 ? 0 : 2);
}

function formatDayLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(d);
}

function buildDailyChartSeries(
  rows: FacebookAdDailyInsight[],
  axisDates?: string[],
) {
  const byDate = new Map(
    rows
      .filter((row) => Boolean(row.date?.trim()))
      .map((row) => [row.date.trim(), row] as const),
  );
  const dates =
    axisDates && axisDates.length > 0
      ? axisDates
      : Array.from(byDate.keys()).sort((a, b) => a.localeCompare(b));

  return dates.map((date) => {
    const row = byDate.get(date);
    return {
      label: formatDayLabel(date),
      spend: parseNum(row?.spend, true),
      impressions: parseNum(row?.impressions),
      clicks: parseNum(row?.clicks),
    };
  });
}

function breakdownShares(rows: FacebookAdBreakdownRow[] | undefined) {
  const mapped = (rows ?? [])
    .map((row) => ({
      name: row.key,
      value: parseNum(row.impressions),
      spend: parseNum(row.spend, true),
    }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = mapped.reduce((sum, row) => sum + row.value, 0);
  return {
    total,
    rows: mapped.map((row) => ({
      ...row,
      pct: total > 0 ? (row.value / total) * 100 : 0,
    })),
  };
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
  statusText,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint?: string;
  tone: "blue" | "violet" | "emerald" | "amber" | "zinc";
  statusText?: string | null;
}) {
  const tones = {
    blue: "bg-[#1877f2]",
    violet: "bg-[#7C3AED]",
    emerald: "bg-[#059669]",
    amber: "bg-[#EA580C]",
    zinc: "bg-[#0F172A]",
  } as const;

  return (
    <div className="rounded-2xl border border-[#EEF2F7] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-2xl text-white ${tones[tone]}`}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums text-[#0F172A]">
            {value}
          </p>
          {statusText ? (
            <p
              className={`mt-1 text-xs font-bold uppercase tracking-wide ${
                statusText.toUpperCase().includes("ACTIVE") &&
                !statusText.toUpperCase().includes("INACTIVE")
                  ? "text-emerald-600"
                  : "text-[#7C3AED]"
              }`}
            >
              {statusText}
            </p>
          ) : hint ? (
            <p className="mt-1 text-xs font-medium text-slate-500">{hint}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
  className = "",
  showChevron = false,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  showChevron?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border border-[#EEF2F7] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)] sm:p-5 ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="m-0 inline-flex items-center gap-1 text-base font-bold tracking-tight text-[#0F172A]">
          {title}
          {showChevron ? (
            <ChevronRight className="size-4 text-slate-400" aria-hidden />
          ) : null}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyChartNote({ message }: { message: string }) {
  return (
    <div className="flex size-full min-h-[12rem] items-center justify-center rounded-xl border border-dashed border-[#e8edf5] bg-[#f8fafc] px-4 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function ChartMount({
  height,
  children,
}: {
  height: number;
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  if (!ready) {
    return (
      <div
        className="w-full min-w-0 animate-pulse rounded-xl bg-[#f1f5f9]"
        style={{ height }}
        aria-hidden
      />
    );
  }

  return <>{children}</>;
}

export function MetaAdsAnalyticsDashboard({
  stats,
  insightsLoading,
  adsManagerUrl,
  onCreateCampaign,
  canCreateCampaign = true,
  onRefresh,
  period,
  onPeriodChange,
  onDeleteCampaign,
  onToggleCampaignStatus,
  onEditCampaign,
  onOpenInBuilder,
  canDeleteCampaign = true,
  canManageCampaign = true,
  deletingCampaignId,
  statusUpdatingId = null,
  editingCampaignId = null,
  errorMessage,
  campaignSearch,
  onCampaignSearchChange,
  onCampaignPageChange,
}: MetaAdsAnalyticsDashboardProps) {
  const canOpenAdsManager = isAdminUser();
  const campaigns = stats.campaigns;
  const currency = stats.currency;
  const pagination = stats.pagination;
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null,
  );
  const [selectedCampaignSnapshot, setSelectedCampaignSnapshot] =
    useState<FacebookAdCampaign | null>(null);
  const bootstrapping = Boolean(insightsLoading && campaigns.length === 0);
  const periodReady = adsInsightsPeriodsMatch(period, stats.datePreset ?? "");
  const metricsRefreshing = Boolean(
    insightsLoading || (!bootstrapping && !periodReady),
  );
  const softRefreshing = Boolean(metricsRefreshing && !bootstrapping);
  const metricsSoftClass = softRefreshing
    ? "pointer-events-none opacity-45 transition-opacity duration-200"
    : "transition-opacity duration-200";
  const [editCampaign, setEditCampaign] = useState<FacebookAdCampaign | null>(
    null,
  );
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "PAUSED">("PAUSED");
  const [editBudget, setEditBudget] = useState("");

  const selectedCampaign = useMemo(() => {
    if (!selectedCampaignId) return null;
    return (
      campaigns.find((c) => c.id === selectedCampaignId) ??
      (selectedCampaignSnapshot?.id === selectedCampaignId
        ? selectedCampaignSnapshot
        : null)
    );
  }, [campaigns, selectedCampaignId, selectedCampaignSnapshot]);

  useEffect(() => {
    if (campaigns.length === 0) {
      setSelectedCampaignId(null);
      setSelectedCampaignSnapshot(null);
      return;
    }

    if (selectedCampaignId) {
      const fromPage = campaigns.find((c) => c.id === selectedCampaignId);
      if (!fromPage) return;
      setSelectedCampaignSnapshot((prev) => {
        const prevDailyLen = prev?.dailyInsights?.length ?? -1;
        const nextDailyLen = fromPage.dailyInsights?.length ?? -1;
        if (
          prev?.id === fromPage.id &&
          prev.insights?.spend === fromPage.insights?.spend &&
          prev.insights?.impressions === fromPage.insights?.impressions &&
          prev.insights?.clicks === fromPage.insights?.clicks &&
          prev.effectiveStatus === fromPage.effectiveStatus &&
          prevDailyLen === nextDailyLen
        ) {
          return prev;
        }
        return fromPage;
      });
      return;
    }

    const first = campaigns[0];
    if (!first) return;
    setSelectedCampaignId(first.id);
    setSelectedCampaignSnapshot(first);
  }, [campaigns, selectedCampaignId]);

  const activeCount = selectedCampaign
    ? selectedCampaign.effectiveStatus?.toUpperCase() === "ACTIVE"
      ? 1
      : 0
    : 0;
  const totalCampaignCount = selectedCampaign ? 1 : 0;

  const avgCtr = selectedCampaign
    ? selectedCampaign.insights?.ctr != null &&
      selectedCampaign.insights.ctr.trim() !== ""
      ? parseNum(selectedCampaign.insights.ctr, true)
      : null
    : null;
  const avgCpc = selectedCampaign
    ? selectedCampaign.insights?.cpc != null &&
      selectedCampaign.insights.cpc.trim() !== ""
      ? parseNum(selectedCampaign.insights.cpc, true)
      : null
    : null;
  const avgCpm = selectedCampaign
    ? selectedCampaign.insights?.cpm != null &&
      selectedCampaign.insights.cpm.trim() !== ""
      ? parseNum(selectedCampaign.insights.cpm, true)
      : null
    : null;
  const avgFrequency = selectedCampaign
    ? selectedCampaign.insights?.frequency != null &&
      selectedCampaign.insights.frequency.trim() !== ""
      ? parseNum(selectedCampaign.insights.frequency, true)
      : null
    : null;

  const primaryAcross = useMemo(() => {
    if (!selectedCampaign) return null;
    const primary = pickPrimaryMetaAction(
      selectedCampaign.insights?.actions ?? [],
    );
    if (!primary) return null;
    const costRow = selectedCampaign.insights?.costPerActionType?.find(
      (row) =>
        row.actionType.trim().toLowerCase() ===
        primary.actionType.trim().toLowerCase(),
    );
    return {
      ...primary,
      cost:
        costRow?.value != null && costRow.value.trim() !== ""
          ? parseNum(costRow.value, true)
          : null,
    };
  }, [selectedCampaign]);

  const dailySeries = useMemo(() => {
    if (!selectedCampaign) return [];

    const accountDates = (stats.dailyInsights ?? [])
      .map((row) => row.date?.trim())
      .filter((date): date is string => Boolean(date));
    const campaignRows = selectedCampaign.dailyInsights ?? [];
    if (campaignRows.length === 0) return [];
    return buildDailyChartSeries(campaignRows, accountDates);
  }, [stats.dailyInsights, selectedCampaign]);

  const showChartDots = dailySeries.length > 0 && dailySeries.length <= 2;

  const ageShares = useMemo(
    () => breakdownShares(stats.breakdowns?.age),
    [stats.breakdowns?.age],
  );
  const placementShares = useMemo(
    () => breakdownShares(stats.breakdowns?.placement),
    [stats.breakdowns?.placement],
  );
  const countryShares = useMemo(
    () => breakdownShares(stats.breakdowns?.country),
    [stats.breakdowns?.country],
  );

  const pageRows = campaigns;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const safePage = Math.min(pagination?.page ?? 1, totalPages);
  const totalFiltered = pagination?.total ?? campaigns.length;

  const activeStatusText = selectedCampaign
    ? formatMetaDeliveryStatus(selectedCampaign.effectiveStatus)
    : null;

  const emptyStat = "—";
  const breakdownTiles = [
    {
      label: "CTR",
      value: !selectedCampaign
        ? emptyStat
        : avgCtr == null
          ? "N/A"
          : formatMetaPercent(String(avgCtr)),
      icon: TrendingUp,
      tone: "bg-[#E8F1FF] text-[#1877f2]",
    },
    {
      label: "CPC",
      value: !selectedCampaign
        ? emptyStat
        : avgCpc == null
          ? "N/A"
          : formatMetaRateMoney(String(avgCpc), currency),
      icon: MousePointerClick,
      tone: "bg-[#F3E8FF] text-[#7C3AED]",
    },
    {
      label: "CPM",
      value: !selectedCampaign
        ? emptyStat
        : avgCpm == null
          ? "N/A"
          : formatMetaRateMoney(String(avgCpm), currency),
      icon: BarChart3,
      tone: "bg-[#FFF4E5] text-[#EA580C]",
    },
    {
      label: "Frequency",
      value: !selectedCampaign
        ? emptyStat
        : avgFrequency == null
          ? "N/A"
          : formatMetaFrequency(String(avgFrequency)),
      icon: Activity,
      tone: "bg-[#E7F8EF] text-[#059669]",
    },
    {
      label: primaryAcross
        ? formatMetaActionType(primaryAcross.actionType)
        : "Link Click",
      value: !selectedCampaign
        ? emptyStat
        : primaryAcross
          ? formatMetaCount(primaryAcross.value)
          : "N/A",
      icon: Link2,
      tone: "bg-[#E8F1FF] text-[#1877f2]",
    },
    {
      label: "Cost per result",
      value: !selectedCampaign
        ? emptyStat
        : primaryAcross?.cost != null
          ? formatMetaRateMoney(String(primaryAcross.cost), currency)
          : "N/A",
      icon: Target,
      tone: "bg-[#FCE7F3] text-[#DB2777]",
    },
  ];

  return (
    <div className="-mx-1 space-y-6 rounded-3xl bg-white px-1 py-1 sm:px-2 sm:py-2">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-[#e8edf5]">
              <MetaLogo className="size-7" />
            </span>
            <div className="min-w-0">
              <h2 className="text-2xl font-bold tracking-tight text-[#07111f] sm:text-3xl">
                Meta ads
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Track spend and performance for your linked Meta ads account.
              </p>
              <div className="mt-3">
                <AdsDatePeriodPicker
                  value={period}
                  onChange={onPeriodChange}
                  disabled={bootstrapping}
                  loading={softRefreshing}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          {canCreateCampaign ? (
            <button
              type="button"
              onClick={onCreateCampaign}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#166fe5]"
            >
              <Plus className="size-4" aria-hidden />
              Create campaign
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRefresh}
            disabled={insightsLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#EEF2F7] bg-white px-4 py-2.5 text-sm font-semibold text-[#07111f] transition hover:bg-[#f4f8ff] disabled:opacity-60"
          >
            <RefreshCw
              className={`size-4 ${insightsLoading ? "animate-spin" : ""}`}
              aria-hidden
            />
            Sync Campaigns
          </button>
          {canOpenAdsManager ? (
            <a
              href={adsManagerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#EEF2F7] bg-white px-4 py-2.5 text-sm font-semibold text-[#07111f] transition hover:bg-[#f4f8ff]"
            >
              Open Ads Manager
              <ExternalLink className="size-4" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>

      {errorMessage ? (
        <div
          className="rounded-2xl border border-red-200/80 bg-red-50 px-5 py-4"
          role="alert"
        >
          <p className="flex items-start gap-2 text-sm font-medium text-red-800">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={onRefresh}
            disabled={insightsLoading}
            className="mt-3 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-900 hover:bg-red-50 disabled:opacity-60"
          >
            Try again
          </button>
        </div>
      ) : null}

      <div
        className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-5 ${
          bootstrapping ? "" : metricsSoftClass
        }`}
        aria-busy={softRefreshing || undefined}
      >
        {bootstrapping ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-[5.5rem] animate-pulse rounded-2xl border border-[#e8edf5] bg-[#f1f5f9]"
            />
          ))
        ) : (
          <>
        <KpiCard
          icon={Wallet}
          label="Total spend"
          tone="blue"
          value={
            selectedCampaign
              ? formatMetaSpend(selectedCampaign.insights?.spend, currency)
              : emptyStat
          }
        />
        <KpiCard
          icon={Eye}
          label="Impressions"
          tone="violet"
          value={
            selectedCampaign
              ? formatMetaCount(selectedCampaign.insights?.impressions)
              : emptyStat
          }
        />
        <KpiCard
          icon={Users}
          label="Reach"
          tone="emerald"
          value={
            selectedCampaign
              ? formatMetaCount(selectedCampaign.insights?.reach)
              : emptyStat
          }
        />
        <KpiCard
          icon={MousePointerClick}
          label="Clicks"
          tone="amber"
          value={
            selectedCampaign
              ? formatMetaCount(selectedCampaign.insights?.clicks)
              : emptyStat
          }
        />
        <KpiCard
          icon={TrendingUp}
          label="Active campaigns"
          tone="zinc"
          value={
            selectedCampaign
              ? `${activeCount} / ${totalCampaignCount}`
              : emptyStat
          }
          statusText={activeStatusText}
          hint={
            selectedCampaign && !activeStatusText
              ? `${activeCount} running`
              : undefined
          }
        />
          </>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.9fr)]">
        <div className="min-w-0 space-y-5">
          <Panel title="Performance overview">
            {bootstrapping ? (
              <div className="space-y-3" aria-busy="true">
                <div className="flex flex-wrap gap-4">
                  <div className="h-3 w-16 animate-pulse rounded bg-[#eef2f7]" />
                  <div className="h-3 w-20 animate-pulse rounded bg-[#eef2f7]" />
                  <div className="h-3 w-14 animate-pulse rounded bg-[#eef2f7]" />
                </div>
                <div className="h-48 animate-pulse rounded-xl bg-[#f1f5f9]" />
              </div>
            ) : (
              <div className={metricsSoftClass} aria-busy={softRefreshing || undefined}>
            <div className="mb-3 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#1877f2]" /> Spend
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-violet-500" />{" "}
                Impressions
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" /> Clicks
              </span>
            </div>
            <div className="relative h-64 w-full min-w-0 min-h-[16rem]">
              <ChartMount height={256}>
                <ResponsiveContainer width="100%" height={256} minWidth={0}>
                  <AreaChart
                    data={
                      dailySeries.length > 0
                        ? dailySeries
                        : [{ label: "", spend: 0, impressions: 0, clicks: 0 }]
                    }
                    margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="metaSpendFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#1877f2"
                          stopOpacity={0.28}
                        />
                        <stop
                          offset="100%"
                          stopColor="#1877f2"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                      <linearGradient
                        id="metaImpressionsFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#8b5cf6"
                          stopOpacity={0.18}
                        />
                        <stop
                          offset="100%"
                          stopColor="#8b5cf6"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="4 6"
                      stroke="#e8edf5"
                      vertical
                    />
                    <XAxis
                      dataKey="label"
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={28}
                    />
                    <YAxis
                      yAxisId="spend"
                      tick={{ fill: "#94a3b8", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={44}
                    />
                    <YAxis
                      yAxisId="volume"
                      orientation="right"
                      tick={{ fill: "#94a3b8", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e8edf5",
                        fontSize: 12,
                      }}
                    />
                    <Area
                      yAxisId="spend"
                      type="monotone"
                      dataKey="spend"
                      name="Spend"
                      stroke="#1877f2"
                      strokeWidth={2.5}
                      fill="url(#metaSpendFill)"
                      isAnimationActive={false}
                      dot={showChartDots ? { r: 3 } : false}
                      activeDot={{ r: 4 }}
                    />
                    <Area
                      yAxisId="volume"
                      type="monotone"
                      dataKey="impressions"
                      name="Impressions"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fill="url(#metaImpressionsFill)"
                      isAnimationActive={false}
                      dot={showChartDots ? { r: 3 } : false}
                    />
                    <Area
                      yAxisId="volume"
                      type="monotone"
                      dataKey="clicks"
                      name="Clicks"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="transparent"
                      isAnimationActive={false}
                      dot={showChartDots ? { r: 3 } : false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartMount>
              {dailySeries.length === 0 ? (
                <div className="absolute inset-0 z-[1] bg-white/90">
                  <EmptyChartNote
                    message={
                      selectedCampaign
                        ? "No daily performance yet for this campaign. Tap Sync Campaigns to pull day-level Meta insights."
                        : "Select a campaign below to view its performance stats."
                    }
                  />
                </div>
              ) : null}
            </div>
              </div>
            )}
          </Panel>

          <Panel
            title="All campaigns"
            action={
              <label className={adsCampaignsTable.searchLabel}>
                <Search
                  className={adsCampaignsTable.searchIcon}
                  aria-hidden
                />
                <input
                  value={campaignSearch}
                  onChange={(e) => {
                    onCampaignSearchChange(e.target.value);
                  }}
                  placeholder="Search campaigns…"
                  aria-label="Search campaigns"
                  className={adsCampaignsTable.searchInput}
                />
              </label>
            }
          >
            <div
              className={`${adsCampaignsTable.scroll} ${bootstrapping ? "" : metricsSoftClass}`}
              aria-busy={softRefreshing || undefined}
            >
              <table className={adsCampaignsTable.table}>
                <thead>
                  <tr className={adsCampaignsTable.theadRow}>
                    <th
                      className={adsCampaignsTable.thSelect}
                      aria-label="Selected"
                    />
                    <th className={adsCampaignsTable.th}>Campaign</th>
                    <th className={adsCampaignsTable.th}>Status</th>
                    <th className={adsCampaignsTable.th}>Spend</th>
                    <th className={adsCampaignsTable.th}>Impr.</th>
                    <th className={adsCampaignsTable.th}>Reach</th>
                    <th className={adsCampaignsTable.th}>Clicks</th>
                    <th className={adsCampaignsTable.th}>CTR</th>
                    <th className={adsCampaignsTable.th}>CPC</th>
                    <th className={adsCampaignsTable.th}>CPM</th>
                    <th className={adsCampaignsTable.th}>Freq.</th>
                    <th
                      className={adsCampaignsTable.thActions}
                      aria-label="Actions"
                    />
                  </tr>
                </thead>
                <tbody>
                  {bootstrapping ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={`sk-${i}`}>
                        <td
                          colSpan={12}
                          className={adsCampaignsTable.skeletonCell}
                        >
                          <div className={adsCampaignsTable.skeletonBar} />
                        </td>
                      </tr>
                    ))
                  ) : pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={12} className={adsCampaignsTable.emptyCell}>
                        <Megaphone
                          className="mx-auto size-10 text-slate-300"
                          aria-hidden
                        />
                        <p className="mt-3 text-base font-bold text-[#07111f]">
                          No campaigns yet
                        </p>
                        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                          Create a Meta campaign with the guided builder, or run
                          ads in Ads Manager.
                        </p>
                        {canCreateCampaign ? (
                          <button
                            type="button"
                            onClick={onCreateCampaign}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1877f2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#166fe5]"
                          >
                            <Plus className="size-4" aria-hidden />
                            Create campaign
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((c) => {
                    const isSelected = selectedCampaignId === c.id;
                    return (
                    <tr
                      key={c.id}
                      aria-selected={isSelected}
                      className={adsCampaignsTable.row}
                      onClick={() => {
                        if (isSelected) return;
                        setSelectedCampaignId(c.id);
                        setSelectedCampaignSnapshot(c);
                      }}
                    >
                      <td className={adsCampaignsTable.tdSelect}>
                        <span
                          className={adsCampaignSelectDotClass(isSelected)}
                          aria-hidden={!isSelected}
                          title={isSelected ? "Selected campaign" : undefined}
                        >
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                        {isSelected ? (
                          <span className="sr-only">Selected</span>
                        ) : null}
                      </td>
                      <td className={adsCampaignsTable.td}>
                        <div className="flex max-w-[18rem] items-center gap-3">
                          {c.imageUrl?.trim() ? (
                            <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-[#f1f5f9] ring-1 ring-[#e8edf5]">
                              {/* eslint-disable-next-line @next/next/no-img-element -- Meta CDN URLs vary */}
                              <img
                                src={c.imageUrl}
                                alt=""
                                className="size-full object-contain"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            </span>
                          ) : (
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f1f5f9] text-slate-400 ring-1 ring-[#e8edf5]">
                              <ImageIcon className="size-4" aria-hidden />
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className={adsCampaignsTable.campaignName}>
                              {c.name}
                            </p>
                            <p className={adsCampaignsTable.campaignMetaId}>
                              {c.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={adsCampaignsTable.td}>
                        <span
                          className={`${adsCampaignsTable.statusBadge} ${statusBadgeClass(c.effectiveStatus)}`}
                        >
                          {formatMetaDeliveryStatus(c.effectiveStatus)}
                        </span>
                      </td>
                      <td className={adsCampaignsTable.tdNum}>
                        {formatMetaSpend(c.insights?.spend, currency)}
                      </td>
                      <td className={adsCampaignsTable.tdNum}>
                        {formatMetaCount(c.insights?.impressions)}
                      </td>
                      <td className={adsCampaignsTable.tdNum}>
                        {formatMetaCount(c.insights?.reach)}
                      </td>
                      <td className={adsCampaignsTable.tdNum}>
                        {formatMetaCount(c.insights?.clicks)}
                      </td>
                      <td className={adsCampaignsTable.tdNum}>
                        {formatMetaPercent(c.insights?.ctr)}
                      </td>
                      <td className={adsCampaignsTable.tdNum}>
                        {formatMetaRateMoney(c.insights?.cpc, currency)}
                      </td>
                      <td className={adsCampaignsTable.tdNum}>
                        {formatMetaRateMoney(c.insights?.cpm, currency)}
                      </td>
                      <td className={adsCampaignsTable.tdNum}>
                        {formatMetaFrequency(c.insights?.frequency)}
                      </td>
                      <td className={adsCampaignsTable.tdActions}>
                        <div className={adsCampaignsTable.actionRow}>
                          {canManageCampaign &&
                          onToggleCampaignStatus &&
                          (isMetaCampaignActive(c.effectiveStatus) ||
                            isMetaCampaignPaused(c.effectiveStatus)) ? (
                            <button
                              type="button"
                              title={
                                isMetaCampaignActive(c.effectiveStatus)
                                  ? "Pause campaign"
                                  : "Enable campaign"
                              }
                              disabled={
                                deletingCampaignId === c.id ||
                                statusUpdatingId === c.id ||
                                editingCampaignId === c.id
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleCampaignStatus(
                                  c,
                                  isMetaCampaignActive(c.effectiveStatus)
                                    ? "PAUSED"
                                    : "ACTIVE",
                                );
                              }}
                              className={adsCampaignsTable.actionBtn}
                            >
                              {statusUpdatingId === c.id ? (
                                <Loader2
                                  className="size-4 animate-spin"
                                  aria-hidden
                                />
                              ) : isMetaCampaignActive(c.effectiveStatus) ? (
                                <Pause className="size-4" aria-hidden />
                              ) : (
                                <Play className="size-4" aria-hidden />
                              )}
                            </button>
                          ) : null}
                          {canManageCampaign && onEditCampaign ? (
                            <button
                              type="button"
                              title="Edit published campaign"
                              disabled={
                                deletingCampaignId === c.id ||
                                statusUpdatingId === c.id ||
                                editingCampaignId === c.id
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditCampaign(c);
                                setEditName(c.name?.trim() || "");
                                setEditStatus(
                                  isMetaCampaignActive(c.effectiveStatus)
                                    ? "ACTIVE"
                                    : "PAUSED",
                                );
                                setEditBudget(
                                  metaDailyBudgetDollars(c.dailyBudget),
                                );
                              }}
                              className={adsCampaignsTable.actionBtn}
                            >
                              {editingCampaignId === c.id ? (
                                <Loader2
                                  className="size-4 animate-spin"
                                  aria-hidden
                                />
                              ) : (
                                <Pencil className="size-4" aria-hidden />
                              )}
                            </button>
                          ) : null}
                          {canDeleteCampaign &&
                          c.effectiveStatus?.toUpperCase() !== "ACTIVE" ? (
                            <button
                              type="button"
                              title="Delete campaign"
                              disabled={deletingCampaignId === c.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCampaign(c);
                              }}
                              className={adsCampaignsTable.actionBtnDanger}
                            >
                              {deletingCampaignId === c.id ? (
                                <Loader2
                                  className="size-4 animate-spin"
                                  aria-hidden
                                />
                              ) : (
                                <Trash2 className="size-4" aria-hidden />
                              )}
                            </button>
                          ) : canDeleteCampaign ? (
                            <button
                              type="button"
                              className={adsCampaignsTable.actionBtn}
                              aria-label="More"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="size-4" aria-hidden />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className={adsCampaignsTable.paginationBar}>
              <p>
                Showing {pageRows.length} of {totalFiltered} campaign
                {totalFiltered === 1 ? "" : "s"}
                {pagination?.pageSize
                  ? ` · ${pagination.pageSize} per page`
                  : ""}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => onCampaignPageChange(Math.max(1, safePage - 1))}
                  className={adsCampaignsTable.paginationBtn}
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </button>
                <span className={adsCampaignsTable.paginationPage}>
                  {safePage}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() =>
                    onCampaignPageChange(Math.min(totalPages, safePage + 1))
                  }
                  className={adsCampaignsTable.paginationBtn}
                >
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          </Panel>
        </div>

        <div className="min-w-0 space-y-5">
          <Panel title="Performance breakdown">
            <div
              className={`grid grid-cols-2 gap-3 ${bootstrapping ? "" : metricsSoftClass}`}
              aria-busy={softRefreshing || undefined}
            >
              {bootstrapping
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[4.5rem] animate-pulse rounded-xl border border-[#eef2f7] bg-[#f1f5f9]"
                    />
                  ))
                : breakdownTiles.map((tile) => {
                    const Icon = tile.icon;
                    return (
                      <div
                        key={tile.label}
                        className="flex items-center gap-3 rounded-xl border border-[#eef2f7] bg-white px-3 py-3 shadow-[0_1px_4px_rgba(15,23,42,0.03)]"
                      >
                        <span
                          className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tile.tone}`}
                        >
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            {tile.label}
                          </p>
                          <p className="mt-0.5 text-lg font-bold tabular-nums text-[#07111f]">
                            {tile.value}
                          </p>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </Panel>

          <Panel title="Top placements" showChevron>
            {bootstrapping ? (
              <div className="h-40 animate-pulse rounded-xl bg-[#f1f5f9]" aria-busy="true" />
            ) : placementShares.rows.length === 0 ? (
              <EmptyChartNote message="Placement insights will show when Meta returns publisher platform data." />
            ) : (
              <div
                className={`flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6 ${metricsSoftClass}`}
                aria-busy={softRefreshing || undefined}
              >
                <div className="h-[9.5rem] w-[9.5rem] shrink-0">
                  <ChartMount height={152}>
                    <ResponsiveContainer width={152} height={152}>
                      <PieChart>
                        <defs>
                          <linearGradient
                            id={INSTAGRAM_GRADIENT_ID}
                            x1="0"
                            y1="1"
                            x2="1"
                            y2="0"
                          >
                            <stop offset="0%" stopColor="#405DE6" />
                            <stop offset="25%" stopColor="#833AB4" />
                            <stop offset="50%" stopColor="#FD1D1D" />
                            <stop offset="75%" stopColor="#F77737" />
                            <stop offset="100%" stopColor="#FCAF45" />
                          </linearGradient>
                        </defs>
                        <Pie
                          data={placementShares.rows}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={46}
                          outerRadius={68}
                          paddingAngle={3}
                          stroke="#ffffff"
                          strokeWidth={2}
                        >
                          {placementShares.rows.map((row, i) => (
                            <Cell
                              key={row.name}
                              fill={placementFill(row.name, i)}
                            />
                          ))}
                          <Label
                            position="center"
                            content={() => (
                              <text
                                x="50%"
                                y="50%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x="50%"
                                  dy="-0.35em"
                                  fill="#0f172a"
                                  fontSize="22"
                                  fontWeight="800"
                                >
                                  {placementShares.total.toLocaleString()}
                                </tspan>
                                <tspan
                                  x="50%"
                                  dy="1.35em"
                                  fill="#8E8E8E"
                                  fontSize="11"
                                  fontWeight="500"
                                >
                                  Impressions
                                </tspan>
                              </text>
                            )}
                          />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartMount>
                </div>

                <ul className="m-0 w-full min-w-0 flex-1 list-none p-0">
                  {placementShares.rows.slice(0, 5).map((row, i) => (
                    <li
                      key={row.name}
                      className="flex items-center justify-between gap-3 border-b border-[#F0F0F0] py-3 last:border-b-0"
                    >
                      <span className="inline-flex min-w-0 items-center gap-2.5">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{
                            background: placementLegendBackground(row.name, i),
                          }}
                          aria-hidden
                        />
                        <PlacementBrandIcon name={row.name} />
                        <span className="truncate text-sm font-medium text-[#0f172a]">
                          {placementDisplayName(row.name)}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-sm font-bold tabular-nums text-[#0f172a]">
                          {row.pct.toFixed(1)}%
                        </span>
                        <span className="block text-xs tabular-nums text-[#8E8E8E]">
                          {row.value.toLocaleString()}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>

          <Panel title="Audience insights" showChevron>
            {bootstrapping ? (
              <div className="space-y-3" aria-busy="true">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded-lg bg-[#f1f5f9]"
                  />
                ))}
              </div>
            ) : (
              <ul
                className={`m-0 list-none space-y-0 p-0 text-sm ${metricsSoftClass}`}
                aria-busy={softRefreshing || undefined}
              >
                <li className="flex items-start justify-between gap-3 border-b border-[#eef2f7] py-3 first:pt-0">
                  <span className="text-slate-500">Top countries</span>
                  <span className="text-right font-semibold text-[#07111f]">
                    {countryShares.rows[0]
                      ? `${countryShares.rows[0].name} (${countryShares.rows[0].pct.toFixed(0)}%)`
                      : "N/A"}
                  </span>
                </li>
                <li className="flex items-start justify-between gap-3 border-b border-[#eef2f7] py-3">
                  <span className="text-slate-500">Top placement</span>
                  <span className="text-right font-semibold capitalize text-[#07111f]">
                    {placementShares.rows[0]
                      ? `${placementDisplayName(placementShares.rows[0].name)} (${placementShares.rows[0].pct.toFixed(1)}%)`
                      : "N/A"}
                  </span>
                </li>
                <li className="flex items-start justify-between gap-3 py-3 last:pb-0">
                  <span className="text-slate-500">Top age group</span>
                  <span className="text-right font-semibold text-[#07111f]">
                    {ageShares.rows[0]
                      ? `${ageShares.rows[0].name} (${ageShares.rows[0].pct.toFixed(1)}%)`
                      : "N/A"}
                  </span>
                </li>
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {editCampaign && onEditCampaign ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="meta-ads-edit-title"
          onClick={() => {
            if (editingCampaignId == null) setEditCampaign(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#e8edf5] bg-white p-5 shadow-[0_24px_64px_-24px_rgba(15,23,42,0.45)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3
                  id="meta-ads-edit-title"
                  className="text-base font-bold text-[#07111f]"
                >
                  Edit published campaign
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  Change name, status, or budget here. Open the builder for
                  targeting, creative, and the rest of the ad.
                </p>
              </div>
              <button
                type="button"
                disabled={editingCampaignId != null}
                onClick={() => setEditCampaign(null)}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <label className="mt-5 block text-xs font-semibold text-slate-500">
              Campaign name
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-[#e8edf5] px-3.5 text-sm text-[#07111f] outline-none transition focus:border-[#1877f2]/50 focus:ring-2 focus:ring-[#1877f2]/15"
                autoFocus
              />
            </label>

            <div className="mt-3.5">
              <p className="text-xs font-semibold text-slate-500">Status</p>
              <div
                className="mt-1.5 grid grid-cols-2 gap-2"
                role="group"
                aria-label="Campaign status"
              >
                <button
                  type="button"
                  disabled={editingCampaignId != null}
                  onClick={() => setEditStatus("ACTIVE")}
                  className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition disabled:opacity-50 ${
                    editStatus === "ACTIVE"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-[#e8edf5] bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Play className="size-3.5" aria-hidden />
                  Enabled
                </button>
                <button
                  type="button"
                  disabled={editingCampaignId != null}
                  onClick={() => setEditStatus("PAUSED")}
                  className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition disabled:opacity-50 ${
                    editStatus === "PAUSED"
                      ? "border-amber-300 bg-amber-50 text-amber-700"
                      : "border-[#e8edf5] bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Pause className="size-3.5" aria-hidden />
                  Paused
                </button>
              </div>
            </div>

            <label className="mt-3.5 block text-xs font-semibold text-slate-500">
              Daily budget{currency ? ` (${currency})` : ""}
              <input
                type="number"
                min={1}
                step="0.01"
                value={editBudget}
                onChange={(e) => setEditBudget(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-[#e8edf5] px-3.5 text-sm text-[#07111f] outline-none transition focus:border-[#1877f2]/50 focus:ring-2 focus:ring-[#1877f2]/15"
              />
            </label>

            <div className="mt-5 flex flex-col gap-2 border-t border-[#eef2f7] pt-4 sm:flex-row sm:items-center sm:justify-between">
              {onOpenInBuilder ? (
                <button
                  type="button"
                  disabled={editingCampaignId != null}
                  onClick={() => {
                    const campaign = editCampaign;
                    setEditCampaign(null);
                    onOpenInBuilder(campaign);
                  }}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#e8edf5] px-3 text-sm font-semibold text-[#1877f2] transition hover:bg-[#f8fbff] disabled:opacity-50"
                >
                  <SlidersHorizontal className="size-4" aria-hidden />
                  Edit in builder
                </button>
              ) : (
                <span />
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={editingCampaignId != null}
                  onClick={() => setEditCampaign(null)}
                  className="h-10 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={editingCampaignId != null}
                  onClick={() => {
                    const name = editName.trim();
                    const amount = Number.parseFloat(editBudget);
                    if (!name || !Number.isFinite(amount) || amount < 1) return;
                    onEditCampaign(editCampaign, {
                      name,
                      status: editStatus,
                      dailyBudget: amount,
                    });
                    setEditCampaign(null);
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1877f2] px-3.5 text-sm font-semibold text-white transition hover:bg-[#166fe5] disabled:opacity-50"
                >
                  {editingCampaignId === editCampaign.id ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : null}
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
