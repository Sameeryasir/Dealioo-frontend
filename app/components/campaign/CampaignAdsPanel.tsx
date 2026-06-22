"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Check,
  ExternalLink,
  Eye,
  Loader2,
  Megaphone,
  MousePointerClick,
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { MetaCampaignBuilder } from "@/app/components/campaign/meta-builder/MetaCampaignBuilder";
import { MetricStatCardAccent } from "@/app/components/shared/MetricStatCard";
import {
  formatMetaCount,
  formatMetaDailyBudget,
  formatMetaDeliveryStatus,
  formatMetaSpend,
} from "@/app/lib/format-meta-ads";
import { panelCardClass, panelCardPaddingClass } from "@/app/lib/panel-styles";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import {
  getFacebookAdCampaignStats,
  type FacebookAdCampaign,
  type FacebookAdCampaignStats,
} from "@/app/services/facebook/get-facebook-ad-campaign-stats";
import { getFacebookConnectionStatus } from "@/app/services/facebook/get-facebook-connection-status";
import { deleteFacebookCampaign } from "@/app/services/facebook/delete-facebook-campaign";

type CampaignAdsPanelProps = {
  restaurantId: number;
  campaignName?: string;
  campaignImageUrl?: string;
};

function statusBadgeClass(status: string | null | undefined): string {
  const normalized = status?.toUpperCase() ?? "";
  if (normalized === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  }
  if (normalized === "PAUSED" || normalized.includes("PAUSED")) {
    return "bg-amber-50 text-amber-800 ring-amber-600/20";
  }
  if (normalized.includes("DRAFT") || normalized.includes("PENDING")) {
    return "bg-zinc-100 text-zinc-600 ring-zinc-500/15";
  }
  return "bg-blue-50 text-blue-700 ring-blue-600/20";
}

function sumMetric(
  campaigns: FacebookAdCampaign[],
  key: "spend" | "impressions" | "reach" | "clicks",
): number {
  return campaigns.reduce((total, campaign) => {
    const raw = campaign.insights?.[key];
    const n =
      key === "spend"
        ? Number.parseFloat(raw ?? "")
        : Number.parseInt(raw ?? "", 10);
    return total + (Number.isFinite(n) ? n : 0);
  }, 0);
}

function CampaignMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5 shadow-sm">
      <div className="flex items-center gap-2 text-zinc-500">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="mt-1 text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

export function CampaignAdsPanel({
  restaurantId,
  campaignName = "",
  campaignImageUrl = "",
}: CampaignAdsPanelProps) {
  const [metaConnected, setMetaConnected] = useState(false);
  const [metaAdAccountId, setMetaAdAccountId] = useState<string | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [adStats, setAdStats] = useState<FacebookAdCampaignStats | null>(null);
  const [adStatsLoading, setAdStatsLoading] = useState(false);
  const [adStatsError, setAdStatsError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingCampaignId, setDeletingCampaignId] = useState<string | null>(
    null,
  );

  const handleDeleteCampaign = useCallback(
    async (campaign: FacebookAdCampaign) => {
      const confirmed = window.confirm(
        `Delete "${campaign.name}" from Meta Ads Manager? This cannot be undone.`,
      );
      if (!confirmed) return;

      setDeletingCampaignId(campaign.id);
      setAdStatsError(null);
      try {
        await deleteFacebookCampaign(restaurantId, campaign.id);
        setAdStats((prev) =>
          prev
            ? {
                ...prev,
                campaigns: prev.campaigns.filter((c) => c.id !== campaign.id),
              }
            : prev,
        );
      } catch (e) {
        setAdStatsError(
          e instanceof Error ? e.message : "Could not delete campaign.",
        );
      } finally {
        setDeletingCampaignId(null);
      }
    },
    [restaurantId],
  );

  const loadStats = useCallback(async () => {
    setAdStatsLoading(true);
    setAdStatsError(null);
    try {
      const stats = await getFacebookAdCampaignStats(restaurantId);
      setAdStats(stats);
    } catch (e) {
      setAdStats(null);
      setAdStatsError(
        e instanceof Error ? e.message : "Could not load Facebook ads.",
      );
    } finally {
      setAdStatsLoading(false);
    }
  }, [restaurantId]);

  const refreshConnection = useCallback(async () => {
    setMetaLoading(true);
    setMetaError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) {
        setMetaConnected(false);
        setMetaAdAccountId(null);
        return { connected: false, metaAdAccountId: null as string | null };
      }
      const status = await getFacebookConnectionStatus(token, restaurantId);
      setMetaConnected(status.connected);
      setMetaAdAccountId(status.metaAdAccountId);
      return {
        connected: status.connected,
        metaAdAccountId: status.metaAdAccountId,
      };
    } catch (e) {
      setMetaConnected(false);
      setMetaAdAccountId(null);
      setMetaError(
        e instanceof Error ? e.message : "Could not check Facebook.",
      );
      return { connected: false, metaAdAccountId: null as string | null };
    } finally {
      setMetaLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    void (async () => {
      const { connected, metaAdAccountId: accountId } =
        await refreshConnection();
      if (connected && accountId) {
        await loadStats();
      }
    })();
  }, [refreshConnection, loadStats]);

  const campaigns = adStats?.campaigns ?? [];
  const currency = adStats?.currency;
  const totalSpend = useMemo(() => sumMetric(campaigns, "spend"), [campaigns]);
  const totalImpressions = useMemo(
    () => sumMetric(campaigns, "impressions"),
    [campaigns],
  );
  const totalReach = useMemo(() => sumMetric(campaigns, "reach"), [campaigns]);
  const activeCount = campaigns.filter(
    (c) => c.effectiveStatus?.toUpperCase() === "ACTIVE",
  ).length;

  const adsManagerUrl = metaAdAccountId
    ? `https://www.facebook.com/adsmanager/manage/campaigns?act=${metaAdAccountId.replace(/^act_/, "")}`
    : "https://www.facebook.com/adsmanager";

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#1877F2]/5 via-white to-zinc-50/30 px-4 py-8 sm:px-8 sm:py-10">
      <div
        className="pointer-events-none absolute -right-20 top-0 size-64 rounded-full bg-[#1877F2]/10 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#1877F2]/10 px-3 py-1 text-xs font-semibold text-[#1877F2]">
              <Megaphone className="size-3.5" aria-hidden />
              Meta Ads
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Facebook ads
            </h2>
            <p className="mt-1 max-w-xl text-sm text-zinc-600">
              Live campaign performance from your linked Meta ad account — last
              30 days.
            </p>
          </div>

          {metaConnected && metaAdAccountId ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
              >
                <Plus className="size-4" aria-hidden />
                Create campaign
              </button>
              <button
                type="button"
                onClick={() => void loadStats()}
                disabled={adStatsLoading}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60"
              >
                <RefreshCw
                  className={`size-4 ${adStatsLoading ? "animate-spin" : ""}`}
                  aria-hidden
                />
                Refresh
              </button>
              <a
                href={adsManagerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1877F2] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#166fe5]"
              >
                Open Ads Manager
                <ExternalLink className="size-4" aria-hidden />
              </a>
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-3xl border border-zinc-200/70 bg-white/90 shadow-xl shadow-zinc-900/5 ring-1 ring-zinc-950/[0.04] backdrop-blur-sm">
          <div className="border-b border-zinc-200/80 bg-gradient-to-r from-[#1877F2]/8 via-white to-violet-50/50 px-5 py-4 sm:px-6">
            {metaLoading ? (
              <p className="flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Checking Facebook connection…
              </p>
            ) : null}

            {!metaLoading && !metaConnected ? (
              <div className="py-6 text-center sm:py-8">
                <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#1877F2]/10 text-[#1877F2] ring-1 ring-[#1877F2]/20">
                  <Megaphone className="size-7" aria-hidden />
                </span>
                <p className="mt-4 font-bold text-zinc-900">Connect Facebook Ads</p>
                <p className="mt-2 text-sm text-zinc-600">
                  Open <span className="font-semibold text-zinc-800">Settings → Integrations</span>{" "}
                  and connect Facebook to see ad spend, reach, and campaigns here.
                </p>
              </div>
            ) : null}

            {!metaLoading && metaConnected && !metaAdAccountId ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 font-semibold text-emerald-800">
                    <Check className="size-4" aria-hidden />
                    Facebook linked — pick your ad account
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Choose which Meta ad account powers this restaurant.
                  </p>
                </div>
                <Link
                  href={`/facebook/select-ad-account?restaurantId=${restaurantId}`}
                  className="inline-flex shrink-0 rounded-xl bg-[#1877F2] px-5 py-3 text-sm font-semibold text-white no-underline shadow-md hover:bg-[#166fe5]"
                >
                  Choose ad account
                </Link>
              </div>
            ) : null}

            {!metaLoading && metaConnected && metaAdAccountId ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                    </span>
                    Connected to Meta
                  </p>
                  <p className="mt-1 text-sm text-zinc-700">
                    <span className="font-medium text-zinc-900">
                      {adStats?.adAccountName?.trim() || "Ad account"}
                    </span>
                    <span className="text-zinc-400"> · </span>
                    <span className="font-mono text-xs text-zinc-500">
                      {metaAdAccountId.replace(/^act_/, "")}
                    </span>
                  </p>
                </div>
                <Link
                  href={`/facebook/select-ad-account?restaurantId=${restaurantId}`}
                  className="text-sm font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
                >
                  Change account
                </Link>
              </div>
            ) : null}
          </div>

          <div className={`${panelCardPaddingClass} space-y-6`}>
            {metaConnected && metaAdAccountId && adStatsLoading && !adStats ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-28 animate-pulse rounded-2xl bg-zinc-100"
                  />
                ))}
              </div>
            ) : null}

            {metaConnected && metaAdAccountId && adStats && campaigns.length > 0 ? (
              <>
                <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricStatCardAccent
                    label="Total spend"
                    value={formatMetaSpend(String(totalSpend), currency)}
                    icon={Wallet}
                    tone="blue"
                  />
                  <MetricStatCardAccent
                    label="Impressions"
                    value={formatMetaCount(String(totalImpressions))}
                    icon={Eye}
                    tone="violet"
                  />
                  <MetricStatCardAccent
                    label="Reach"
                    value={formatMetaCount(String(totalReach))}
                    icon={Users}
                    tone="emerald"
                  />
                  <MetricStatCardAccent
                    label="Active campaigns"
                    value={`${activeCount} / ${campaigns.length}`}
                    icon={TrendingUp}
                    tone="zinc"
                    highlight
                  />
                </div>

                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <BarChart3 className="size-4 text-zinc-500" aria-hidden />
                    <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-500">
                      Campaigns
                    </h3>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600">
                      {adStats.datePreset.replace(/_/g, " ")}
                    </span>
                  </div>
                  <ul className="grid gap-4 lg:grid-cols-2">
                    {campaigns.map((c) => (
                      <li
                        key={c.id}
                        className="group rounded-2xl border border-zinc-200/90 bg-gradient-to-br from-white to-zinc-50/80 p-5 shadow-sm ring-1 ring-zinc-950/[0.03] transition hover:border-zinc-300 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-base font-bold text-zinc-900">
                              {c.name}
                            </p>
                            <p className="mt-0.5 font-mono text-[10px] text-zinc-400">
                              {c.id}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${statusBadgeClass(c.effectiveStatus)}`}
                            >
                              {formatMetaDeliveryStatus(c.effectiveStatus)}
                            </span>
                            <button
                              type="button"
                              title="Delete campaign"
                              disabled={deletingCampaignId === c.id}
                              onClick={() => void handleDeleteCampaign(c)}
                              className="cursor-pointer rounded-lg p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                            >
                              {deletingCampaignId === c.id ? (
                                <Loader2 className="size-4 animate-spin" aria-hidden />
                              ) : (
                                <Trash2 className="size-4" aria-hidden />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <CampaignMetric
                            icon={Wallet}
                            label="Spent"
                            value={formatMetaSpend(
                              c.insights?.spend,
                              currency,
                            )}
                          />
                          <CampaignMetric
                            icon={Eye}
                            label="Impressions"
                            value={formatMetaCount(c.insights?.impressions)}
                          />
                          <CampaignMetric
                            icon={Users}
                            label="Reach"
                            value={formatMetaCount(c.insights?.reach)}
                          />
                          <CampaignMetric
                            icon={MousePointerClick}
                            label="Clicks"
                            value={formatMetaCount(c.insights?.clicks)}
                          />
                        </div>

                        {c.dailyBudget ? (
                          <p className="mt-3 text-xs text-zinc-500">
                            Daily budget:{" "}
                            <span className="font-semibold text-zinc-800">
                              {formatMetaDailyBudget(c.dailyBudget, currency)}
                            </span>
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}

            {metaConnected &&
            metaAdAccountId &&
            !adStatsLoading &&
            adStats &&
            campaigns.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 px-6 py-12 text-center">
                <Megaphone
                  className="mx-auto size-10 text-zinc-300"
                  aria-hidden
                />
                <p className="mt-4 text-base font-semibold text-zinc-900">
                  No published campaigns yet
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
                  Create and publish a campaign in Meta Ads Manager — draft
                  campaigns won&apos;t appear here until you hit Publish.
                </p>
                <a
                  href={adsManagerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Go to Ads Manager
                  <ExternalLink className="size-4" aria-hidden />
                </a>
              </div>
            ) : null}

            {adStatsError ? (
              <div
                className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-4"
                role="alert"
              >
                <p className="flex items-start gap-2 text-sm font-medium text-red-800">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {adStatsError}
                </p>
                <button
                  type="button"
                  onClick={() => void loadStats()}
                  disabled={adStatsLoading}
                  className="mt-3 cursor-pointer rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-900 hover:bg-red-50 disabled:opacity-60"
                >
                  Try again
                </button>
              </div>
            ) : null}

            {metaError ? (
              <p
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {metaError}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <MetaCampaignBuilder
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
        }}
        restaurantId={restaurantId}
        defaultName={campaignName}
        onDraftSaved={(draft) => {
          // Only refresh Ads Manager stats after a successful publish — not on draft saves.
          if (draft.status === "published" && draft.metaAdId) {
            void loadStats();
          }
        }}
      />
    </div>
  );
}
