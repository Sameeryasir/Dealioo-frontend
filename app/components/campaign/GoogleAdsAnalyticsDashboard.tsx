"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  ExternalLink,
  Eye,
  Loader2,
  Megaphone,
  MousePointerClick,
  Plus,
  RefreshCw,
  Search,
  Target,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  formatMetaCount,
  formatMetaDeliveryStatus,
  formatMetaPercent,
  formatMetaRateMoney,
  formatMetaSpend,
} from "@/app/lib/format-meta-ads";
import type {
  GoogleAdsCampaign,
  GoogleAdsCampaignStats,
} from "@/app/services/google-ads/get-google-ads-campaign-stats";

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function normalizeGoogleCampaignStatus(
  status: string | null | undefined,
): string {
  const raw = status?.trim() ?? "";
  if (!raw) return "";
  const byCode: Record<string, string> = {
    "0": "UNSPECIFIED",
    "1": "UNKNOWN",
    "2": "ENABLED",
    "3": "PAUSED",
    "4": "REMOVED",
  };
  return byCode[raw] ?? raw.toUpperCase();
}

function statusBadgeClass(status: string | null | undefined): string {
  const normalized = normalizeGoogleCampaignStatus(status);
  if (normalized === "ENABLED" || normalized === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (normalized === "PAUSED" || normalized.includes("PAUSED")) {
    return "bg-amber-50 text-amber-800 ring-amber-200";
  }
  return "bg-slate-50 text-slate-700 ring-slate-200";
}

function parseNum(raw: string | null | undefined): number {
  const n = Number.parseFloat(raw ?? "");
  return Number.isFinite(n) ? n : 0;
}

function formatGoogleCount(value: number): string {
  if (!Number.isFinite(value)) return "N/A";
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function campaignCtr(campaign: GoogleAdsCampaign): number | null {
  const clicks = parseNum(campaign.insights?.clicks);
  const impressions = parseNum(campaign.insights?.impressions);
  if (impressions <= 0) return null;
  return (clicks / impressions) * 100;
}

function campaignCpc(campaign: GoogleAdsCampaign): number | null {
  const spend = parseNum(campaign.insights?.spend);
  const clicks = parseNum(campaign.insights?.clicks);
  if (clicks <= 0) return null;
  return spend / clicks;
}

function campaignCostPerConversion(campaign: GoogleAdsCampaign): number | null {
  const spend = parseNum(campaign.insights?.spend);
  const conversions = parseNum(campaign.insights?.conversions);
  if (conversions <= 0) return null;
  return spend / conversions;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
  statusText,
}: {
  icon: LucideIcon;
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
                statusText.toUpperCase().includes("ACTIVE") ||
                statusText.toUpperCase().includes("ENABLED")
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
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[#EEF2F7] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)] sm:p-5 ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="m-0 text-base font-bold tracking-tight text-[#0F172A]">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

type GoogleAdsAnalyticsDashboardProps = {
  stats: GoogleAdsCampaignStats;
  insightsLoading?: boolean;
  adsConsoleUrl: string;
  onCreateCampaign: () => void;
  onRefresh: () => void;
  onDeleteCampaign: (campaign: GoogleAdsCampaign) => void;
  deletingCampaignId: string | null;
  errorMessage?: string | null;
};

export function GoogleAdsAnalyticsDashboard({
  stats,
  insightsLoading,
  adsConsoleUrl,
  onCreateCampaign,
  onRefresh,
  onDeleteCampaign,
  deletingCampaignId,
  errorMessage,
}: GoogleAdsAnalyticsDashboardProps) {
  const [campaignSearch, setCampaignSearch] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const pageSize = 4;

  const currency = stats.currency;
  const campaigns = stats.campaigns ?? [];
  const bootstrapping = Boolean(insightsLoading && campaigns.length === 0);

  const selectedCampaign = useMemo(
    () => campaigns.find((c) => c.id === selectedCampaignId) ?? null,
    [campaigns, selectedCampaignId],
  );

  const scopedCampaigns = selectedCampaign ? [selectedCampaign] : campaigns;

  const totalSpend = scopedCampaigns.reduce(
    (sum, c) => sum + parseNum(c.insights?.spend),
    0,
  );
  const totalImpressions = scopedCampaigns.reduce(
    (sum, c) => sum + parseNum(c.insights?.impressions),
    0,
  );
  const totalClicks = scopedCampaigns.reduce(
    (sum, c) => sum + parseNum(c.insights?.clicks),
    0,
  );
  const totalConversions = scopedCampaigns.reduce(
    (sum, c) => sum + parseNum(c.insights?.conversions),
    0,
  );
  const totalConversionValue = scopedCampaigns.reduce(
    (sum, c) => sum + parseNum(c.insights?.conversionValue),
    0,
  );

  const activeCount = selectedCampaign
    ? ["ENABLED", "ACTIVE"].includes(
        normalizeGoogleCampaignStatus(selectedCampaign.effectiveStatus),
      )
      ? 1
      : 0
    : campaigns.filter((c) =>
        ["ENABLED", "ACTIVE"].includes(
          normalizeGoogleCampaignStatus(c.effectiveStatus),
        ),
      ).length;
  const totalCampaignCount = selectedCampaign ? 1 : campaigns.length;

  const avgCtr =
    totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : null;
  const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : null;
  const costPerConversion =
    totalConversions > 0 ? totalSpend / totalConversions : null;

  const activeStatusText = selectedCampaign
    ? formatMetaDeliveryStatus(
        normalizeGoogleCampaignStatus(selectedCampaign.effectiveStatus),
      )
    : activeCount === 0 && totalCampaignCount > 0
      ? "PAUSED"
      : null;

  const filteredCampaigns = useMemo(() => {
    const q = campaignSearch.trim().toLowerCase();
    if (!q) return campaigns;
    return campaigns.filter((c) => {
      const hay = `${c.name} ${c.id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [campaigns, campaignSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredCampaigns.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const breakdownTiles = [
    {
      label: "Conversion value",
      value: formatMetaSpend(String(totalConversionValue), currency),
      icon: DollarSign,
      tone: "bg-[#E8F1FF] text-[#1877f2]",
    },
    {
      label: "CTR",
      value: avgCtr == null ? "N/A" : formatMetaPercent(String(avgCtr)),
      icon: TrendingUp,
      tone: "bg-[#F3E8FF] text-[#7C3AED]",
    },
    {
      label: "Avg. CPC",
      value:
        avgCpc == null ? "N/A" : formatMetaRateMoney(String(avgCpc), currency),
      icon: MousePointerClick,
      tone: "bg-[#FFF4E5] text-[#EA580C]",
    },
    {
      label: "Cost / conversion",
      value:
        costPerConversion == null
          ? "N/A"
          : formatMetaRateMoney(String(costPerConversion), currency),
      icon: Target,
      tone: "bg-[#FCE7F3] text-[#DB2777]",
    },
    {
      label: "Conversions",
      value: formatGoogleCount(totalConversions),
      icon: Activity,
      tone: "bg-[#E7F8EF] text-[#059669]",
    },
    {
      label: "Clicks",
      value: formatMetaCount(String(totalClicks)),
      icon: BarChart3,
      tone: "bg-[#E8F1FF] text-[#1877f2]",
    },
  ];

  return (
    <div className="-mx-1 space-y-6 rounded-3xl bg-white px-1 py-1 sm:px-2 sm:py-2">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-[#e8edf5]">
              <GoogleLogo className="size-7" />
            </span>
            <div className="min-w-0">
              <h2 className="text-2xl font-bold tracking-tight text-[#07111f] sm:text-3xl">
                Google ads
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Track spend and performance for your linked Google Ads account.
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
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#EEF2F7] bg-white px-4 py-2.5 text-sm font-semibold text-[#07111f] transition hover:bg-[#f4f8ff] disabled:opacity-60"
          >
            <RefreshCw
              className={`size-4 ${insightsLoading ? "animate-spin" : ""}`}
              aria-hidden
            />
            Sync Campaigns
          </button>
          <a
            href={adsConsoleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#EEF2F7] bg-white px-4 py-2.5 text-sm font-semibold text-[#07111f] transition hover:bg-[#f4f8ff]"
          >
            Open Google Ads
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
              value={formatMetaSpend(String(totalSpend), currency)}
            />
            <KpiCard
              icon={MousePointerClick}
              label="Clicks"
              tone="amber"
              value={formatMetaCount(String(totalClicks))}
            />
            <KpiCard
              icon={Eye}
              label="Impressions"
              tone="violet"
              value={formatMetaCount(String(totalImpressions))}
            />
            <KpiCard
              icon={Target}
              label="Conversions"
              tone="emerald"
              value={formatGoogleCount(totalConversions)}
            />
            <KpiCard
              icon={TrendingUp}
              label="Active campaigns"
              tone="zinc"
              value={`${activeCount} / ${totalCampaignCount}`}
              statusText={activeStatusText}
              hint={activeStatusText ? undefined : `${activeCount} running`}
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
              <>
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
                <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-[#e8edf5] bg-[#f8fafc] px-4 text-center text-sm text-slate-500">
                  Daily performance will appear once Google returns day-level
                  insights for this account.
                </div>
              </>
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
                    setCampaignSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search campaigns…"
                  aria-label="Search campaigns"
                  className="h-9 w-52 rounded-lg border border-[#e8edf5] bg-white pl-8 pr-3 text-xs text-[#07111f] outline-none focus:border-[#1877f2]/40 focus:ring-2 focus:ring-[#1877f2]/15 sm:w-64"
                />
              </label>
            }
          >
            <div className="overflow-x-auto">
              <table className="min-w-[820px] w-full border-separate border-spacing-0 text-left text-sm">
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
                      Clicks
                    </th>
                    <th className="border-b border-[#eef2f7] pb-2 pr-3 font-semibold">
                      Conv.
                    </th>
                    <th className="border-b border-[#eef2f7] pb-2 pr-3 font-semibold">
                      Conv. value
                    </th>
                    <th className="border-b border-[#eef2f7] pb-2 pr-3 font-semibold">
                      CTR
                    </th>
                    <th className="border-b border-[#eef2f7] pb-2 pr-3 font-semibold">
                      CPC
                    </th>
                    <th className="border-b border-[#eef2f7] pb-2 pr-3 font-semibold">
                      Cost/Conv.
                    </th>
                    <th
                      className="sticky right-0 z-[1] border-b border-[#eef2f7] bg-white pb-2 pl-2 text-right font-semibold"
                      aria-label="Actions"
                    />
                  </tr>
                </thead>
                <tbody>
                  {bootstrapping ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={`sk-${i}`}>
                        <td colSpan={12} className="border-b border-[#f1f5f9] py-3">
                          <div className="h-12 animate-pulse rounded-xl bg-[#f1f5f9]" />
                        </td>
                      </tr>
                    ))
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
                          Create a Google campaign with the guided builder, or
                          run ads in Google Ads.
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
                      const ctr = campaignCtr(c);
                      const cpc = campaignCpc(c);
                      const costConv = campaignCostPerConversion(c);
                      const status = normalizeGoogleCampaignStatus(
                        c.effectiveStatus,
                      );
                      return (
                        <tr
                          key={c.id}
                          aria-selected={isSelected}
                          className="group cursor-pointer align-middle text-[#07111f] transition hover:bg-[#f8fbff]"
                          onClick={() => {
                            setSelectedCampaignId((prev) =>
                              prev === c.id ? null : c.id,
                            );
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
                              title={
                                isSelected ? "Selected campaign" : undefined
                              }
                            >
                              <Check className="size-3" strokeWidth={3} />
                            </span>
                            {isSelected ? (
                              <span className="sr-only">Selected</span>
                            ) : null}
                          </td>
                          <td className="border-b border-[#f1f5f9] py-3 pr-3">
                            <div className="min-w-0 max-w-[18rem]">
                              <p className="truncate font-semibold">{c.name}</p>
                              <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">
                                {c.id}
                              </p>
                            </div>
                          </td>
                          <td className="border-b border-[#f1f5f9] py-3 pr-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${statusBadgeClass(c.effectiveStatus)}`}
                            >
                              {formatMetaDeliveryStatus(status)}
                            </span>
                          </td>
                          <td className="border-b border-[#f1f5f9] py-3 pr-3 tabular-nums">
                            {formatMetaSpend(c.insights?.spend, currency)}
                          </td>
                          <td className="border-b border-[#f1f5f9] py-3 pr-3 tabular-nums">
                            {formatMetaCount(c.insights?.impressions)}
                          </td>
                          <td className="border-b border-[#f1f5f9] py-3 pr-3 tabular-nums">
                            {formatMetaCount(c.insights?.clicks)}
                          </td>
                          <td className="border-b border-[#f1f5f9] py-3 pr-3 tabular-nums">
                            {formatGoogleCount(
                              parseNum(c.insights?.conversions),
                            )}
                          </td>
                          <td className="border-b border-[#f1f5f9] py-3 pr-3 tabular-nums">
                            {formatMetaSpend(
                              c.insights?.conversionValue,
                              currency,
                            )}
                          </td>
                          <td className="border-b border-[#f1f5f9] py-3 pr-3 tabular-nums">
                            {ctr == null
                              ? "N/A"
                              : formatMetaPercent(String(ctr))}
                          </td>
                          <td className="border-b border-[#f1f5f9] py-3 pr-3 tabular-nums">
                            {cpc == null
                              ? "N/A"
                              : formatMetaRateMoney(String(cpc), currency)}
                          </td>
                          <td className="border-b border-[#f1f5f9] py-3 pr-3 tabular-nums">
                            {costConv == null
                              ? "N/A"
                              : formatMetaRateMoney(String(costConv), currency)}
                          </td>
                          <td className="sticky right-0 z-[1] border-b border-[#f1f5f9] bg-white py-3 pl-2 group-hover:bg-[#f8fbff]">
                            <div className="flex items-center justify-end gap-1">
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
                Showing {pageRows.length} of {filteredCampaigns.length} campaign
                {filteredCampaigns.length === 1 ? "" : "s"}
                {` · ${pageSize} per page`}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage(Math.max(1, safePage - 1))}
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
                  onClick={() => setPage(Math.min(totalPages, safePage + 1))}
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
        </div>
      </div>
    </div>
  );
}
