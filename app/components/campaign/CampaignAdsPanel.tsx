"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Loader2,
} from "lucide-react";
import { MetaAdsAnalyticsDashboard } from "@/app/components/campaign/MetaAdsAnalyticsDashboard";
import { MetaCampaignBuilder } from "@/app/components/campaign/meta-builder/MetaCampaignBuilder";
import { MetaCampaignObjectiveDialog } from "@/app/components/campaign/meta-builder/MetaCampaignObjectiveDialog";
import {
  MetaDraftPicker,
  type MetaDraftPickerAction,
} from "@/app/components/campaign/meta-builder/MetaDraftPicker";
import { MetaLogo } from "@/app/components/landing/LandingIntegrationLogos";
import { DeleteConfirmationDialog } from "@/app/components/shared/DeleteConfirmationDialog";
import {
  clearMetaDraftLocalState,
  isResumableMetaDraft,
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
  META_CAMPAIGN_PAGE_SIZE,
  type FacebookAdCampaign,
  type FacebookAdCampaignStats,
} from "@/app/services/facebook/get-facebook-ad-campaign-stats";
import { getFacebookConnectionStatus } from "@/app/services/facebook/get-facebook-connection-status";
import { deleteFacebookCampaign } from "@/app/services/facebook/delete-facebook-campaign";
import {
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
  const [draftPickerOpen, setDraftPickerOpen] = useState(false);
  const [autoStartPublish, setAutoStartPublish] = useState(false);
  const [campaignPage, setCampaignPage] = useState(1);
  const [campaignQuery, setCampaignQuery] = useState("");
  const [campaignSearchInput, setCampaignSearchInput] = useState("");
  const initialStatsLoadRef = useRef(true);
  const statsRequestIdRef = useRef(0);

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

  const openObjectivePicker = useCallback(
    (fromCampaign?: FacebookAdCampaign | null) => {
      setActiveDraft(null);
      setAutoStartPublish(false);
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
      const drafts = await listMetaCampaignDrafts(businessId);
      const hasOpenDrafts = drafts.some(isResumableMetaDraft);
      if (hasOpenDrafts) {
        setDraftPickerOpen(true);
        return;
      }

      const recovery = readMetaDraftRecovery(businessId);
      if (recovery?.campaignData) {
        setActiveDraft(null);
        setAutoStartPublish(false);
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
      setAutoStartPublish(false);
      setObjectiveCampaignLabel(null);
      setBuilderDefaultName(campaignName || "");
      setSelectedObjective(null);
      setObjectiveOpen(true);
    } finally {
      setResumeDraftLoading(false);
    }
  }, [businessId, campaignName]);

  const handleDraftPickerSelect = useCallback(
    (action: MetaDraftPickerAction) => {
      setDraftPickerOpen(false);
      if (action.type === "create") {
        setAutoStartPublish(false);
        openObjectivePicker();
        return;
      }
      const shouldAutoPublish =
        action.type === "retry" || action.type === "progress";
      setAutoStartPublish(shouldAutoPublish);
      openBuilderWithDraft(action.draft);
    },
    [openBuilderWithDraft, openObjectivePicker],
  );

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

  const loadStats = useCallback(async (opts?: {
    refresh?: boolean;
    silent?: boolean;
    page?: number;
    query?: string;
  }) => {
    const silent = opts?.silent === true;
    const page = opts?.page ?? campaignPage;
    const query = opts?.query ?? campaignQuery;
    const requestId = ++statsRequestIdRef.current;
    if (!silent) {
      setAdStatsLoading(true);
      setInsightsLoading(true);
      setAdStatsError(null);
    }
    try {
      const stats = await getFacebookAdCampaignStats(businessId, {
        includeInsights: true,
        refresh: opts?.refresh,
        page,
        pageSize: META_CAMPAIGN_PAGE_SIZE,
        query: query || undefined,
      });
      if (requestId !== statsRequestIdRef.current) return;
      setAdStats(stats);
      setAdStatsError(null);

      if (!opts?.refresh && stats.isStale) {
        if (!silent) {
          setAdStatsLoading(false);
          setInsightsLoading(false);
        }
        const refreshId = ++statsRequestIdRef.current;
        void getFacebookAdCampaignStats(businessId, {
          includeInsights: true,
          refresh: true,
          page,
          pageSize: META_CAMPAIGN_PAGE_SIZE,
          query: query || undefined,
        })
          .then((fresh) => {
            if (refreshId !== statsRequestIdRef.current) return;
            setAdStats(fresh);
          })
          .catch(() => {});
        return;
      }
    } catch (e) {
      if (requestId !== statsRequestIdRef.current) return;
      if (!silent) {
        setAdStats(null);
        setAdStatsError(
          e instanceof Error ? e.message : "Could not load Facebook ads.",
        );
      }
    } finally {
      if (!silent && requestId === statsRequestIdRef.current) {
        setAdStatsLoading(false);
        setInsightsLoading(false);
      }
    }
  }, [businessId, campaignPage, campaignQuery]);

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
    initialStatsLoadRef.current = true;
    setCampaignPage(1);
    setCampaignQuery("");
    setCampaignSearchInput("");
    setAdStats(null);
  }, [businessId]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = campaignSearchInput.trim();
      setCampaignQuery((prev) => {
        if (prev === next) return prev;
        setCampaignPage(1);
        return next;
      });
    }, 300);
    return () => window.clearTimeout(id);
  }, [campaignSearchInput]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await refreshConnection();
      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
  }, [businessId, refreshConnection]);

  useEffect(() => {
    if (connectionPhase !== "ready") return;
    const silent = !initialStatsLoadRef.current;
    initialStatsLoadRef.current = false;
    void loadStats({ silent });
  }, [campaignPage, campaignQuery, connectionPhase, loadStats]);

  useEffect(() => {
    if (connectionPhase !== "ready") return;
    const id = window.setInterval(() => {
      void loadStats({ silent: true });
    }, 10 * 60_000);
    return () => window.clearInterval(id);
  }, [connectionPhase, loadStats]);

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

  const showAnalyticsDashboard = connectionPhase === "ready";

  const emptyStats: FacebookAdCampaignStats = {
    adAccountName: null,
    currency: null,
    datePreset: "last_30d",
    campaigns: [],
    dailyInsights: [],
    breakdowns: null,
    summary: null,
    pagination: {
      page: 1,
      pageSize: META_CAMPAIGN_PAGE_SIZE,
      total: 0,
      totalPages: 1,
      query: null,
    },
  };

  return (
    <div
      className={
        embedded
          ? "relative box-border w-full min-w-0 shrink-0 overflow-visible bg-white px-3 pb-20 pt-5 sm:px-5 sm:pb-24 sm:pt-6"
          : "relative box-border w-full min-w-0 shrink-0 overflow-visible bg-white px-4 py-8 pb-20 sm:px-8 sm:py-10 sm:pb-24"
      }
    >
      <div
        className={`relative mx-auto w-full min-w-0 space-y-6 ${
          showAnalyticsDashboard ? "max-w-[90rem]" : "max-w-3xl"
        }`}
      >
        {showAnalyticsDashboard ? (
          <MetaAdsAnalyticsDashboard
            stats={adStats ?? emptyStats}
            insightsLoading={insightsLoading || adStatsLoading}
            adsManagerUrl={adsManagerUrl}
            errorMessage={adStatsError}
            campaignSearch={campaignSearchInput}
            onCampaignSearchChange={setCampaignSearchInput}
            onCampaignPageChange={setCampaignPage}
            onCreateCampaign={() => {
              void openCreateOrResume();
            }}
            onRefresh={() => {
              void loadStats({ refresh: true });
            }}
            onDeleteCampaign={(c) => setCampaignPendingDelete(c)}
            deletingCampaignId={deletingCampaignId}
          />
        ) : (
          <div className="overflow-visible rounded-3xl border border-zinc-200/80 bg-white shadow-sm ring-1 ring-zinc-950/[0.03]">
            {connectionPhase === "loading" ? (
              <div className="flex items-center gap-3 px-6 py-10">
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
                <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-zinc-50 ring-1 ring-zinc-200/80">
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

            {metaError ? (
              <p
                className="mx-6 mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {metaError}
              </p>
            ) : null}
          </div>
        )}
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

      <MetaDraftPicker
        open={draftPickerOpen}
        businessId={businessId}
        metaAdAccountId={metaAdAccountId}
        onClose={() => setDraftPickerOpen(false)}
        onSelect={handleDraftPickerSelect}
      />

      <MetaCampaignBuilder
        open={builderOpen}
        onClose={() => {
          setBuilderOpen(false);
          setSelectedObjective(null);
          setAutoStartPublish(false);
          invalidateDrafts();
        }}
        businessId={businessId}
        defaultName={builderDefaultName || campaignName}
        defaultWebsiteUrl={campaignWebsiteUrl}
        initialObjective={selectedObjective}
        draftId={activeDraft?.id ?? null}
        initialDraft={activeDraft}
        autoStartPublish={
          autoStartPublish ||
          (activeDraft != null &&
            ((activeDraft.status ?? "").toLowerCase() === "publishing" ||
              ["QUEUED", "PUBLISHING", "RUNNING"].includes(
                (activeDraft.publishStatus ?? "").toUpperCase(),
              )))
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
