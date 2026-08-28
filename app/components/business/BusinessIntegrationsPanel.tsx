"use client";

import { FacebookPermissionsPanel } from "@/app/components/facebook/FacebookPermissionsPanel";
import { MetaConnectPermissionsModal } from "@/app/components/facebook/MetaConnectPermissionsModal";
import {
  GoogleAdsLogo,
  MetaLogo,
  StripeLogo,
} from "@/app/components/landing/LandingIntegrationLogos";
import { connectFacebookInPopup } from "@/app/lib/facebook-oauth-popup";
import { connectGoogleAdsInPopup } from "@/app/lib/google-oauth-popup";
import {
  getDefaultSelectedMetaScopes,
  type MetaSelectableScopeId,
} from "@/app/lib/meta-ads-permissions";
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
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  Check,
  FileText,
  LineChart,
  Loader2,
  Megaphone,
  MousePointerClick,
  RefreshCw,
  Shield,
  Trash2,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState, type ReactNode } from "react";

type ConnectStatus = "idle" | "loading" | "error";

type BusinessIntegrationsPanelProps = {
  businessId: number;
};

const cardShellClass =
  "relative overflow-hidden rounded-xl border border-[#E8EDF5] bg-white shadow-[0_4px_12px_rgba(15,23,42,0.04)]";

const cardRowClass =
  "grid items-center gap-3 py-3 pl-4 pr-3.5 md:grid-cols-[auto_minmax(0,1.2fr)_minmax(9.5rem,0.75fr)_auto]";

const cardStatusClass =
  "flex min-w-0 items-center gap-2 border-t border-[#EEF2F7] pt-2 md:border-l md:border-t-0 md:pl-3.5 md:pt-0";

function StatusBadge({
  loading,
  connected,
}: {
  loading: boolean;
  connected: boolean;
}) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[0.62rem] font-semibold text-slate-500">
        <Loader2 className="size-2.5 animate-spin" strokeWidth={2.5} />
        Checking
      </span>
    );
  }
  if (connected) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.62rem] font-semibold text-emerald-700">
        <Check className="size-2.5" strokeWidth={2.75} />
        Connected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[0.62rem] font-semibold text-slate-500">
      Not connected
    </span>
  );
}

function FeatureRow({
  items,
  toneClass,
}: {
  items: Array<{ icon: LucideIcon; label: string }>;
  toneClass: string;
}) {
  return (
    <ul className={`mt-1.5 flex flex-wrap gap-x-3 gap-y-1 ${toneClass}`}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li
            key={item.label}
            className="inline-flex items-center gap-1 text-[0.65rem] font-medium"
          >
            <Icon className="size-3 shrink-0" strokeWidth={2.1} />
            {item.label}
          </li>
        );
      })}
    </ul>
  );
}

function ConnectedStatus({
  iconClass,
  icon: Icon,
}: {
  iconClass: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${iconClass}`}
      >
        <Icon className="size-3.5" />
      </span>
      <div>
        <p className="m-0 text-[0.62rem] font-semibold uppercase tracking-wide text-slate-400">
          Connected
        </p>
        <p className="m-0 text-xs font-semibold text-slate-800">Account linked</p>
      </div>
    </div>
  );
}

function PromptStatus({
  iconClass,
  borderClass,
  icon: Icon,
  text,
}: {
  iconClass: string;
  borderClass: string;
  icon: LucideIcon;
  text: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-full border border-dashed ${borderClass} ${iconClass}`}
      >
        <Icon className="size-3.5" />
      </span>
      <p className="m-0 text-xs leading-snug text-slate-500">{text}</p>
    </div>
  );
}

function GoogleGMark({ className }: { className?: string }) {
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

function IntegrationCard({
  accentColor,
  logo,
  title,
  description,
  features,
  featureToneClass,
  loading,
  connected,
  status,
  actions,
  error,
  footer,
}: {
  accentColor: string;
  logo: ReactNode;
  title: string;
  description: string;
  features: Array<{ icon: LucideIcon; label: string }>;
  featureToneClass: string;
  loading: boolean;
  connected: boolean;
  status: ReactNode;
  actions: ReactNode;
  error?: string | null;
  footer?: ReactNode;
}) {
  return (
    <article className={cardShellClass}>
      <span
        className={`absolute inset-y-0 left-0 w-1 ${accentColor}`}
        aria-hidden
      />
      <div className={cardRowClass}>
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#F4F7FB] ring-1 ring-black/[0.04]"
        >
          {logo}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="m-0 text-sm font-bold tracking-tight text-slate-900">
              {title}
            </h3>
            <StatusBadge loading={loading} connected={connected} />
          </div>
          <p className="m-0 mt-0.5 text-xs text-slate-500">{description}</p>
          <FeatureRow items={features} toneClass={featureToneClass} />
        </div>
        <div className={cardStatusClass}>{status}</div>
        <div className="flex flex-col gap-1.5 md:min-w-[9.75rem]">{actions}</div>
      </div>
      {error ? (
        <p
          role="alert"
          className="m-0 flex items-start gap-2 border-t border-red-100 bg-red-50 px-3.5 py-1.5 text-[0.7rem] text-red-700"
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
      {footer ? (
        <div className="border-t border-[#EEF2F7] bg-[#F8FBFF] px-4 py-3.5">
          {footer}
        </div>
      ) : null}
    </article>
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
  const [showMetaPermissions, setShowMetaPermissions] = useState(false);
  const [metaConnectModalOpen, setMetaConnectModalOpen] = useState(false);
  const [selectedMetaScopes, setSelectedMetaScopes] = useState<
    MetaSelectableScopeId[]
  >(() => getDefaultSelectedMetaScopes());
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

  useEffect(() => {
    if (!metaConnected) return;
    setMetaConnectModalOpen(false);
    setMetaActionError(null);
    setMetaBusy("idle");
  }, [metaConnected]);

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

  const openMetaConnectModal = () => {
    setMetaActionError(null);
    setSelectedMetaScopes(getDefaultSelectedMetaScopes());
    setMetaConnectModalOpen(true);
  };

  const closeMetaConnectModal = useCallback(() => {
    setMetaConnectModalOpen(false);
    setMetaActionError(null);
    if (metaBusy === "loading") {
      setMetaBusy("idle");
    }
  }, [metaBusy]);

  const handleConnectMeta = async () => {
    if (selectedMetaScopes.length === 0) {
      setMetaBusy("error");
      setMetaActionError("Select at least one Meta permission to continue.");
      return;
    }
    setMetaBusy("loading");
    setMetaActionError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) throw new Error("You're signed out. Sign in again.");
      const result = await connectFacebookInPopup(
        token,
        businessId,
        selectedMetaScopes,
      );
      await refreshStatus();
      bumpAuditLogs();
      if (result.status === "connected") {
        setMetaConnectModalOpen(false);
        setMetaActionError(null);
        setMetaBusy("idle");
        return;
      }
      await abortFacebookConnect(businessId);
      await refreshStatus();
      setMetaBusy("idle");
      setMetaActionError("Meta connect was cancelled. You can try again.");
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
      setShowMetaPermissions(false);
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

  const actionBtn =
    "inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-lg px-3 text-xs font-semibold disabled:opacity-60";

  return (
    <div className="flex flex-col gap-2.5">
      <IntegrationCard
        accentColor="bg-[#635BFF]"
        logo={<StripeLogo className="size-6" />}
        title="Stripe"
        description="Accept payments from campaigns and funnels."
        featureToneClass="text-[#635BFF]"
        features={[
          { icon: Shield, label: "Secure payments" },
          { icon: FileText, label: "Invoices & history" },
          { icon: RefreshCw, label: "Automatic sync" },
        ]}
        loading={statusLoading}
        connected={stripeConnected}
        error={stripeError}
        status={
          stripeConnected ? (
            <ConnectedStatus
              icon={CalendarDays}
              iconClass="bg-[#F3F0FF] text-[#635BFF]"
            />
          ) : (
            <PromptStatus
              icon={Shield}
              iconClass="text-[#635BFF]"
              borderClass="border-[#D9D4FF]"
              text="Connect Stripe to accept payments from campaigns and funnels."
            />
          )
        }
        actions={
          statusLoading ? null : stripeConnected ? (
            <button
              type="button"
              onClick={() => void handleDisconnectStripe()}
              disabled={stripeBusy === "loading"}
              className={`${actionBtn} border border-red-200 bg-red-50 text-red-600`}
            >
              <Trash2 className="size-3" strokeWidth={2.25} />
              {stripeBusy === "loading" ? "Removing…" : "Remove account"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleConnectStripe()}
              disabled={stripeBusy === "loading"}
              className={`${actionBtn} bg-[#635BFF] text-white`}
            >
              {stripeBusy === "loading" ? "Connecting…" : "Connect Stripe"}
            </button>
          )
        }
      />

      <IntegrationCard
        accentColor="bg-[#1877F2]"
        logo={<MetaLogo className="size-6" />}
        title="Meta Ads"
        description="Run and track Meta ad campaigns."
        featureToneClass="text-[#1877F2]"
        features={[
          { icon: BarChart3, label: "Ad performance" },
          { icon: Users, label: "Audience insights" },
          { icon: RefreshCw, label: "Campaign tracking" },
        ]}
        loading={statusLoading}
        connected={metaConnected}
        error={metaError}
        status={
          metaConnected ? (
            <ConnectedStatus
              icon={CalendarDays}
              iconClass="bg-[#E8F1FF] text-[#1877F2]"
            />
          ) : (
            <PromptStatus
              icon={Megaphone}
              iconClass="text-[#1877F2]"
              borderClass="border-[#C5D8F6]"
              text="Connect your Meta Ads account to start running and tracking campaigns."
            />
          )
        }
        actions={
          statusLoading ? null : metaConnected ? (
            <>
              <button
                type="button"
                onClick={() => setShowMetaPermissions((open) => !open)}
                className={`${actionBtn} border border-[#C5D8F6] bg-[#E8F1FF] text-[#1877F2]`}
              >
                <Shield className="size-3" strokeWidth={2.25} />
                {showMetaPermissions ? "Hide permissions" : "Show permissions"}
              </button>
              <button
                type="button"
                onClick={() => void handleDisconnectMeta()}
                disabled={metaBusy === "loading"}
                className={`${actionBtn} border border-red-200 bg-red-50 text-red-600`}
              >
                <Trash2 className="size-3" strokeWidth={2.25} />
                {metaBusy === "loading" ? "Removing…" : "Remove account"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={openMetaConnectModal}
              disabled={metaBusy === "loading"}
              className={`${actionBtn} gap-1.5 bg-[#1877F2] text-white`}
            >
              <MetaLogo className="size-3.5 text-white" monochrome />
              Connect with Meta
            </button>
          )
        }
      />

      <MetaConnectPermissionsModal
        open={metaConnectModalOpen && !metaConnected}
        selectedScopes={selectedMetaScopes}
        onChangeScopes={setSelectedMetaScopes}
        connecting={metaBusy === "loading"}
        error={metaActionError}
        onClose={closeMetaConnectModal}
        onContinue={() => void handleConnectMeta()}
      />

      {showMetaPermissions && metaConnected ? (
        <FacebookPermissionsPanel
          grantedScopes={metaScopes}
          missingRequiredScopes={metaMissingScopes}
          connected={metaConnected}
          loading={statusLoading}
        />
      ) : null}

      <IntegrationCard
        accentColor="bg-[#34A853]"
        logo={<GoogleAdsLogo className="size-6" />}
        title="Google Ads"
        description="Pull spend, clicks, and campaign stats from Google Ads."
        featureToneClass="text-[#188038]"
        features={[
          { icon: Wallet, label: "Spend insights" },
          { icon: MousePointerClick, label: "Click tracking" },
          { icon: LineChart, label: "Campaign stats" },
        ]}
        loading={statusLoading}
        connected={googleConnected}
        error={googleError}
        status={
          googleConnected ? (
            <ConnectedStatus
              icon={CalendarDays}
              iconClass="bg-[#E8F5EE] text-[#188038]"
            />
          ) : (
            <PromptStatus
              icon={BarChart3}
              iconClass="text-[#188038]"
              borderClass="border-[#B7E0C4]"
              text="Connect your Google Ads account to import data and monitor performance."
            />
          )
        }
        actions={
          statusLoading ? null : googleConnected ? (
            <button
              type="button"
              onClick={() => void handleDisconnectGoogle()}
              disabled={googleBusy === "loading"}
              className={`${actionBtn} border border-red-200 bg-red-50 text-red-600`}
            >
              <Trash2 className="size-3" strokeWidth={2.25} />
              {googleBusy === "loading" ? "Removing…" : "Remove account"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleConnectGoogle()}
              disabled={googleBusy === "loading"}
              className={`${actionBtn} gap-1.5 bg-[#34A853] text-white`}
            >
              {googleBusy === "loading" ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Connecting…
                </>
              ) : (
                <>
                  <span className="flex size-4 items-center justify-center rounded-full bg-white">
                    <GoogleGMark className="size-2.5" />
                  </span>
                  Connect with Google
                </>
              )}
            </button>
          )
        }
      />

      <IntegrationAuditLogsCard
        businessId={businessId}
        refreshKey={auditRefreshKey}
      />
    </div>
  );
}
