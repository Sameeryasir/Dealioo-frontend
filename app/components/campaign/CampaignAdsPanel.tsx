"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  ExternalLink,
  Eye,
  Link2,
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
import { MetaLogo } from "@/app/components/landing/LandingIntegrationLogos";
import { DeleteConfirmationDialog } from "@/app/components/shared/DeleteConfirmationDialog";
import { MetricStatCardAccent } from "@/app/components/shared/MetricStatCard";
import {
  formatMetaCount,
  formatMetaDailyBudget,
  formatMetaDeliveryStatus,
  formatMetaSpend,
} from "@/app/lib/format-meta-ads";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import {
  getFacebookAdCampaignStats,
  type FacebookAdCampaign,
  type FacebookAdCampaignStats,
} from "@/app/services/facebook/get-facebook-ad-campaign-stats";
import { getFacebookConnectionStatus } from "@/app/services/facebook/get-facebook-connection-status";
import { deleteFacebookCampaign } from "@/app/services/facebook/delete-facebook-campaign";

type CampaignAdsPanelProps = {
  businessId: number;
  campaignName?: string;
  campaignImageUrl?: string;
  campaignWebsiteUrl?: string;
  embedded?: boolean;
};

type ConnectionPhase = "loading" | "not_connected" | "needs_account" | "ready";

function statusBadgeClass(status: string | null | undefined): string {
  const normalized = status?.toUpperCase() ?? "";
  if (normalized === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  }
  if (normalized === "PAUSED" || normalized.includes("PAUSED")) {
    return "bg-amber-50 text-amber-800 ring-amber-600/20";
  }
  if (normalized.includes("DRAFT") || normalized.includes("PENDING")) {
    return "bg-[#e8f2ff] text-slate-500 ring-[#1877f2]/15";
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
    <div className="rounded-xl border border-[#e8edf5] bg-[#f4f8ff]/80 px-3 py-2.5">
      <div className="flex items-center gap-2 text-[#1877f2]">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="mt-1 text-sm font-semibold text-[#07111f]">{value}</p>
    </div>
  );
}

export function CampaignAdsPanel({
  businessId,
  campaignName = "",
  campaignImageUrl = "",
  campaignWebsiteUrl = "",
  embedded = false,
}: CampaignAdsPanelProps) {
  const [metaConnected, setMetaConnected] = useState(false);
  const [metaAdAccountId, setMetaAdAccountId] = useState<string | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [adStats, setAdStats] = useState<FacebookAdCampaignStats | null>(null);
  const [adStatsLoading, setAdStatsLoading] = useState(false);
  const [adStatsError, setAdStatsError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [campaignPendingDelete, setCampaignPendingDelete] =
    useState<FacebookAdCampaign | null>(null);
  const [deletingCampaignId, setDeletingCampaignId] = useState<string | null>(
    null,
  );

  const connectionPhase: ConnectionPhase = metaLoading
    ? "loading"
    : !metaConnected
      ? "not_connected"
      : !metaAdAccountId
        ? "needs_account"
        : "ready";

  const handleConfirmDeleteCampaign = useCallback(async () => {
    if (!campaignPendingDelete) return;

    const campaign = campaignPendingDelete;
    setDeletingCampaignId(campaign.id);
    setAdStatsError(null);
    try {
      await deleteFacebookCampaign(businessId, campaign.id);
      setAdStats((prev) =>
        prev
          ? {
              ...prev,
              campaigns: prev.campaigns.filter((c) => c.id !== campaign.id),
            }
          : prev,
      );
      setCampaignPendingDelete(null);
    } catch (e) {
      setAdStatsError(
        e instanceof Error ? e.message : "Could not delete campaign.",
      );
    } finally {
      setDeletingCampaignId(null);
    }
  }, [businessId, campaignPendingDelete]);

  const loadStats = useCallback(async () => {
    setAdStatsLoading(true);
    setAdStatsError(null);
    try {
      const stats = await getFacebookAdCampaignStats(businessId);
      setAdStats(stats);
    } catch (e) {
      setAdStats(null);
      setAdStatsError(
        e instanceof Error ? e.message : "Could not load Facebook ads.",
      );
    } finally {
      setAdStatsLoading(false);
    }
  }, [businessId]);

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
      const status = await getFacebookConnectionStatus(token, businessId);
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
  }, [businessId]);

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
    <div
      className={
        embedded
          ? "bg-white px-0 py-0"
          : "bg-[#f4f8ff]/50 px-4 py-8 sm:px-8 sm:py-10"
      }
    >
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1877f2]">
              Paid social
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#07111f] sm:text-3xl">
              Meta Ads
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              All campaigns from your linked Meta ad account. Performance below
              reflects the last 30 days.
            </p>
          </div>

          {connectionPhase === "ready" ? (
            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-2 lg:flex-nowrap">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#1877f2] px-4 py-2.5 text-sm font-bold text-white shadow-[0_6px_18px_rgba(24,119,242,0.3)] transition hover:bg-[#166fe5] sm:w-auto"
              >
                <Plus className="size-4 shrink-0" aria-hidden />
                Create campaign
              </button>
              <button
                type="button"
                onClick={() => void loadStats()}
                disabled={adStatsLoading}
                className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#e8edf5] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-[#f4f8ff] hover:text-[#1877f2] disabled:opacity-60 sm:w-auto"
              >
                <RefreshCw
                  className={`size-4 shrink-0 ${adStatsLoading ? "animate-spin" : ""}`}
                  aria-hidden
                />
                Refresh
              </button>
              <a
                href={adsManagerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#1877F2]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#1877F2] shadow-sm transition hover:bg-[#1877F2]/5 sm:w-auto"
              >
                Open Ads Manager
                <ExternalLink className="size-4 shrink-0" aria-hidden />
              </a>
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]">
          <div className="space-y-6 px-5 py-6 sm:px-6">
            {connectionPhase === "loading" ? (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Checking your Meta connection…
              </p>
            ) : null}

            {connectionPhase === "not_connected" ? (
              <div className="rounded-2xl border border-dashed border-[#e8edf5] bg-[#f4f8ff]/80 px-6 py-10 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white text-[#1877f2] shadow-sm ring-1 ring-[#e8edf5]">
                  <Link2 className="size-6" aria-hidden />
                </span>
                <p className="mt-4 text-base font-semibold text-[#07111f]">
                  Connect Facebook to get started
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Open{" "}
                  <span className="font-semibold text-[#07111f]">
                    Settings → Integrations
                  </span>{" "}
                  from your business dashboard to connect Facebook and unlock
                  campaign creation.
                </p>
              </div>
            ) : null}

            {connectionPhase === "needs_account" ? (
              <div className="rounded-2xl border border-[#e8edf5] bg-[#f4f8ff]/50 px-6 py-8 sm:flex sm:items-center sm:justify-between sm:gap-6">
                <div>
                  <p className="font-semibold text-[#07111f]">
                    Choose your ad account
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Facebook is connected. Pick which Meta ad account this
                    business should use for campaigns and reporting.
                  </p>
                </div>
                <Link
                  href={`/facebook/select-ad-account?businessId=${businessId}`}
                  className="mt-4 inline-flex shrink-0 rounded-xl bg-[#1877f2] px-5 py-3 text-sm font-bold text-white no-underline shadow-[0_6px_18px_rgba(24,119,242,0.3)] hover:bg-[#166fe5] sm:mt-0"
                >
                  Select ad account
                </Link>
              </div>
            ) : null}

            {connectionPhase === "ready" ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e8edf5] bg-gradient-to-r from-[#f4f8ff] to-white px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#dbeafe] bg-white shadow-[0_4px_12px_rgba(24,119,242,0.1)]">
                      <MetaLogo className="size-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#1877f2]">
                        Active ad account
                      </p>
                      <p className="m-0 mt-0.5 truncate text-sm font-bold text-[#07111f]">
                        {adStats?.adAccountName?.trim() || "Meta ad account"}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/facebook/select-ad-account?businessId=${businessId}`}
                    className="text-sm font-semibold text-[#1877f2] underline-offset-2 hover:underline"
                  >
                    Change account
                  </Link>
                </div>

                {adStatsLoading && !adStats ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-28 animate-pulse rounded-2xl bg-[#e8f2ff]"
                      />
                    ))}
                  </div>
                ) : null}

                {adStats && campaigns.length > 0 ? (
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
                        value={`${activeCount} of ${campaigns.length}`}
                        icon={TrendingUp}
                        tone="blue"
                        highlight
                      />
                    </div>

                    <div>
                      <div className="mb-4 flex items-center gap-2">
                        <BarChart3 className="size-4 text-[#1877f2]" aria-hidden />
                        <h3 className="text-sm font-semibold text-[#07111f]">
                          Ad account campaigns
                        </h3>
                        <span className="rounded-full bg-[#e8f2ff] px-2 py-0.5 text-xs font-medium text-slate-500">
                          {adStats.datePreset.replace(/_/g, " ")}
                        </span>
                      </div>
                      <ul className="grid gap-4 lg:grid-cols-2">
                        {campaigns.map((c) => (
                          <li
                            key={c.id}
                            className="rounded-2xl border border-[#e8edf5]/90 bg-white p-5 shadow-sm transition hover:border-[#1877f2]/30 hover:shadow-[0_8px_22px_rgba(24,119,242,0.08)]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-base font-semibold text-[#07111f]">
                                  {c.name}
                                </p>
                                <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                                  {c.id}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${statusBadgeClass(c.effectiveStatus)}`}
                                >
                                  {formatMetaDeliveryStatus(c.effectiveStatus)}
                                </span>
                                <button
                                  type="button"
                                  title="Delete campaign"
                                  disabled={deletingCampaignId === c.id}
                                  onClick={() => setCampaignPendingDelete(c)}
                                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
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
                                value={formatMetaSpend(c.insights?.spend, currency)}
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
                              <p className="mt-3 text-xs text-slate-500">
                                Daily budget:{" "}
                                <span className="font-semibold text-[#07111f]">
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

                {!adStatsLoading && adStats && campaigns.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#dbeafe] bg-gradient-to-b from-[#f8fbff] to-white px-6 py-12 text-center">
                    <span className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-[#dbeafe] bg-white shadow-[0_10px_24px_rgba(24,119,242,0.12)]">
                      <Megaphone
                        className="size-8 text-[#1877f2]"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </span>
                    <p className="mt-4 text-base font-extrabold text-[#07111f]">
                      No campaigns yet
                    </p>
                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                      Create a Meta campaign with the guided builder, or run ads
                      directly in Ads Manager. Campaigns from your ad account
                      appear here with performance metrics.
                    </p>
                    <button
                      type="button"
                      onClick={() => setCreateOpen(true)}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1877f2] px-4 py-2.5 text-sm font-bold text-white shadow-[0_6px_18px_rgba(24,119,242,0.3)] hover:bg-[#166fe5]"
                    >
                      <Plus className="size-4" aria-hidden />
                      Create campaign
                    </button>
                  </div>
                ) : null}
              </>
            ) : null}

            {adStatsError ? (
              <div
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800"
                role="alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <div>
                  <p className="font-medium">{adStatsError}</p>
                  <button
                    type="button"
                    onClick={() => void loadStats()}
                    disabled={adStatsLoading}
                    className="mt-2 text-xs font-semibold underline hover:no-underline disabled:opacity-60"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : null}

            {metaError ? (
              <div
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {metaError}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={campaignPendingDelete != null}
        itemName={campaignPendingDelete?.name?.trim() || "this campaign"}
        title="Delete this campaign?"
        description={
          <>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-[#1877f2]">
              {campaignPendingDelete?.name?.trim() || "this campaign"}
            </span>
            ? It will also be deleted from your Meta ads account. This cannot be
            undone.
          </>
        }
        confirmText="Delete campaign"
        checkboxLabel={
          campaignPendingDelete
            ? `Are you sure you want to delete ${
                campaignPendingDelete.name?.trim() || "this campaign"
              }? It will also be deleted from the Meta ads account.`
            : "Are you sure you want to delete it? It will also be deleted from the Meta ads account."
        }
        isLoading={deletingCampaignId != null}
        onConfirm={() => {
          void handleConfirmDeleteCampaign();
        }}
        onCancel={() => {
          if (deletingCampaignId == null) {
            setCampaignPendingDelete(null);
          }
        }}
      />

      <MetaCampaignBuilder
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        businessId={businessId}
        defaultName={campaignName}
        defaultWebsiteUrl={campaignWebsiteUrl}
        onDraftSaved={(draft) => {
          if (draft.status === "published" && draft.metaAdId) {
            void loadStats();
          }
        }}
      />
    </div>
  );
}
