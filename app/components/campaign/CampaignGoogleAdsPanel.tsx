"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
} from "lucide-react";
import { GoogleAdsAnalyticsDashboard } from "@/app/components/campaign/GoogleAdsAnalyticsDashboard";
import { DeleteConfirmationDialog } from "@/app/components/shared/DeleteConfirmationDialog";
import { GoogleAdsCreateCampaignFlow } from "@/app/components/google-ads/GoogleAdsCreateCampaignFlow";
import {
  GoogleDraftPicker,
  type GoogleDraftPickerAction,
} from "@/app/components/google-ads/campaign-builder/GoogleDraftPicker";
import {
  clearGoogleCampaignDraft,
  saveGoogleCampaignServerDraftId,
  saveGoogleDraftLocalMeta,
} from "@/app/components/google-ads/campaign-builder/draft-storage";
import { GoogleAdsConnectEmptyState } from "@/app/components/google-ads/GoogleAdsConnectEmptyState";
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
  getGoogleAdsConnectionStatus,
  isGoogleAdsCustomerSelected,
} from "@/app/services/google-ads/get-google-ads-connection-status";
import { listGoogleCampaignDrafts } from "@/app/services/google-ads/google-campaign-draft";

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
  return /invalid_grant|access expired|was revoked|reconnect google|not connected/i.test(
    message,
  );
}

function friendlyGoogleAdsError(message: string): string {
  if (/invalid_grant/i.test(message) || isGoogleAuthError(message)) {
    return "Google Ads access expired or was revoked. Reconnect Google Ads in Settings → Integrations.";
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
      // Keep stats loading true while we resolve connection + first stats fetch,
      // so the UI stays on skeleton instead of an empty white dashboard.
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
            onCreateCampaign={openCreatePicker}
            onRefresh={() => {
              void loadStats();
            }}
            onDeleteCampaign={(c) => {
              if (!canDeleteGoogleCampaign) return;
              setCampaignPendingDelete(c);
            }}
            deletingCampaignId={deletingCampaignId}
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
              <div className="overflow-visible rounded-3xl border border-zinc-200/80 bg-white shadow-sm ring-1 ring-zinc-950/[0.03]">
                <div className="flex flex-col gap-5 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                  <div className="flex items-start gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
                      <Check className="size-6" aria-hidden />
                    </span>
                    <div>
                      <p className="font-bold text-zinc-900">
                        Google linked, pick your Ads account
                      </p>
                      <p className="mt-1 text-sm text-zinc-600">
                        Choose which customer account powers this business.
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/google/select-customer?businessId=${businessId}`}
                    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#1877f2] px-6 py-3 text-sm font-semibold text-white no-underline transition hover:bg-[#166fe5]"
                  >
                    Choose Ads account
                  </Link>
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

      <GoogleDraftPicker
        open={draftPickerOpen}
        businessId={businessId}
        adsConsoleUrl={adsConsoleUrl}
        onClose={() => setDraftPickerOpen(false)}
        onSelect={handleDraftPickerSelect}
      />

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
