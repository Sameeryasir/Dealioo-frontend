"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  CartesianGrid,
  Cell,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  ImageIcon,
  Loader2,
  Megaphone,
  MoreHorizontal,
  MousePointerClick,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
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
  onRefresh: () => void;
  onDeleteCampaign: (campaign: FacebookAdCampaign) => void;
  deletingCampaignId: string | null;
  errorMessage?: string | null;
  campaignSearch: string;
  onCampaignSearchChange: (query: string) => void;
  onCampaignPageChange: (page: number) => void;
};

const PLACEMENT_COLORS = ["#1877F2", "#833AB4", "#E1306C", "#94a3b8", "#10b981"];

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
  if (key.includes("threads")) return "Threads";
  if (key.includes("messenger")) return "Messenger";
  if (key.includes("audience")) return "Audience Network";
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function PlacementBrandIcon({ name }: { name: string }) {
  const key = name.trim().toLowerCase();
  if (key.includes("facebook")) {
    return <FacebookLogo className="size-5" />;
  }
  if (key.includes("instagram")) {
    return <InstagramLogo className="size-5" idSuffix="placement" />;
  }
  if (key.includes("threads")) {
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

function sumCampaignMetric(
  campaigns: FacebookAdCampaign[],
  key: "spend" | "impressions" | "reach" | "clicks",
): number {
  return campaigns.reduce((total, campaign) => {
    return (
      total +
      parseNum(campaign.insights?.[key], key === "spend")
    );
  }, 0);
}

function weightedRate(
  campaigns: FacebookAdCampaign[],
  rateKey: "ctr" | "cpc" | "cpm" | "frequency",
  weightKey: "impressions" | "clicks",
): number | null {
  let weighted = 0;
  let weight = 0;
  for (const campaign of campaigns) {
    const rate = parseNum(campaign.insights?.[rateKey], true);
    const w = parseNum(campaign.insights?.[weightKey]);
    if (w <= 0) continue;
    weighted += rate * w;
    weight += w;
  }
  if (weight <= 0) return null;
  return weighted / weight;
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
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint: string;
  tone: "blue" | "violet" | "emerald" | "amber" | "zinc";
}) {
  const tones = {
    blue: "bg-[#1877f2]",
    violet: "bg-violet-600",
    emerald: "bg-emerald-600",
    amber: "bg-amber-500",
    zinc: "bg-zinc-900",
  } as const;

  return (
    <div className="rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-white ${tones[tone]}`}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-0.5 text-2xl font-bold tracking-tight tabular-nums text-[#07111f]">
            {value}
          </p>
          <p className="mt-1 text-xs font-medium text-emerald-600">{hint}</p>
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
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.04)] sm:p-5 ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="m-0 text-base font-bold tracking-tight text-[#07111f]">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyChartNote({ message }: { message: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-[#e8edf5] bg-[#f8fafc] px-4 text-center text-sm text-slate-500">
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
  onRefresh,
  onDeleteCampaign,
  deletingCampaignId,
  errorMessage,
  campaignSearch,
  onCampaignSearchChange,
  onCampaignPageChange,
}: MetaAdsAnalyticsDashboardProps) {
  const campaigns = stats.campaigns;
  const currency = stats.currency;
  const summary = stats.summary;
  const pagination = stats.pagination;
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null,
  );
  const [selectedCampaignSnapshot, setSelectedCampaignSnapshot] =
    useState<FacebookAdCampaign | null>(null);
  const didAutoSelectFirstRef = useRef(false);
  const userClearedSelectionRef = useRef(false);
  const bootstrapping = Boolean(insightsLoading && campaigns.length === 0);

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
      didAutoSelectFirstRef.current = false;
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

    if (userClearedSelectionRef.current) return;

    const first = campaigns[0];
    if (!first) return;
    didAutoSelectFirstRef.current = true;
    setSelectedCampaignId(first.id);
    setSelectedCampaignSnapshot(first);
  }, [campaigns, selectedCampaignId]);

  const totalSpend = selectedCampaign
    ? parseNum(selectedCampaign.insights?.spend, true)
    : (summary?.spend ?? sumCampaignMetric(campaigns, "spend"));
  const totalImpressions = selectedCampaign
    ? parseNum(selectedCampaign.insights?.impressions)
    : (summary?.impressions ?? sumCampaignMetric(campaigns, "impressions"));
  const totalReach = selectedCampaign
    ? parseNum(selectedCampaign.insights?.reach)
    : (summary?.reach ?? sumCampaignMetric(campaigns, "reach"));
  const totalClicks = selectedCampaign
    ? parseNum(selectedCampaign.insights?.clicks)
    : (summary?.clicks ?? sumCampaignMetric(campaigns, "clicks"));
  const activeCount = selectedCampaign
    ? selectedCampaign.effectiveStatus?.toUpperCase() === "ACTIVE"
      ? 1
      : 0
    : (summary?.activeCampaigns ??
      campaigns.filter((c) => c.effectiveStatus?.toUpperCase() === "ACTIVE")
        .length);
  const totalCampaignCount = selectedCampaign
    ? 1
    : (summary?.totalCampaigns ?? pagination?.total ?? campaigns.length);

  const avgCtr = selectedCampaign
    ? selectedCampaign.insights?.ctr != null &&
      selectedCampaign.insights.ctr.trim() !== ""
      ? parseNum(selectedCampaign.insights.ctr, true)
      : null
    : (summary?.ctr ?? weightedRate(campaigns, "ctr", "impressions"));
  const avgCpc = selectedCampaign
    ? selectedCampaign.insights?.cpc != null &&
      selectedCampaign.insights.cpc.trim() !== ""
      ? parseNum(selectedCampaign.insights.cpc, true)
      : null
    : (summary?.cpc ?? weightedRate(campaigns, "cpc", "clicks"));
  const avgCpm = selectedCampaign
    ? selectedCampaign.insights?.cpm != null &&
      selectedCampaign.insights.cpm.trim() !== ""
      ? parseNum(selectedCampaign.insights.cpm, true)
      : null
    : (summary?.cpm ?? weightedRate(campaigns, "cpm", "impressions"));
  const avgFrequency = selectedCampaign
    ? selectedCampaign.insights?.frequency != null &&
      selectedCampaign.insights.frequency.trim() !== ""
      ? parseNum(selectedCampaign.insights.frequency, true)
      : null
    : (summary?.frequency ??
      weightedRate(campaigns, "frequency", "impressions"));

  const primaryAcross = useMemo(() => {
    if (selectedCampaign) {
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
    }
    if (summary?.primaryActionType) {
      return {
        actionType: summary.primaryActionType,
        value: summary.primaryActionValue ?? "0",
        cost: summary.costPerResult,
      };
    }
    const totals = new Map<string, number>();
    const costs = new Map<string, number>();
    for (const campaign of campaigns) {
      for (const action of campaign.insights?.actions ?? []) {
        const key = action.actionType;
        totals.set(key, (totals.get(key) ?? 0) + parseNum(action.value));
      }
      for (const cost of campaign.insights?.costPerActionType ?? []) {
        const key = cost.actionType;
        const n = parseNum(cost.value, true);
        if (n > 0) costs.set(key, n);
      }
    }
    const primary = pickPrimaryMetaAction(
      [...totals.entries()].map(([actionType, value]) => ({
        actionType,
        value: String(value),
      })),
    );
    if (!primary) return null;
    return {
      ...primary,
      cost: costs.get(primary.actionType) ?? null,
    };
  }, [campaigns, summary, selectedCampaign]);

  const dailySeries = useMemo(() => {
    const accountDates = (stats.dailyInsights ?? [])
      .map((row) => row.date?.trim())
      .filter((date): date is string => Boolean(date));

    if (selectedCampaign) {
      const campaignRows = selectedCampaign.dailyInsights ?? [];
      if (campaignRows.length === 0) return [];
      return buildDailyChartSeries(campaignRows, accountDates);
    }

    return buildDailyChartSeries(stats.dailyInsights ?? []);
  }, [stats.dailyInsights, selectedCampaign]);

  const showChartDots = dailySeries.length <= 2;

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

  const dateLabel = stats.datePreset.replace(/_/g, " ");
  const statsScopeHint = selectedCampaign
    ? selectedCampaign.name
    : `${dateLabel} · live sync`;

  const breakdownTiles = [
    {
      label: "CTR",
      value: avgCtr == null ? "N/A" : formatMetaPercent(String(avgCtr)),
    },
    {
      label: "CPC",
      value:
        avgCpc == null ? "N/A" : formatMetaRateMoney(String(avgCpc), currency),
    },
    {
      label: "CPM",
      value:
        avgCpm == null ? "N/A" : formatMetaRateMoney(String(avgCpm), currency),
    },
    {
      label: "Frequency",
      value: avgFrequency == null ? "N/A" : formatMetaFrequency(String(avgFrequency)),
    },
    {
      label: primaryAcross
        ? formatMetaActionType(primaryAcross.actionType)
        : "Results",
      value: primaryAcross
        ? formatMetaCount(primaryAcross.value)
        : "N/A",
    },
    {
      label: "Cost per result",
      value:
        primaryAcross?.cost != null
          ? formatMetaRateMoney(String(primaryAcross.cost), currency)
          : "N/A",
    },
  ];

  return (
    <div className="space-y-6">
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
                Track spend, impressions, reach, clicks, CTR, CPC, CPM,
                frequency, and results from your linked Meta ad account.
              </p>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={onCreateCampaign}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#166fe5]"
          >
            <Plus className="size-4" aria-hidden />
            Create campaign
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={insightsLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e8edf5] bg-white px-4 py-2.5 text-sm font-semibold text-[#07111f] transition hover:bg-[#f4f8ff] disabled:opacity-60"
          >
            <RefreshCw
              className={`size-4 ${insightsLoading ? "animate-spin" : ""}`}
              aria-hidden
            />
            Sync Campaigns
          </button>
          <a
            href={adsManagerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e8edf5] bg-white px-4 py-2.5 text-sm font-semibold text-[#07111f] transition hover:bg-[#f4f8ff]"
          >
            Open Ads Manager
            <ExternalLink className="size-4" aria-hidden />
          </a>
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
            insightsLoading
              ? "…"
              : selectedCampaign
                ? formatMetaSpend(selectedCampaign.insights?.spend, currency)
                : formatMetaSpend(String(totalSpend), currency)
          }
          hint={statsScopeHint}
        />
        <KpiCard
          icon={Eye}
          label="Impressions"
          tone="violet"
          value={
            insightsLoading
              ? "…"
              : selectedCampaign
                ? formatMetaCount(selectedCampaign.insights?.impressions)
                : formatMetaCount(String(totalImpressions))
          }
          hint={statsScopeHint}
        />
        <KpiCard
          icon={Users}
          label="Reach"
          tone="emerald"
          value={
            insightsLoading
              ? "…"
              : selectedCampaign
                ? formatMetaCount(selectedCampaign.insights?.reach)
                : formatMetaCount(String(totalReach))
          }
          hint={statsScopeHint}
        />
        <KpiCard
          icon={MousePointerClick}
          label="Clicks"
          tone="amber"
          value={
            insightsLoading
              ? "…"
              : selectedCampaign
                ? formatMetaCount(selectedCampaign.insights?.clicks)
                : formatMetaCount(String(totalClicks))
          }
          hint={statsScopeHint}
        />
        <KpiCard
          icon={TrendingUp}
          label="Active campaigns"
          tone="zinc"
          value={`${activeCount} / ${totalCampaignCount}`}
          hint={
            selectedCampaign
              ? formatMetaDeliveryStatus(selectedCampaign.effectiveStatus)
              : `${activeCount} running`
          }
        />
          </>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.9fr)]">
        <div className="min-w-0 space-y-5">
          <Panel
            title="Performance overview"
            action={
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8edf5] bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                Daily
                <ChevronDown className="size-3.5" aria-hidden />
              </span>
            }
          >
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
            {dailySeries.length === 0 ? (
              <EmptyChartNote
                message={
                  selectedCampaign
                    ? "No daily performance yet for this campaign. Tap Sync Campaigns to pull day-level Meta insights."
                    : "Daily performance will appear once Meta returns day-level insights for this account."
                }
              />
            ) : (
              <div className="h-64 w-full min-w-0 min-h-[16rem]">
                <ChartMount height={256}>
                  <ResponsiveContainer width="100%" height={256} minWidth={0}>
                    <LineChart
                      data={dailySeries}
                      margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                    >
                    <CartesianGrid
                      strokeDasharray="4 6"
                      stroke="#e8edf5"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
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
                    <Line
                      yAxisId="spend"
                      type="monotone"
                      dataKey="spend"
                      name="Spend"
                      stroke="#1877f2"
                      strokeWidth={2.5}
                      dot={showChartDots ? { r: 3 } : false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      yAxisId="volume"
                      type="monotone"
                      dataKey="impressions"
                      name="Impressions"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={showChartDots ? { r: 3 } : false}
                    />
                    <Line
                      yAxisId="volume"
                      type="monotone"
                      dataKey="clicks"
                      name="Clicks"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={showChartDots ? { r: 3 } : false}
                    />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartMount>
              </div>
            )}
          </Panel>

          <Panel
            title="All campaigns"
            action={
              <label className="relative block">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  value={campaignSearch}
                  onChange={(e) => {
                    onCampaignSearchChange(e.target.value);
                  }}
                  placeholder="Search campaigns…"
                  aria-label="Search campaigns"
                  className="h-9 w-52 rounded-lg border border-[#e8edf5] bg-white pl-8 pr-3 text-xs text-[#07111f] outline-none focus:border-[#1877f2]/40 focus:ring-2 focus:ring-[#1877f2]/15 sm:w-64"
                />
              </label>
            }
          >
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th
                      className="border-b border-[#eef2f7] pb-2 pr-2 font-semibold"
                      aria-label="Selected"
                    />
                    <th className="border-b border-[#eef2f7] pb-2 pr-3 font-semibold">
                      Campaign
                    </th>
                    <th className="border-b border-[#eef2f7] pb-2 pr-3 font-semibold">
                      Status
                    </th>
                    <th className="border-b border-[#eef2f7] pb-2 pr-3 font-semibold">
                      Spend
                    </th>
                    <th className="border-b border-[#eef2f7] pb-2 pr-3 font-semibold">
                      Impr.
                    </th>
                    <th className="border-b border-[#eef2f7] pb-2 pr-3 font-semibold">
                      Reach
                    </th>
                    <th className="border-b border-[#eef2f7] pb-2 pr-3 font-semibold">
                      Clicks
                    </th>
                    <th className="border-b border-[#eef2f7] pb-2 pr-3 font-semibold">
                      CTR
                    </th>
                    <th className="border-b border-[#eef2f7] pb-2 pr-3 font-semibold">
                      CPC
                    </th>
                    <th className="border-b border-[#eef2f7] pb-2 pr-3 font-semibold">
                      CPM
                    </th>
                    <th className="border-b border-[#eef2f7] pb-2 pr-3 font-semibold">
                      Freq.
                    </th>
                    <th className="border-b border-[#eef2f7] pb-2 font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {bootstrapping ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="border-b border-[#f1f5f9] py-10 text-center text-sm text-slate-500"
                      >
                        <Loader2
                          className="mx-auto size-5 animate-spin text-[#1877f2]"
                          aria-hidden
                        />
                        <p className="mt-2">Loading campaigns from Meta…</p>
                      </td>
                    </tr>
                  ) : pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-10 text-center">
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
                        <button
                          type="button"
                          onClick={onCreateCampaign}
                          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1877f2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#166fe5]"
                        >
                          <Plus className="size-4" aria-hidden />
                          Create campaign
                        </button>
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((c) => {
                    const isSelected = selectedCampaignId === c.id;
                    return (
                    <tr
                      key={c.id}
                      aria-selected={isSelected}
                      className="cursor-pointer align-middle text-[#07111f] transition hover:bg-[#f8fbff]"
                      onClick={() => {
                        if (isSelected) {
                          userClearedSelectionRef.current = true;
                          setSelectedCampaignId(null);
                          setSelectedCampaignSnapshot(null);
                          return;
                        }
                        userClearedSelectionRef.current = false;
                        setSelectedCampaignId(c.id);
                        setSelectedCampaignSnapshot(c);
                      }}
                    >
                      <td className="border-b border-[#f1f5f9] py-3 pr-2">
                        <span
                          className={`flex size-5 items-center justify-center rounded-full ${
                            isSelected
                              ? "bg-[#1877f2] text-white"
                              : "border border-[#dbe3ef] bg-white text-transparent"
                          }`}
                          aria-hidden={!isSelected}
                          title={isSelected ? "Selected campaign" : undefined}
                        >
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                        {isSelected ? (
                          <span className="sr-only">Selected</span>
                        ) : null}
                      </td>
                      <td className="border-b border-[#f1f5f9] py-3 pr-3">
                        <div className="flex max-w-[18rem] items-center gap-3">
                          {c.imageUrl?.trim() ? (
                            <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-[#f1f5f9] ring-1 ring-[#e8edf5]">
                              {/* eslint-disable-next-line @next/next/no-img-element -- Meta CDN URLs vary */}
                              <img
                                src={c.imageUrl}
                                alt=""
                                className="size-full object-cover"
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
                            <p className="truncate font-semibold">{c.name}</p>
                            <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">
                              {c.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-[#f1f5f9] py-3 pr-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${statusBadgeClass(c.effectiveStatus)}`}
                        >
                          {formatMetaDeliveryStatus(c.effectiveStatus)}
                        </span>
                      </td>
                      <td className="border-b border-[#f1f5f9] py-3 pr-3 tabular-nums">
                        {formatMetaSpend(c.insights?.spend, currency)}
                      </td>
                      <td className="border-b border-[#f1f5f9] py-3 pr-3 tabular-nums">
                        {formatMetaCount(c.insights?.impressions)}
                      </td>
                      <td className="border-b border-[#f1f5f9] py-3 pr-3 tabular-nums">
                        {formatMetaCount(c.insights?.reach)}
                      </td>
                      <td className="border-b border-[#f1f5f9] py-3 pr-3 tabular-nums">
                        {formatMetaCount(c.insights?.clicks)}
                      </td>
                      <td className="border-b border-[#f1f5f9] py-3 pr-3 tabular-nums">
                        {formatMetaPercent(c.insights?.ctr)}
                      </td>
                      <td className="border-b border-[#f1f5f9] py-3 pr-3 tabular-nums">
                        {formatMetaRateMoney(c.insights?.cpc, currency)}
                      </td>
                      <td className="border-b border-[#f1f5f9] py-3 pr-3 tabular-nums">
                        {formatMetaRateMoney(c.insights?.cpm, currency)}
                      </td>
                      <td className="border-b border-[#f1f5f9] py-3 pr-3 tabular-nums">
                        {formatMetaFrequency(c.insights?.frequency)}
                      </td>
                      <td className="border-b border-[#f1f5f9] py-3">
                        <div className="flex items-center justify-end gap-1">
                          {c.effectiveStatus?.toUpperCase() !== "ACTIVE" ? (
                            <button
                              type="button"
                              title="Delete campaign"
                              disabled={deletingCampaignId === c.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCampaign(c);
                              }}
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
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
                          ) : (
                            <button
                              type="button"
                              className="rounded-lg p-1.5 text-slate-400"
                              aria-label="More"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="size-4" aria-hidden />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
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
                  className="rounded-lg border border-[#e8edf5] p-1.5 disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </button>
                <span className="min-w-6 text-center font-semibold text-[#07111f]">
                  {safePage}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() =>
                    onCampaignPageChange(Math.min(totalPages, safePage + 1))
                  }
                  className="rounded-lg border border-[#e8edf5] p-1.5 disabled:opacity-40"
                >
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          </Panel>
        </div>

        <div className="min-w-0 space-y-5">
          <Panel title="Performance breakdown">
            <div className="grid grid-cols-2 gap-3">
              {breakdownTiles.map((tile) => (
                <div
                  key={tile.label}
                  className="rounded-xl border border-[#eef2f7] bg-[#f8fafc] px-3 py-3"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {tile.label}
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-[#07111f]">
                    {insightsLoading ? "…" : tile.value}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Top placements">
            {placementShares.rows.length === 0 ? (
              <EmptyChartNote message="Placement insights will show when Meta returns publisher platform data." />
            ) : (
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
                <div className="h-[9.5rem] w-[9.5rem] shrink-0">
                  <ChartMount height={152}>
                    <ResponsiveContainer width={152} height={152}>
                      <PieChart>
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
                              fill={
                                PLACEMENT_COLORS[i % PLACEMENT_COLORS.length]
                              }
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
                            background:
                              PLACEMENT_COLORS[i % PLACEMENT_COLORS.length],
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

          <Panel title="Audience insights">
            <ul className="space-y-3 text-sm">
              <li className="flex items-start justify-between gap-3 border-b border-[#eef2f7] pb-3">
                <span className="text-slate-500">Top countries</span>
                <span className="text-right font-semibold text-[#07111f]">
                  {countryShares.rows[0]
                    ? `${countryShares.rows[0].name} (${countryShares.rows[0].pct.toFixed(0)}%)`
                    : "N/A"}
                </span>
              </li>
              <li className="flex items-start justify-between gap-3 border-b border-[#eef2f7] pb-3">
                <span className="text-slate-500">Top placement</span>
                <span className="text-right font-semibold capitalize text-[#07111f]">
                  {placementShares.rows[0]
                    ? `${placementShares.rows[0].name.replace(/_/g, " ")} (${placementShares.rows[0].pct.toFixed(1)}%)`
                    : "N/A"}
                </span>
              </li>
              <li className="flex items-start justify-between gap-3">
                <span className="text-slate-500">Top age group</span>
                <span className="text-right font-semibold text-[#07111f]">
                  {ageShares.rows[0]
                    ? `${ageShares.rows[0].name} (${ageShares.rows[0].pct.toFixed(1)}%)`
                    : "N/A"}
                </span>
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
