"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Check,
} from "lucide-react";
import { DeleteConfirmationDialog } from "@/app/components/shared/DeleteConfirmationDialog";
import type { GoogleDraftPickerAction } from "@/app/components/google-ads/campaign-builder/GoogleDraftPicker";
import {
  clearGoogleCampaignDraft,
  saveGoogleCampaignServerDraftId,
  saveGoogleDraftLocalMeta,
} from "@/app/components/google-ads/campaign-builder/draft-storage";
import { GoogleAdsConnectEmptyState } from "@/app/components/google-ads/GoogleAdsConnectEmptyState";
import { GoogleAdsLogo } from "@/app/components/landing/LandingIntegrationLogos";
import { Skeleton } from "@/app/components/skeleton";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { useBusinessMembershipPermissions } from "@/app/hooks/use-business-membership-permissions";
import { googleCampaignDraftQueryKeys } from "@/app/hooks/use-google-campaign-drafts-query";
import { deleteGoogleAdsCampaign } from "@/app/services/google-ads/delete-google-ads-campaign";
import {
  getGoogleAdsCampaignStats,
  type GoogleAdsCampaign,
  type GoogleAdsCampaignStats,
} from "@/app/services/google-ads/get-google-ads-campaign-stats";
import {
  updateGoogleAdsCampaign,
  updateGoogleAdsCampaignStatus,
} from "@/app/services/google-ads/update-google-ads-campaign";
import {
  getGoogleAdsConnectionStatus,
  isGoogleAdsCustomerSelected,
} from "@/app/services/google-ads/get-google-ads-connection-status";
import { listGoogleCampaignDrafts } from "@/app/services/google-ads/google-campaign-draft";

const GoogleAdsAnalyticsDashboard = dynamic(
  () =>
    import("@/app/components/campaign/GoogleAdsAnalyticsDashboard").then(
      (mod) => mod.GoogleAdsAnalyticsDashboard,
    ),
  { ssr: false },
);
const GoogleAdsCreateCampaignFlow = dynamic(
  () =>
    import("@/app/components/google-ads/GoogleAdsCreateCampaignFlow").then(
      (mod) => mod.GoogleAdsCreateCampaignFlow,
    ),
  { ssr: false },
);
const GoogleDraftPicker = dynamic(
  () =>
    import("@/app/components/google-ads/campaign-builder/GoogleDraftPicker").then(
      (mod) => mod.GoogleDraftPicker,
    ),
  { ssr: false },
);

function GoogleAdsPanelSkeleton() {
  return (
    <div
      className="-mx-1 space-y-6 rounded-3xl bg-white px-1 py-1 sm:px-2 sm:py-2"
      aria-busy="true"
      aria-label="Loading Google Ads"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-44 rounded-lg" />
            <Skeleton className="h-4 w-72 max-w-full rounded-lg" />
            <Skeleton className="h-4 w-56 max-w-full rounded-lg" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[5.5rem] rounded-2xl" />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.9fr)]">
        <div className="min-w-0 space-y-5">
          <div className="rounded-2xl border border-[#EEF2F7] bg-white p-4 sm:p-5">
            <Skeleton className="mb-4 h-5 w-40 rounded-lg" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <div className="rounded-2xl border border-[#EEF2F7] bg-white p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-32 rounded-lg" />
              <Skeleton className="h-9 w-52 rounded-lg" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[#EEF2F7] bg-white p-4 sm:p-5">
          <Skeleton className="mb-4 h-5 w-44 rounded-lg" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[4.5rem] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function isGoogleAuthError(message: string): boolean {
  return /google ads is not connected/i.test(message);
}

function friendlyGoogleAdsError(message: string): string {
  if (/could not refresh google ads access|stays active until you disconnect/i.test(message)) {
    return "Google Ads is still connected. Please try again in a moment.";
  }
  return message;
}

export function CampaignGoogleAdsPanel({
  businessId,
  embedded = false,
}: {
  businessId: number;
  embedded?: boolean;
}) {
  const { can } = useBusinessMembershipPermissions(businessId);
  const queryClient = useQueryClient();
  const canCreateGoogleCampaign = can("google_campaigns_create");
  const canDeleteGoogleCampaign = can("google_campaigns_delete");
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleCustomerSelected, setGoogleCustomerSelected] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(true);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [adStats, setAdStats] = useState<GoogleAdsCampaignStats | null>(null);
  const [adStatsLoading, setAdStatsLoading] = useState(false);
  const [adStatsError, setAdStatsError] = useState<string | null>(null);
  const [draftPickerOpen, setDraftPickerOpen] = useState(false);
  const [createCampaignOpen, setCreateCampaignOpen] = useState(false);
  const [campaignPendingDelete, setCampaignPendingDelete] =
    useState<GoogleAdsCampaign | null>(null);
  const [deletingCampaignId, setDeletingCampaignId] = useState<string | null>(
    null,
  );
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(
    null,
  );

  const openCreatePicker = useCallback(() => {
    if (!canCreateGoogleCampaign) return;
    setDraftPickerOpen(true);
  }, [canCreateGoogleCampaign]);

  const openBuilderFresh = useCallback(() => {
    clearGoogleCampaignDraft(businessId);
    saveGoogleCampaignServerDraftId(businessId, null);
    saveGoogleDraftLocalMeta(businessId, {
      draftId: null,
      serverVersion: null,
      updatedAt: new Date().toISOString(),
    });
    setCreateCampaignOpen(true);
  }, [businessId]);

  const openBuilderWithDraft = useCallback(
    (draftId: string) => {
      clearGoogleCampaignDraft(businessId);
      saveGoogleCampaignServerDraftId(businessId, draftId);
      saveGoogleDraftLocalMeta(businessId, {
        draftId,
        serverVersion: null,
        updatedAt: new Date().toISOString(),
      });
      setCreateCampaignOpen(true);
    },
    [businessId],
  );

  const handleDraftPickerSelect = useCallback(
    (action: GoogleDraftPickerAction) => {
      setDraftPickerOpen(false);
      if (action.type === "create") {
        openBuilderFresh();
        return;
      }
      openBuilderWithDraft(action.draft.id);
    },
    [openBuilderFresh, openBuilderWithDraft],
  );

  const invalidateGoogleDrafts = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: googleCampaignDraftQueryKeys.byBusiness(businessId),
    });
  }, [businessId, queryClient]);

  useEffect(() => {
    if (!googleConnected || !googleCustomerSelected) return;
    if (!canCreateGoogleCampaign) return;
    void queryClient.prefetchQuery({
      queryKey: googleCampaignDraftQueryKeys.byBusiness(businessId),
      queryFn: () => listGoogleCampaignDrafts(businessId),
      staleTime: 30_000,
    });
  }, [
    businessId,
    canCreateGoogleCampaign,
    googleConnected,
    googleCustomerSelected,
    queryClient,
  ]);

  const loadStats = useCallback(async () => {
    setAdStatsLoading(true);
    setAdStatsError(null);
    try {
      const stats = await getGoogleAdsCampaignStats(businessId);
      setAdStats(stats);
    } catch (e) {
      setAdStats(null);
      setAdStatsError(
        friendlyGoogleAdsError(
          e instanceof Error
            ? e.message
            : "Could not load Google Ads campaign stats.",
        ),
      );
    } finally {
      setAdStatsLoading(false);
    }
  }, [businessId]);

  const refreshConnection = useCallback(async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const token = getSetupAccessToken();
      if (!token) {
        setGoogleConnected(false);
        setGoogleCustomerSelected(false);
        return { connected: false, customerSelected: false };
      }
      const status = await getGoogleAdsConnectionStatus(token, businessId);
      const customerSelected = isGoogleAdsCustomerSelected(status.status);
      setGoogleConnected(status.connected);
      setGoogleCustomerSelected(customerSelected);
      return {
        connected: status.connected,
        customerSelected,
      };
    } catch (e) {
      setGoogleConnected(false);
      setGoogleCustomerSelected(false);
      setGoogleError(
        e instanceof Error ? e.message : "Could not check Google Ads.",
      );
      return { connected: false, customerSelected: false };
    } finally {
      setGoogleLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setAdStatsLoading(true);
      setAdStats(null);
      setAdStatsError(null);

      const { connected, customerSelected } =
        await refreshConnection();
      if (cancelled) return;

      if (!connected || !customerSelected) {
        setAdStatsLoading(false);
        return;
      }

      await loadStats();
    })();

    return () => {
      cancelled = true;
    };
  }, [businessId, refreshConnection, loadStats]);

  const handleConfirmDeleteCampaign = useCallback(async () => {
    if (!campaignPendingDelete) return;

    const campaign = campaignPendingDelete;
    setDeletingCampaignId(campaign.id);
    setAdStatsError(null);
    try {
      await deleteGoogleAdsCampaign(businessId, campaign.id);
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

  const handleToggleCampaignStatus = useCallback(
    async (
      campaign: GoogleAdsCampaign,
      status: "ENABLED" | "PAUSED",
    ) => {
      if (!canCreateGoogleCampaign) return;
      setStatusUpdatingId(campaign.id);
      setAdStatsError(null);
      try {
        await updateGoogleAdsCampaignStatus(businessId, campaign.id, status);
        setAdStats((prev) =>
          prev
            ? {
                ...prev,
                campaigns: prev.campaigns.map((c) =>
                  c.id === campaign.id
                    ? { ...c, status, effectiveStatus: status }
                    : c,
                ),
              }
            : prev,
        );
      } catch (e) {
        setAdStatsError(
          e instanceof Error
            ? e.message
            : "Could not update campaign status.",
        );
      } finally {
        setStatusUpdatingId(null);
      }
    },
    [businessId, canCreateGoogleCampaign],
  );

  const handleEditCampaign = useCallback(
    async (
      campaign: GoogleAdsCampaign,
      updates: {
        name: string;
        status: "ENABLED" | "PAUSED";
        dailyBudget: number;
      },
    ) => {
      if (!canCreateGoogleCampaign) return;
      setEditingCampaignId(campaign.id);
      setAdStatsError(null);
      try {
        const result = await updateGoogleAdsCampaign(
          businessId,
          campaign.id,
          updates,
        );
        setAdStats((prev) =>
          prev
            ? {
                ...prev,
                campaigns: prev.campaigns.map((c) =>
                  c.id === campaign.id
                    ? {
                        ...c,
                        name: result.name?.trim() || updates.name,
                        status: result.status || updates.status,
                        effectiveStatus: result.status || updates.status,
                        dailyBudget:
                          result.dailyBudget ?? String(updates.dailyBudget),
                      }
                    : c,
                ),
              }
            : prev,
        );
      } catch (e) {
        setAdStatsError(
          e instanceof Error
            ? e.message
            : "Could not update published campaign.",
        );
      } finally {
        setEditingCampaignId(null);
      }
    },
    [businessId, canCreateGoogleCampaign],
  );

  const adsConsoleUrl = "https://ads.google.com";

  const connectionReady =
    !googleLoading && googleConnected && googleCustomerSelected;

  const showSkeleton =
    googleLoading ||
    (googleConnected &&
      googleCustomerSelected &&
      adStats === null &&
      !adStatsError);

  const showAnalyticsDashboard =
    connectionReady && (adStats !== null || adStatsError !== null);

  const emptyStats: GoogleAdsCampaignStats = {
    customerId: null,
    customerName: null,
    currency: null,
    datePreset: "LAST_30_DAYS",
    campaigns: [],
  };

  const showCenteredEmpty = !showSkeleton && !showAnalyticsDashboard;

  return (
    <div
      className={
        embedded
          ? `relative box-border flex w-full min-w-0 overflow-visible bg-white px-3 sm:px-5 ${
              showCenteredEmpty
                ? "min-h-0 flex-1 items-center justify-center py-6"
                : "shrink-0 pb-20 pt-5 sm:pb-24 sm:pt-6"
            }`
          : `relative box-border flex w-full min-w-0 overflow-visible bg-white px-4 sm:px-8 ${
              showCenteredEmpty
                ? "min-h-[70vh] items-center justify-center py-8"
                : "shrink-0 py-8 pb-20 sm:py-10 sm:pb-24"
            }`
      }
    >
      <div
        className={`relative mx-auto w-full min-w-0 ${
          showSkeleton || showAnalyticsDashboard ? "max-w-[90rem] space-y-6" : "max-w-5xl"
        }`}
      >
        {showSkeleton ? (
          <GoogleAdsPanelSkeleton />
        ) : showAnalyticsDashboard ? (
          <GoogleAdsAnalyticsDashboard
            stats={adStats ?? emptyStats}
            insightsLoading={adStatsLoading}
            adsConsoleUrl={adsConsoleUrl}
            errorMessage={adStatsError ?? googleError}
            canCreateCampaign={canCreateGoogleCampaign}
            canDeleteCampaign={canDeleteGoogleCampaign}
            canManageCampaign={canCreateGoogleCampaign}
            onCreateCampaign={openCreatePicker}
            onRefresh={() => {
              void loadStats();
            }}
            onDeleteCampaign={(c) => {
              if (!canDeleteGoogleCampaign) return;
              setCampaignPendingDelete(c);
            }}
            onToggleCampaignStatus={(c, status) => {
              void handleToggleCampaignStatus(c, status);
            }}
            onEditCampaign={(c, updates) => {
              void handleEditCampaign(c, updates);
            }}
            deletingCampaignId={deletingCampaignId}
            statusUpdatingId={statusUpdatingId}
            editingCampaignId={editingCampaignId}
          />
        ) : (
          <div>
            {!googleConnected ? (
              <GoogleAdsConnectEmptyState
                businessId={businessId}
                title={
                  googleError && isGoogleAuthError(googleError)
                    ? "Reconnect Google Ads"
                    : "Connect Google Ads"
                }
                description={
                  googleError && isGoogleAuthError(googleError)
                    ? googleError
                    : "Open Settings → Integrations and connect your Google Ads account to unlock campaign analytics and insights."
                }
              />
            ) : null}

            {googleConnected && !googleCustomerSelected ? (
              <div className="w-full overflow-hidden rounded-[28px] border border-[#e8edf5] bg-white shadow-[0_18px_50px_-24px_rgba(15,23,42,0.28)]">
                <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <div className="relative flex min-h-[240px] items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#f3faf6_0%,#eef6f1_100%)] px-8 py-14 sm:min-h-[320px]">
                    <span className="pointer-events-none absolute left-1/2 top-1/2 size-[16rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#cfe8d8] sm:size-[20rem]" />
                    <span className="pointer-events-none absolute left-1/2 top-1/2 size-[11rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#cfe8d8] sm:size-[14rem]" />
                    <div className="relative flex size-28 items-center justify-center rounded-full bg-white shadow-[0_16px_40px_-18px_rgba(24,128,56,0.45)] ring-1 ring-[#e8edf5] sm:size-32">
                      <span className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 sm:size-[4.5rem]">
                        <Check className="size-8 sm:size-9" strokeWidth={2.5} aria-hidden />
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-12">
                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#e6f4ea] px-3 py-1 text-xs font-semibold text-[#137333]">
                      <GoogleAdsLogo className="size-3.5" />
                      Google linked
                    </span>
                    <h2 className="mt-4 text-[1.75rem] font-bold tracking-tight text-brand-navy sm:text-[2rem]">
                      Pick your Ads account
                    </h2>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-brand-muted sm:text-[0.95rem]">
                      Choose which Google Ads customer account powers this
                      business. Campaign stats and publishing will use that
                      account only.
                    </p>
                    <Link
                      href={`/google/select-customer?businessId=${businessId}`}
                      className="mt-8 inline-flex h-12 w-full items-center justify-between gap-3 rounded-xl bg-[#1a73e8] px-3 text-sm font-semibold text-white no-underline shadow-sm transition hover:bg-[#1558c0]"
                    >
                      <span className="flex size-8 items-center justify-center rounded-md bg-white text-emerald-600">
                        <Check className="size-4" strokeWidth={2.5} aria-hidden />
                      </span>
                      <span className="flex-1 text-center">
                        Choose Ads account
                      </span>
                      <ArrowRight className="mr-1 size-4 shrink-0" aria-hidden />
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}

            {googleError && googleConnected ? (
              <p
                className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {googleError}
              </p>
            ) : null}
          </div>
        )}
      </div>

      <DeleteConfirmationDialog
        open={campaignPendingDelete != null}
        itemName={campaignPendingDelete?.name?.trim() || "this campaign"}
        title="Delete this campaign from Google Ads?"
        description={
          <>
            This permanently removes{" "}
            <span className="font-semibold text-[#1877f2]">
              {campaignPendingDelete?.name?.trim() || "this campaign"}
            </span>{" "}
            and its ads from your linked Google Ads account as well as from
            Dealioo. This cannot be undone.
          </>
        }
        confirmText="Delete from Google Ads"
        checkboxLabel={
          campaignPendingDelete
            ? `I understand this deletes ${
                campaignPendingDelete.name?.trim() || "this campaign"
              } and its ads from Google Ads too.`
            : "I understand this deletes the campaign and its ads from Google Ads too."
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

      {draftPickerOpen ? (
        <GoogleDraftPicker
          open={draftPickerOpen}
          businessId={businessId}
          adsConsoleUrl={adsConsoleUrl}
          onClose={() => setDraftPickerOpen(false)}
          onSelect={handleDraftPickerSelect}
        />
      ) : null}

      {createCampaignOpen ? (
        <GoogleAdsCreateCampaignFlow
          open={createCampaignOpen}
          onClose={() => {
            setCreateCampaignOpen(false);
            invalidateGoogleDrafts();
          }}
          businessId={businessId}
          adsConsoleUrl={adsConsoleUrl}
        />
      ) : null}
    </div>
  );
}
