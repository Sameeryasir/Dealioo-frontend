"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
} from "lucide-react";
import { GoogleAdsAnalyticsDashboard } from "@/app/components/campaign/GoogleAdsAnalyticsDashboard";
import { DeleteConfirmationDialog } from "@/app/components/shared/DeleteConfirmationDialog";
import { GoogleAdsCreateCampaignFlow } from "@/app/components/google-ads/GoogleAdsCreateCampaignFlow";
import { Skeleton } from "@/app/components/skeleton";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { useBusinessMembershipPermissions } from "@/app/hooks/use-business-membership-permissions";
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
  const canCreateGoogleCampaign = can("google_campaigns_create");
  const canDeleteGoogleCampaign = can("google_campaigns_delete");
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleCustomerSelected, setGoogleCustomerSelected] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(true);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [adStats, setAdStats] = useState<GoogleAdsCampaignStats | null>(null);
  const [adStatsLoading, setAdStatsLoading] = useState(false);
  const [adStatsError, setAdStatsError] = useState<string | null>(null);
  const [createCampaignOpen, setCreateCampaignOpen] = useState(false);
  const [campaignPendingDelete, setCampaignPendingDelete] =
    useState<GoogleAdsCampaign | null>(null);
  const [deletingCampaignId, setDeletingCampaignId] = useState<string | null>(
    null,
  );

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
          showSkeleton || showAnalyticsDashboard ? "max-w-[90rem]" : "max-w-3xl"
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
            onCreateCampaign={() => {
              if (!canCreateGoogleCampaign) return;
              setCreateCampaignOpen(true);
            }}
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
          <div className="overflow-visible rounded-3xl border border-zinc-200/80 bg-white shadow-sm ring-1 ring-zinc-950/[0.03]">
            {!googleConnected ? (
              <div className="px-6 py-10 text-center sm:px-10">
                <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-zinc-50 ring-1 ring-zinc-200/80">
                  <GoogleLogo className="size-9 opacity-80" />
                </span>
                <p className="mt-5 text-lg font-bold text-zinc-900">
                  {googleError && isGoogleAuthError(googleError)
                    ? "Reconnect Google Ads"
                    : "Connect Google Ads"}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-600">
                  {googleError && isGoogleAuthError(googleError) ? (
                    googleError
                  ) : (
                    <>
                      Open{" "}
                      <span className="font-semibold text-zinc-800">
                        Settings → Integrations
                      </span>{" "}
                      and connect Google to unlock campaign analytics here.
                    </>
                  )}
                </p>
                <Link
                  href={`/business/${businessId}/dashboard/settings/integrations`}
                  className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#1877f2] px-6 py-3 text-sm font-semibold text-white no-underline transition hover:bg-[#166fe5]"
                >
                  Open Integrations
                </Link>
              </div>
            ) : null}

            {googleConnected && !googleCustomerSelected ? (
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
            ) : null}

            {googleError && googleConnected ? (
              <p
                className="m-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
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

      {createCampaignOpen ? (
        <GoogleAdsCreateCampaignFlow
          open={createCampaignOpen}
          onClose={() => setCreateCampaignOpen(false)}
          businessId={businessId}
          adsConsoleUrl={adsConsoleUrl}
        />
      ) : null}
    </div>
  );
}
