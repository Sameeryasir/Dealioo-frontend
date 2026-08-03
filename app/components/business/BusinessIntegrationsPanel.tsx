"use client";

import { FacebookPermissionsPanel } from "@/app/components/facebook/FacebookPermissionsPanel";
import {
  FacebookLogo,
  GoogleAdsLogo,
  StripeLogo,
} from "@/app/components/landing/LandingIntegrationLogos";
import { connectGoogleAdsInPopup } from "@/app/lib/google-oauth-popup";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { fetchBusinessById } from "@/app/services/business/get-my-business";
import { abortGoogleAdsConnect } from "@/app/services/google-ads/abort-google-ads-connect";
import { disconnectGoogleAds } from "@/app/services/google-ads/disconnect-google-ads";
import { getGoogleAdsConnectionStatus } from "@/app/services/google-ads/get-google-ads-connection-status";
import { disconnectFacebook } from "@/app/services/facebook/disconnect-facebook";
import { getFacebookConnectionStatus } from "@/app/services/facebook/get-facebook-connection-status";
import { disconnectStripe } from "@/app/services/stripe/disconnect-stripe";
import { AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

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
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(true);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [stripeBusy, setStripeBusy] = useState<ConnectStatus>("idle");

  const [metaConnected, setMetaConnected] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaScopes, setMetaScopes] = useState<string[]>([]);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [metaBusy, setMetaBusy] = useState<ConnectStatus>("idle");

  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleCustomerId, setGoogleCustomerId] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(true);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState<ConnectStatus>("idle");

  const refreshStripe = useCallback(async () => {
    setStripeLoading(true);
    setStripeError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) {
        setStripeConnected(false);
        return;
      }
      const business = await fetchBusinessById(token, businessId);
      setStripeConnected(Boolean(business.stripeAccountId?.trim()));
    } catch (e) {
      setStripeError(
        e instanceof Error ? e.message : "Could not check Stripe connection.",
      );
    } finally {
      setStripeLoading(false);
    }
  }, [businessId]);

  const refreshMeta = useCallback(async () => {
    setMetaLoading(true);
    setMetaError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) {
        setMetaConnected(false);
        return;
      }
      const status = await getFacebookConnectionStatus(token, businessId);
      setMetaConnected(Boolean(status.connected));
      setMetaScopes(status.metaOauthScopes ?? []);
    } catch (e) {
      setMetaError(
        e instanceof Error ? e.message : "Could not check Meta connection.",
      );
    } finally {
      setMetaLoading(false);
    }
  }, [businessId]);

  const refreshGoogle = useCallback(async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) {
        setGoogleConnected(false);
        setGoogleCustomerId(null);
        return;
      }
      const status = await getGoogleAdsConnectionStatus(token, businessId);
      setGoogleConnected(Boolean(status.connected));
      setGoogleCustomerId(status.customerId ?? null);
    } catch (e) {
      setGoogleError(
        e instanceof Error ? e.message : "Could not check Google Ads connection.",
      );
    } finally {
      setGoogleLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void refreshStripe();
    void refreshMeta();
    void refreshGoogle();
  }, [refreshStripe, refreshMeta, refreshGoogle]);

  const handleDisconnectStripe = async () => {
    if (!window.confirm("Remove Stripe from this business?")) return;
    setStripeBusy("loading");
    setStripeError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) throw new Error("You're signed out. Sign in again.");
      await disconnectStripe(token, businessId);
      setStripeConnected(false);
      setStripeBusy("idle");
    } catch (e) {
      setStripeBusy("error");
      setStripeError(
        e instanceof Error ? e.message : "Could not remove Stripe.",
      );
    }
  };

  const handleDisconnectMeta = async () => {
    if (!window.confirm("Remove Facebook from this business?")) return;
    setMetaBusy("loading");
    setMetaError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) throw new Error("You're signed out. Sign in again.");
      await disconnectFacebook(token, businessId);
      setMetaConnected(false);
      setMetaScopes([]);
      setMetaBusy("idle");
    } catch (e) {
      setMetaBusy("error");
      setMetaError(
        e instanceof Error ? e.message : "Could not remove Facebook.",
      );
    }
  };

  const handleConnectGoogle = async () => {
    setGoogleBusy("loading");
    setGoogleError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) throw new Error("You're signed out. Sign in again.");
      const result = await connectGoogleAdsInPopup(token, businessId);
      if (result.status === "connected") {
        await refreshGoogle();
      } else {
        await abortGoogleAdsConnect(businessId);
        await refreshGoogle();
      }
      setGoogleBusy("idle");
    } catch (e) {
      setGoogleBusy("error");
      setGoogleError(
        e instanceof Error ? e.message : "Could not connect Google Ads.",
      );
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm("Remove Google Ads from this business?")) return;
    setGoogleBusy("loading");
    setGoogleError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) throw new Error("You're signed out. Sign in again.");
      await disconnectGoogleAds(token, businessId);
      setGoogleConnected(false);
      setGoogleCustomerId(null);
      setGoogleBusy("idle");
    } catch (e) {
      setGoogleBusy("error");
      setGoogleError(
        e instanceof Error ? e.message : "Could not remove Google Ads.",
      );
    }
  };

  return (
    <div className="space-y-3.5">
      <p className="m-0 text-sm text-slate-500">
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
              <StatusBadge loading={stripeLoading} connected={stripeConnected} />
            </div>
            <p className="m-0 mt-1 text-xs leading-relaxed text-slate-500">
              Accept payments from campaigns and funnels.
            </p>
          </div>
          {stripeLoading ? null : stripeConnected ? (
            <button
              type="button"
              onClick={() => void handleDisconnectStripe()}
              disabled={stripeBusy === "loading"}
              className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-red-200 bg-red-50 px-3.5 text-xs font-semibold text-red-700 disabled:opacity-60"
            >
              {stripeBusy === "loading" ? "Removing…" : "Remove account"}
            </button>
          ) : (
            <a
              href={`/stripe/connect?businessId=${businessId}`}
              className="inline-flex h-9 items-center rounded-lg bg-[#635BFF] px-3.5 text-xs font-semibold text-white no-underline"
            >
              Connect Stripe
            </a>
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
                  Facebook / Meta Ads
                </p>
                <StatusBadge loading={metaLoading} connected={metaConnected} />
              </div>
              <p className="m-0 mt-1 text-xs leading-relaxed text-slate-500">
                Run and track Meta ad campaigns.
              </p>
            </div>
            {metaLoading ? null : metaConnected ? (
              <button
                type="button"
                onClick={() => void handleDisconnectMeta()}
                disabled={metaBusy === "loading"}
                className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-red-200 bg-red-50 px-3.5 text-xs font-semibold text-red-700 disabled:opacity-60"
              >
                {metaBusy === "loading" ? "Removing…" : "Remove account"}
              </button>
            ) : (
              <a
                href={`/facebook/connect?businessId=${businessId}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1877F2] px-3.5 text-xs font-semibold text-white no-underline"
              >
                <ExternalLink className="size-3.5" strokeWidth={2} />
                Connect with Facebook
              </a>
            )}
          </div>
          <FacebookPermissionsPanel
            grantedScopes={metaScopes}
            missingRequiredScopes={[]}
            connected={metaConnected}
            loading={metaLoading}
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
                loading={googleLoading}
                connected={googleConnected}
              />
            </div>
            <p className="m-0 mt-1 text-xs leading-relaxed text-slate-500">
              Pull spend, clicks, and campaign stats from Google Ads.
            </p>
            {googleConnected && googleCustomerId ? (
              <p className="m-0 mt-1 font-mono text-[0.7rem] text-slate-500">
                Customer ID {googleCustomerId}
              </p>
            ) : null}
          </div>
          {googleLoading ? null : googleConnected ? (
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
    </div>
  );
}
