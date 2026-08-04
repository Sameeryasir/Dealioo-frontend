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
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { MetaCampaignBuilder } from "@/app/components/campaign/meta-builder/MetaCampaignBuilder";
import { MetaCampaignObjectiveDialog } from "@/app/components/campaign/meta-builder/MetaCampaignObjectiveDialog";
import { MetaLogo } from "@/app/components/landing/LandingIntegrationLogos";
import { DeleteConfirmationDialog } from "@/app/components/shared/DeleteConfirmationDialog";
import { MetricStatCardAccent } from "@/app/components/shared/MetricStatCard";
import {
  formatMetaCount,
  formatMetaDailyBudget,
  formatMetaDeliveryStatus,
  formatMetaSpend,
} from "@/app/lib/format-meta-ads";
import {
  clearMetaDraftLocalState,
  isResumableMetaDraft,
  readActiveMetaDraftId,
  readMetaDraftRecovery,
  writeActiveMetaDraftId,
} from "@/app/lib/meta-active-draft-storage";
import type {
  MetaCampaignDraft,
  MetaCampaignObjective,
} from "@/app/lib/meta-campaign-builder-types";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import {
  getFacebookAdCampaignStats,
  type FacebookAdCampaign,
  type FacebookAdCampaignStats,
} from "@/app/services/facebook/get-facebook-ad-campaign-stats";
import { getFacebookConnectionStatus } from "@/app/services/facebook/get-facebook-connection-status";
import { deleteFacebookCampaign } from "@/app/services/facebook/delete-facebook-campaign";
import {
  getMetaCampaignDraft,
  listMetaCampaignDrafts,
} from "@/app/services/facebook/meta-campaign-draft";
import { useQueryClient } from "@tanstack/react-query";
import { metaCampaignDraftQueryKeys } from "@/app/hooks/use-meta-campaign-drafts-query";

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
    return "bg-emerald-500/15 text-emerald-700 ring-emerald-500/25";
  }
  if (normalized === "PAUSED" || normalized.includes("PAUSED")) {
    return "bg-amber-500/15 text-amber-800 ring-amber-500/25";
  }
  return "bg-blue-500/15 text-blue-700 ring-blue-500/25";
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

type MetricTone = "blue" | "violet" | "emerald" | "amber";

const metricToneStyles: Record<
  MetricTone,
  { icon: string; value: string }
> = {
  blue: { icon: "bg-blue-500/10 text-blue-600", value: "text-blue-950" },
  violet: { icon: "bg-violet-500/10 text-violet-600", value: "text-violet-950" },
  emerald: {
    icon: "bg-emerald-500/10 text-emerald-600",
    value: "text-emerald-950",
  },
  amber: { icon: "bg-amber-500/10 text-amber-600", value: "text-amber-950" },
};

function CampaignMetric({
  icon: Icon,
  label,
  value,
  tone,
  loading,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  tone: MetricTone;
  loading?: boolean;
}) {
  const styles = metricToneStyles[tone];
  return (
    <div className="rounded-xl border border-zinc-100 bg-gradient-to-br from-white to-zinc-50/90 p-3.5 shadow-sm ring-1 ring-zinc-950/[0.03]">
      <div
        className={`mb-2.5 flex size-9 items-center justify-center rounded-lg ${styles.icon}`}
      >
        <Icon className="size-4" aria-hidden />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
        {label}
      </p>
      {loading ? (
        <div className="mt-0.5 h-5 w-16 animate-pulse rounded bg-zinc-100" />
      ) : (
        <p
          className={`mt-0.5 text-base font-bold tabular-nums tracking-tight ${styles.value}`}
        >
          {value}
        </p>
      )}
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
  const queryClient = useQueryClient();
  const [adStats, setAdStats] = useState<FacebookAdCampaignStats | null>(null);
  const [adStatsLoading, setAdStatsLoading] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [adStatsError, setAdStatsError] = useState<string | null>(null);
  const [objectiveOpen, setObjectiveOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedObjective, setSelectedObjective] =
    useState<MetaCampaignObjective | null>(null);
  const [activeDraft, setActiveDraft] = useState<MetaCampaignDraft | null>(null);
  const [builderDefaultName, setBuilderDefaultName] = useState(campaignName);
  const [objectiveCampaignLabel, setObjectiveCampaignLabel] = useState<
    string | null
  >(null);
  const [campaignPendingDelete, setCampaignPendingDelete] =
    useState<FacebookAdCampaign | null>(null);
  const [deletingCampaignId, setDeletingCampaignId] = useState<string | null>(
    null,
  );
  const [resumeDraftLoading, setResumeDraftLoading] = useState(false);

  const openBuilderWithDraft = useCallback(
    (draft: MetaCampaignDraft) => {
      setActiveDraft(draft);
      writeActiveMetaDraftId(businessId, draft.id);
      setSelectedObjective(
        (draft.campaignData?.objective as MetaCampaignObjective | undefined) ??
          null,
      );
      setBuilderDefaultName(
        draft.campaignData?.name?.trim() || campaignName || "",
      );
      setObjectiveOpen(false);
      setBuilderOpen(true);
    },
    [businessId, campaignName],
  );

  const findResumableDraft = useCallback(async (): Promise<MetaCampaignDraft | null> => {
    const storedId =
      readActiveMetaDraftId(businessId) ||
      readMetaDraftRecovery(businessId)?.draftId ||
      null;

    if (storedId) {
      try {
        const draft = await getMetaCampaignDraft(businessId, storedId);
        if (isResumableMetaDraft(draft)) return draft;
        if (
          (draft.status ?? "").toLowerCase() === "published" ||
          (draft.publishStatus ?? "").toUpperCase() === "PUBLISHED"
        ) {
          clearMetaDraftLocalState(businessId);
        }
      } catch {
        writeActiveMetaDraftId(businessId, null);
      }
    }

    try {
      const drafts = await listMetaCampaignDrafts(businessId);
      const resumable = drafts
        .filter(isResumableMetaDraft)
        .sort((a, b) => {
          const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return tb - ta;
        });
      return resumable[0] ?? null;
    } catch {
      return null;
    }
  }, [businessId]);

  const openObjectivePicker = useCallback(
    (fromCampaign?: FacebookAdCampaign | null) => {
      setActiveDraft(null);
      clearMetaDraftLocalState(businessId);
      setObjectiveCampaignLabel(fromCampaign?.name?.trim() || null);
      setBuilderDefaultName(
        fromCampaign?.name?.trim() || campaignName || "",
      );
      setSelectedObjective(null);
      setObjectiveOpen(true);
    },
    [businessId, campaignName],
  );

  const openCreateOrResume = useCallback(async () => {
    setResumeDraftLoading(true);
    try {
      const draft = await findResumableDraft();
      if (draft) {
        openBuilderWithDraft(draft);
        return;
      }

      const recovery = readMetaDraftRecovery(businessId);
      if (recovery?.campaignData) {
        setActiveDraft(null);
        setSelectedObjective(
          (recovery.campaignData.objective as MetaCampaignObjective) ?? null,
        );
        setBuilderDefaultName(
          recovery.campaignData.name?.trim() || campaignName || "",
        );
        setObjectiveOpen(false);
        setBuilderOpen(true);
        return;
      }

      setActiveDraft(null);
      setObjectiveCampaignLabel(null);
      setBuilderDefaultName(campaignName || "");
      setSelectedObjective(null);
      setObjectiveOpen(true);
    } finally {
      setResumeDraftLoading(false);
    }
  }, [businessId, campaignName, findResumableDraft, openBuilderWithDraft]);

  const handleObjectiveContinue = useCallback(
    (objective: MetaCampaignObjective) => {
      setActiveDraft(null);
      clearMetaDraftLocalState(businessId);
      setSelectedObjective(objective);
      setObjectiveOpen(false);
      setBuilderOpen(true);
    },
    [businessId],
  );

  const invalidateDrafts = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: metaCampaignDraftQueryKeys.byBusiness(businessId),
    });
  }, [businessId, queryClient]);

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

  const loadStats = useCallback(async (opts?: { refresh?: boolean }) => {
    setAdStatsLoading(true);
    setInsightsLoading(true);
    setAdStatsError(null);
    try {
      const stats = await getFacebookAdCampaignStats(businessId, {
        includeInsights: true,
        refresh: opts?.refresh,
      });
      setAdStats(stats);
    } catch (e) {
      setAdStats(null);
      setAdStatsError(
        e instanceof Error ? e.message : "Could not load Facebook ads.",
      );
    } finally {
      setAdStatsLoading(false);
      setInsightsLoading(false);
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
    let cancelled = false;

    void (async () => {
      const { connected, metaAdAccountId: accountId } =
        await refreshConnection();
      if (cancelled || !connected || !accountId) return;
      await loadStats();
    })();

    return () => {
      cancelled = true;
    };
  }, [businessId, refreshConnection, loadStats]);

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

  const handleDraftSaved = useCallback(
    (draft: MetaCampaignDraft) => {
      setActiveDraft(draft);
      writeActiveMetaDraftId(businessId, draft.id);
      if (
        (draft.status === "published" ||
          draft.publishStatus === "PUBLISHED") &&
        draft.metaAdId
      ) {
        clearMetaDraftLocalState(businessId);
        setActiveDraft(null);
        invalidateDrafts();
        void loadStats({ refresh: true });
      }
    },
    [businessId, invalidateDrafts, loadStats],
  );

  return (
    <div
      className={
        embedded
          ? "relative bg-white px-0 pb-10 pt-0"
          : "relative bg-gradient-to-b from-blue-50/40 via-white to-white px-4 py-8 sm:px-8 sm:py-10"
      }
    >
      <div
        className="pointer-events-none absolute -right-24 top-0 size-72 rounded-full bg-[#1877f2]/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 size-56 rounded-full bg-[#0081FB]/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-5xl space-y-6 pb-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#1877f2]/20 bg-white/80 px-3 py-1 text-xs font-semibold text-[#1877f2] shadow-sm backdrop-blur-sm">
              <Sparkles className="size-3.5" aria-hidden />
              Meta Ads performance
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-zinc-200/80">
                <MetaLogo className="size-7" />
              </span>
              <div className="min-w-0">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                  Meta ads
                </h2>
                <p className="text-sm text-zinc-500">Last 30 days, live sync</p>
              </div>
            </div>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">
              Track spend, impressions, reach, and clicks from your linked Meta
              ad account, all in one place.
            </p>
          </div>

          {connectionPhase === "ready" ? (
            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:flex-nowrap">
              <button
                type="button"
                onClick={() => {
                  void openCreateOrResume();
                }}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#1877f2] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#166fe5] sm:w-auto"
              >
                <Plus className="size-4 shrink-0" aria-hidden />
                Create campaign
              </button>
              <button
                type="button"
                onClick={() => void loadStats({ refresh: true })}
                disabled={adStatsLoading}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-zinc-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-[#f4f8ff] disabled:opacity-60 sm:w-auto"
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
                className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#e8edf5] bg-white px-4 py-2.5 text-sm font-semibold text-[#07111f] transition hover:border-[#1877f2]/35 hover:bg-[#f4f8ff] sm:w-auto"
              >
                Open Ads Manager
                <ExternalLink className="size-4 shrink-0" aria-hidden />
              </a>
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-3xl border border-zinc-200/70 bg-white/90 shadow-xl shadow-zinc-900/5 ring-1 ring-zinc-950/[0.04] backdrop-blur-sm">
          {connectionPhase === "loading" ? (
            <div className="flex items-center gap-3 border-b border-zinc-100 px-6 py-5">
              <Loader2
                className="size-5 animate-spin text-[#1877f2]"
                aria-hidden
              />
              <p className="text-sm font-medium text-zinc-600">
                Checking Meta connection…
              </p>
            </div>
          ) : null}

          {connectionPhase === "not_connected" ? (
            <div className="px-6 py-10 text-center sm:px-10">
              <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50 shadow-inner ring-1 ring-zinc-200/80">
                <MetaLogo className="size-9 opacity-80" />
              </span>
              <p className="mt-5 text-lg font-bold text-zinc-900">
                Connect Facebook
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-600">
                Open{" "}
                <span className="font-semibold text-zinc-800">
                  Settings → Integrations
                </span>{" "}
                and connect Facebook to unlock campaign analytics here.
              </p>
            </div>
          ) : null}

          {connectionPhase === "needs_account" ? (
            <div className="flex flex-col gap-5 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
                  <Check className="size-6" aria-hidden />
                </span>
                <div>
                  <p className="font-bold text-zinc-900">
                    Facebook linked, pick your ad account
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Choose which Meta ad account powers this business.
                  </p>
                </div>
              </div>
              <Link
                href={`/facebook/select-ad-account?businessId=${businessId}`}
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#1877f2] px-6 py-3 text-sm font-semibold text-white no-underline transition hover:bg-[#166fe0]"
              >
                Choose ad account
              </Link>
            </div>
          ) : null}

          {connectionPhase === "ready" ? (
            <div className="relative border-b border-[#1877f2]/20 bg-[#1877f2] px-6 py-5 sm:px-8">
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <MetaLogo className="size-7" />
                  </span>
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-white/90">
                      <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-70" />
                        <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                      </span>
                      Live connection
                    </p>
                    <p className="mt-0.5 text-lg font-bold text-white">
                      {adStats?.adAccountName?.trim() || "Meta ad account"}
                    </p>
                    {metaAdAccountId ? (
                      <p className="mt-0.5 font-mono text-xs text-white/85">
                        {metaAdAccountId.replace(/^act_/, "")}
                        {currency ? `, ${currency}` : ""}
                      </p>
                    ) : null}
                  </div>
                </div>
                <Link
                  href={`/facebook/select-ad-account?businessId=${businessId}`}
                  className="inline-flex shrink-0 items-center rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/25"
                >
                  Change account
                </Link>
              </div>
            </div>
          ) : null}

          <div className="space-y-8 p-5 sm:p-7">
            {connectionPhase === "ready" && adStatsLoading && !adStats ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-28 animate-pulse rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50"
                  />
                ))}
              </div>
            ) : null}

            {connectionPhase === "ready" &&
            adStats &&
            campaigns.length > 0 ? (
              <>
                <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricStatCardAccent
                    label="Total spend"
                    value={
                      insightsLoading
                        ? "…"
                        : formatMetaSpend(String(totalSpend), currency)
                    }
                    icon={Wallet}
                    tone="blue"
                  />
                  <MetricStatCardAccent
                    label="Impressions"
                    value={
                      insightsLoading
                        ? "…"
                        : formatMetaCount(String(totalImpressions))
                    }
                    icon={Eye}
                    tone="violet"
                  />
                  <MetricStatCardAccent
                    label="Reach"
                    value={
                      insightsLoading
                        ? "…"
                        : formatMetaCount(String(totalReach))
                    }
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
                  <div className="mb-5 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                        <BarChart3 className="size-4" aria-hidden />
                      </span>
                      <h3 className="text-base font-bold text-zinc-900">
                        Campaigns
                      </h3>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      {adStats.datePreset.replace(/_/g, " ")}
                    </span>
                    <span className="rounded-full bg-[#1877f2]/10 px-3 py-1 text-xs font-semibold text-[#1877f2]">
                      {campaigns.length} total
                    </span>
                  </div>

                  <ul className="grid gap-5 lg:grid-cols-2">
                    {campaigns.map((c) => (
                      <li
                        key={c.id}
                        className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 pr-14 shadow-sm ring-1 ring-zinc-950/[0.03] transition duration-300 hover:-translate-y-0.5 hover:border-[#1877f2]/30 hover:shadow-lg hover:shadow-blue-500/10"
                      >
                        <button
                          type="button"
                          onClick={() => openObjectivePicker(c)}
                          className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/35"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-lg font-bold tracking-tight text-zinc-900">
                                {c.name}
                              </p>
                              <p className="mt-1 font-mono text-[11px] text-zinc-400">
                                ID {c.id}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${statusBadgeClass(c.effectiveStatus)}`}
                            >
                              {formatMetaDeliveryStatus(c.effectiveStatus)}
                            </span>
                          </div>

                          <div className="mt-5 grid grid-cols-2 gap-3 pl-2">
                            <CampaignMetric
                              icon={Wallet}
                              label="Spent"
                              tone="blue"
                              loading={insightsLoading}
                              value={formatMetaSpend(
                                c.insights?.spend,
                                currency,
                              )}
                            />
                            <CampaignMetric
                              icon={Eye}
                              label="Impressions"
                              tone="violet"
                              loading={insightsLoading}
                              value={formatMetaCount(c.insights?.impressions)}
                            />
                            <CampaignMetric
                              icon={Users}
                              label="Reach"
                              tone="emerald"
                              loading={insightsLoading}
                              value={formatMetaCount(c.insights?.reach)}
                            />
                            <CampaignMetric
                              icon={MousePointerClick}
                              label="Clicks"
                              tone="amber"
                              loading={insightsLoading}
                              value={formatMetaCount(c.insights?.clicks)}
                            />
                          </div>

                          {c.dailyBudget ? (
                            <p className="mt-3 text-xs text-zinc-500">
                              Daily budget:{" "}
                              <span className="font-semibold text-zinc-900">
                                {formatMetaDailyBudget(
                                  c.dailyBudget,
                                  currency,
                                )}
                              </span>
                            </p>
                          ) : null}
                        </button>

                        <button
                          type="button"
                          title="Delete campaign"
                          disabled={deletingCampaignId === c.id}
                          onClick={() => setCampaignPendingDelete(c)}
                          className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
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
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}

            {connectionPhase === "ready" &&
            !adStatsLoading &&
            adStats &&
            campaigns.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-gradient-to-br from-zinc-50 to-white px-6 py-14 text-center">
                <Megaphone
                  className="mx-auto size-12 text-zinc-300"
                  aria-hidden
                />
                <p className="mt-4 text-lg font-bold text-zinc-900">
                  No campaigns yet
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
                  Create a Meta campaign with the guided builder, or run ads in
                  Ads Manager. Campaigns from your ad account appear here once
                  they have activity.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    void openCreateOrResume();
                  }}
                  className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#1877f2] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#166fe5]"
                >
                  <Plus className="size-4" aria-hidden />
                  Create campaign
                </button>
              </div>
            ) : null}

            {adStatsError ? (
              <div
                className="rounded-2xl border border-red-200/80 bg-gradient-to-br from-red-50 to-white px-5 py-4 shadow-sm"
                role="alert"
              >
                <p className="flex items-start gap-2 text-sm font-medium text-red-800">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {adStatsError}
                </p>
                <button
                  type="button"
                  onClick={() => void loadStats({ refresh: true })}
                  disabled={adStatsLoading}
                  className="mt-3 cursor-pointer rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-900 shadow-sm hover:bg-red-50 disabled:opacity-60"
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

      <MetaCampaignObjectiveDialog
        open={objectiveOpen}
        campaignLabel={objectiveCampaignLabel}
        onClose={() => setObjectiveOpen(false)}
        onContinue={handleObjectiveContinue}
      />

      <MetaCampaignBuilder
        open={builderOpen}
        onClose={() => {
          setBuilderOpen(false);
          setSelectedObjective(null);
          invalidateDrafts();
        }}
        businessId={businessId}
        defaultName={builderDefaultName || campaignName}
        defaultWebsiteUrl={campaignWebsiteUrl}
        initialObjective={selectedObjective}
        draftId={activeDraft?.id ?? null}
        initialDraft={activeDraft}
        autoStartPublish={
          activeDraft != null &&
          ((activeDraft.status ?? "").toLowerCase() === "publishing" ||
            ["QUEUED", "PUBLISHING", "RUNNING"].includes(
              (activeDraft.publishStatus ?? "").toUpperCase(),
            ))
        }
        onDraftSaved={handleDraftSaved}
      />

      {resumeDraftLoading ? (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-[#e8edf5] bg-white px-4 py-2 text-xs font-semibold text-[#1877f2] shadow-lg">
          Restoring your saved Meta campaign draft…
        </div>
      ) : null}
    </div>
  );
}
