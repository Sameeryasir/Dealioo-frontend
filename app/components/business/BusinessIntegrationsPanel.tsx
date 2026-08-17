"use client";

import { FacebookPermissionsPanel } from "@/app/components/facebook/FacebookPermissionsPanel";
import {
  FacebookLogo,
  GoogleAdsLogo,
  StripeLogo,
} from "@/app/components/landing/LandingIntegrationLogos";
import { connectFacebookInPopup } from "@/app/lib/facebook-oauth-popup";
import { connectGoogleAdsInPopup } from "@/app/lib/google-oauth-popup";
import { META_ADS_PERMISSION_OPTIONS } from "@/app/lib/meta-ads-permissions";
import { connectStripeInPopup } from "@/app/lib/stripe-oauth-popup";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { abortGoogleAdsConnect } from "@/app/services/google-ads/abort-google-ads-connect";
import { disconnectGoogleAds } from "@/app/services/google-ads/disconnect-google-ads";
import { abortFacebookConnect } from "@/app/services/facebook/abort-facebook-connect";
import { disconnectFacebook } from "@/app/services/facebook/disconnect-facebook";
import {
  getIntegrationsStatus,
  integrationsStatusQueryKey,
} from "@/app/services/integration-audit/get-integrations-status";
import { abortStripeConnect } from "@/app/services/stripe/abort-stripe-connect";
import { disconnectStripe } from "@/app/services/stripe/disconnect-stripe";
import { IntegrationAuditLogsCard } from "@/app/components/business/IntegrationAuditLogsCard";
import { AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState, type ReactNode } from "react";

type ConnectStatus = "idle" | "loading" | "error";

type BusinessIntegrationsPanelProps = {
  businessId: number;
};

const cardShellClass =
  "overflow-hidden rounded-[1.35rem] border border-[#E8EDF5] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.02] transition-shadow hover:shadow-[0_12px_32px_rgba(15,23,42,0.09)]";

function BrandMark({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden
      className="flex size-[3.35rem] shrink-0 items-center justify-center rounded-[1.05rem] bg-white ring-1 ring-black/[0.06]"
    >
      {children}
    </span>
  );
}

function StatusBadge({
  loading,
  connected,
}: {
  loading: boolean;
  connected: boolean;
}) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[0.65rem] font-medium text-slate-500 ring-1 ring-slate-200">
        <Loader2 className="size-2.5 animate-spin" strokeWidth={2.5} />
        Checking
      </span>
    );
  }
  if (!connected) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[0.65rem] font-semibold text-emerald-700 ring-1 ring-emerald-200">
      <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
      Connected
    </span>
  );
}

export function BusinessIntegrationsPanel({
  businessId,
}: BusinessIntegrationsPanelProps) {
  const queryClient = useQueryClient();
  const [stripeBusy, setStripeBusy] = useState<ConnectStatus>("idle");
  const [stripeActionError, setStripeActionError] = useState<string | null>(null);
  const [metaBusy, setMetaBusy] = useState<ConnectStatus>("idle");
  const [metaActionError, setMetaActionError] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState<ConnectStatus>("idle");
  const [googleActionError, setGoogleActionError] = useState<string | null>(null);
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);
  const bumpAuditLogs = useCallback(
    () => setAuditRefreshKey((n) => n + 1),
    [],
  );

  const statusQuery = useQuery({
    queryKey: integrationsStatusQueryKey(businessId),
    queryFn: () => getIntegrationsStatus(businessId),
    enabled: businessId > 0,
    staleTime: 30_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const statusLoading = statusQuery.isPending;
  const statusError =
    statusQuery.error instanceof Error
      ? statusQuery.error.message
      : statusQuery.error
        ? "Could not check integration connections."
        : null;

  const stripeConnected = Boolean(statusQuery.data?.stripe.connected);
  const stripeError = stripeActionError ?? statusError;

  const metaConnected = Boolean(statusQuery.data?.facebook.connected);
  const metaScopes = statusQuery.data?.facebook.metaOauthScopes ?? [];
  const metaMissingScopes =
    statusQuery.data?.facebook.missingRequiredScopes ?? [];
  const metaError = metaActionError ?? statusError;

  const googleConnected = Boolean(statusQuery.data?.googleAds.connected);
  const googleError = googleActionError ?? statusError;

  const refreshStatus = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: integrationsStatusQueryKey(businessId),
    });
  }, [businessId, queryClient]);

  const handleConnectStripe = async () => {
    setStripeBusy("loading");
    setStripeActionError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) throw new Error("You're signed out. Sign in again.");
      const result = await connectStripeInPopup(token, businessId);
      if (result.status === "connected") {
        await refreshStatus();
      } else {
        await abortStripeConnect(businessId);
        await refreshStatus();
      }
      setStripeBusy("idle");
      bumpAuditLogs();
    } catch (e) {
      setStripeBusy("error");
      setStripeActionError(
        e instanceof Error ? e.message : "Could not connect Stripe.",
      );
    }
  };

  const handleDisconnectStripe = async () => {
    if (!window.confirm("Remove Stripe from this business?")) return;
    setStripeBusy("loading");
    setStripeActionError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) throw new Error("You're signed out. Sign in again.");
      await disconnectStripe(token, businessId);
      await refreshStatus();
      setStripeBusy("idle");
      bumpAuditLogs();
    } catch (e) {
      setStripeBusy("error");
      setStripeActionError(
        e instanceof Error ? e.message : "Could not remove Stripe.",
      );
    }
  };

  const handleConnectMeta = async () => {
    setMetaBusy("loading");
    setMetaActionError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) throw new Error("You're signed out. Sign in again.");
      const scopes = META_ADS_PERMISSION_OPTIONS.map((opt) => opt.id);
      const result = await connectFacebookInPopup(token, businessId, scopes);
      if (result.status === "connected") {
        await refreshStatus();
      } else {
        await abortFacebookConnect(businessId);
        await refreshStatus();
      }
      setMetaBusy("idle");
      bumpAuditLogs();
    } catch (e) {
      setMetaBusy("error");
      setMetaActionError(
        e instanceof Error ? e.message : "Could not connect Meta Ads.",
      );
    }
  };

  const handleDisconnectMeta = async () => {
    if (!window.confirm("Remove Meta Ads from this business?")) return;
    setMetaBusy("loading");
    setMetaActionError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) throw new Error("You're signed out. Sign in again.");
      await disconnectFacebook(token, businessId);
      await refreshStatus();
      setMetaBusy("idle");
      bumpAuditLogs();
    } catch (e) {
      setMetaBusy("error");
      setMetaActionError(
        e instanceof Error ? e.message : "Could not remove Meta Ads.",
      );
    }
  };

  const handleConnectGoogle = async () => {
    setGoogleBusy("loading");
    setGoogleActionError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) throw new Error("You're signed out. Sign in again.");
      const result = await connectGoogleAdsInPopup(token, businessId);
      if (result.status === "connected") {
        await refreshStatus();
      } else {
        await abortGoogleAdsConnect(businessId);
        await refreshStatus();
      }
      setGoogleBusy("idle");
      bumpAuditLogs();
    } catch (e) {
      setGoogleBusy("error");
      setGoogleActionError(
        e instanceof Error ? e.message : "Could not connect Google Ads.",
      );
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm("Remove Google Ads from this business?")) return;
    setGoogleBusy("loading");
    setGoogleActionError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) throw new Error("You're signed out. Sign in again.");
      await disconnectGoogleAds(token, businessId);
      await refreshStatus();
      setGoogleBusy("idle");
      bumpAuditLogs();
    } catch (e) {
      setGoogleBusy("error");
      setGoogleActionError(
        e instanceof Error ? e.message : "Could not remove Google Ads.",
      );
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="m-0 text-sm leading-relaxed text-slate-500">
        Link payments and ad accounts to run campaigns and track performance.
      </p>

      <div className={cardShellClass}>
        <div className="h-1.5 bg-[#635BFF]" aria-hidden />
        <div className="flex flex-wrap items-center gap-4 px-4 py-4 sm:gap-5 sm:px-5">
          <BrandMark>
            <StripeLogo className="size-9" />
          </BrandMark>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="m-0 text-[0.95rem] font-bold tracking-tight text-slate-900">
                Stripe
              </p>
              <StatusBadge loading={statusLoading} connected={stripeConnected} />
            </div>
            <p className="m-0 mt-1 text-xs leading-relaxed text-slate-500">
              Accept payments from campaigns and funnels.
            </p>
          </div>
          {statusLoading ? null : stripeConnected ? (
            <button
              type="button"
              onClick={() => void handleDisconnectStripe()}
              disabled={stripeBusy === "loading"}
              className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-red-200 bg-red-50 px-3.5 text-xs font-semibold text-red-700 disabled:opacity-60"
            >
              {stripeBusy === "loading" ? "Removing…" : "Remove account"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleConnectStripe()}
              disabled={stripeBusy === "loading"}
              className="inline-flex h-9 cursor-pointer items-center rounded-lg bg-[#635BFF] px-3.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {stripeBusy === "loading" ? "Connecting…" : "Connect Stripe"}
            </button>
          )}
        </div>
        {stripeError ? (
          <p className="m-0 border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
            {stripeError}
          </p>
        ) : null}
      </div>

      <div className={cardShellClass}>
        <div className="h-1.5 bg-[#1877F2]" aria-hidden />
        <div className="space-y-3 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center gap-4 sm:gap-5">
            <BrandMark>
              <FacebookLogo className="size-9" />
            </BrandMark>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="m-0 text-[0.95rem] font-bold tracking-tight text-slate-900">
                  Meta Ads
                </p>
                <StatusBadge loading={statusLoading} connected={metaConnected} />
              </div>
              <p className="m-0 mt-1 text-xs leading-relaxed text-slate-500">
                Run and track Meta ad campaigns.
              </p>
            </div>
            {statusLoading ? null : metaConnected ? (
              <button
                type="button"
                onClick={() => void handleDisconnectMeta()}
                disabled={metaBusy === "loading"}
                className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-red-200 bg-red-50 px-3.5 text-xs font-semibold text-red-700 disabled:opacity-60"
              >
                {metaBusy === "loading" ? "Removing…" : "Remove account"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleConnectMeta()}
                disabled={metaBusy === "loading"}
                className="inline-flex h-9 cursor-pointer items-center rounded-lg bg-[#1877F2] px-3.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                {metaBusy === "loading" ? "Connecting…" : "Connect with Meta"}
              </button>
            )}
          </div>
          <FacebookPermissionsPanel
            grantedScopes={metaScopes}
            missingRequiredScopes={metaMissingScopes}
            connected={metaConnected}
            loading={statusLoading}
          />
          {metaError ? (
            <p
              role="alert"
              className="m-0 flex items-start gap-2 text-xs text-red-700"
            >
              <AlertCircle className="mt-px size-3.5 shrink-0" />
              {metaError}
            </p>
          ) : null}
        </div>
      </div>

      <div className={cardShellClass}>
        <div className="h-1.5 bg-[#34a853]" aria-hidden />
        <div className="flex flex-wrap items-center gap-4 px-4 py-4 sm:gap-5 sm:px-5">
          <BrandMark>
            <GoogleAdsLogo className="size-8" />
          </BrandMark>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="m-0 text-[0.95rem] font-bold tracking-tight text-slate-900">
                Google Ads
              </p>
              <StatusBadge
                loading={statusLoading}
                connected={googleConnected}
              />
            </div>
            <p className="m-0 mt-1 text-xs leading-relaxed text-slate-500">
              Pull spend, clicks, and campaign stats from Google Ads.
            </p>
          </div>
          {statusLoading ? null : googleConnected ? (
            <button
              type="button"
              onClick={() => void handleDisconnectGoogle()}
              disabled={googleBusy === "loading"}
              className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-red-200 bg-red-50 px-3.5 text-xs font-semibold text-red-700 disabled:opacity-60"
            >
              {googleBusy === "loading" ? "Removing…" : "Remove account"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleConnectGoogle()}
              disabled={googleBusy === "loading"}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[#34a853] px-3.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {googleBusy === "loading" ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Connecting…
                </>
              ) : (
                <>
                  <ExternalLink className="size-3.5" strokeWidth={2} />
                  Connect with Google
                </>
              )}
            </button>
          )}
        </div>
        {googleError ? (
          <p className="m-0 border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
            {googleError}
          </p>
        ) : null}
      </div>

      <IntegrationAuditLogsCard
        businessId={businessId}
        refreshKey={auditRefreshKey}
      />
    </div>
  );
}
