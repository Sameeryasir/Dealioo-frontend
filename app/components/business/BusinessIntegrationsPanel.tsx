"use client";

import { ChooseNumberDialog } from "@/app/components/business/ChooseNumberDialog";
import { ConnectTwilioCredentialsDialog } from "@/app/components/business/ConnectTwilioCredentialsDialog";
import { IntegrationAuditLogsCard } from "@/app/components/business/IntegrationAuditLogsCard";
import { MetaConnectPermissionsModal } from "@/app/components/facebook/MetaConnectPermissionsModal";
import { DeleteConfirmationDialog } from "@/app/components/shared/DeleteConfirmationDialog";
import {
  GoogleAdsLogo,
  MetaLogo,
  StripeLogo,
} from "@/app/components/landing/LandingIntegrationLogos";
import {
  useBusinessTwilioPhoneNumbersQuery,
  useDisconnectBusinessTwilioCredentialsMutation,
} from "@/app/hooks/use-business-twilio-phone-numbers-query";
import {
  connectFacebookInPopup,
  consumeFacebookOAuthStatusSync,
  FACEBOOK_OAUTH_AUTHENTICATED_MESSAGE,
  FACEBOOK_OAUTH_COMPLETE_MESSAGE,
  FACEBOOK_OAUTH_STATUS_SYNC_KEY,
} from "@/app/lib/facebook-oauth-popup";
import { connectGoogleAdsInPopup } from "@/app/lib/google-oauth-popup";
import {
  getDefaultSelectedMetaScopes,
  type MetaSelectableScopeId,
} from "@/app/lib/meta-ads-permissions";
import { connectStripeInPopup } from "@/app/lib/stripe-oauth-popup";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { businessQueryKeys } from "@/app/services/business/business-query-keys";
import { abortGoogleAdsConnect } from "@/app/services/google-ads/abort-google-ads-connect";
import { disconnectGoogleAds } from "@/app/services/google-ads/disconnect-google-ads";
import { isGoogleAdsCustomerSelected } from "@/app/services/google-ads/get-google-ads-connection-status";
import { abortFacebookConnect } from "@/app/services/facebook/abort-facebook-connect";
import { disconnectFacebook } from "@/app/services/facebook/disconnect-facebook";
import {
  getIntegrationsStatus,
  integrationsStatusQueryKey,
} from "@/app/services/integration-audit/get-integrations-status";
import { abortStripeConnect } from "@/app/services/stripe/abort-stripe-connect";
import { disconnectStripe } from "@/app/services/stripe/disconnect-stripe";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

type ConnectStatus = "idle" | "loading" | "error";

type BusinessIntegrationsPanelProps = {
  businessId: number;
  focus?: string;
};

const cardShellClass =
  "relative overflow-hidden rounded-xl border border-[#E8EDF5] bg-white shadow-[0_4px_12px_rgba(15,23,42,0.04)]";

const cardRowClass =
  "grid items-center gap-3 py-3 pl-4 pr-3.5 md:grid-cols-[auto_minmax(0,1fr)_auto]";

function StatusBadge({
  loading,
  connected,
  needsAdAccount,
  pendingLabel = "Ads account needed",
}: {
  loading: boolean;
  connected: boolean;
  needsAdAccount?: boolean;
  pendingLabel?: string;
}) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[0.62rem] font-semibold text-slate-500">
        <Loader2 className="size-2.5 animate-spin" strokeWidth={2.5} />
        Checking
      </span>
    );
  }
  if (connected && needsAdAccount) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[0.62rem] font-semibold text-amber-800">
        {pendingLabel}
      </span>
    );
  }
  if (connected) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[0.62rem] font-semibold text-emerald-700">
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
  connectedTag,
}: {
  items: string[];
  toneClass: string;
  connectedTag?: string | null;
}) {
  return (
    <ul className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
      {connectedTag ? (
        <li
          className={`inline-flex max-w-full items-center truncate rounded-full border border-current/20 bg-current/5 px-2 py-0.5 text-[0.65rem] font-semibold ${toneClass}`}
          title={connectedTag}
        >
          {connectedTag}
        </li>
      ) : null}
      {items.map((label) => (
        <li key={label} className={`text-[0.65rem] font-medium ${toneClass}`}>
          {label}
        </li>
      ))}
    </ul>
  );
}

const META_DISPLAY_SCOPES = [
  "ads_read",
  "ads_management",
  "pages_show_list",
  "pages_read_engagement",
] as const;

function CompactGrantedPermissions({ scopes }: { scopes: string[] }) {
  const granted = new Set(
    scopes.map((scope) => scope.trim()).filter(Boolean),
  );
  if (granted.size === 0) {
    granted.add("ads_read");
  }

  const rows = META_DISPLAY_SCOPES.filter((scope) => granted.has(scope));
  if (rows.length === 0) return null;

  return (
    <div className="min-w-0">
      <p className="m-0 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
        Permissions granted
      </p>
      <p className="m-0 mt-0.5 font-mono text-[0.72rem] leading-snug text-slate-700">
        {rows.join(" · ")}
      </p>
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

function TwilioMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden role="img">
      <circle cx="12" cy="12" r="12" fill="#F22F46" />
      <circle cx="8.2" cy="8.2" r="2.15" fill="#fff" />
      <circle cx="15.8" cy="8.2" r="2.15" fill="#fff" />
      <circle cx="8.2" cy="15.8" r="2.15" fill="#fff" />
      <circle cx="15.8" cy="15.8" r="2.15" fill="#fff" />
    </svg>
  );
}

function IntegrationCardSkeleton() {
  return (
    <div
      className={`${cardShellClass} animate-pulse`}
      aria-hidden
    >
      <span className="absolute inset-y-0 left-0 w-1 bg-slate-200" />
      <div className={cardRowClass}>
        <span className="size-10 shrink-0 rounded-lg bg-slate-100" />
        <div className="min-w-0 space-y-2">
          <div className="h-3.5 w-28 rounded bg-slate-100" />
          <div className="h-3 w-48 max-w-full rounded bg-slate-100" />
          <div className="h-2.5 w-40 max-w-full rounded bg-slate-50" />
          <div className="h-3 w-32 max-w-full rounded bg-slate-100" />
        </div>
        <div className="h-8 w-28 rounded-lg bg-slate-100 md:justify-self-end" />
      </div>
    </div>
  );
}

function IntegrationCard({
  id,
  accentColor,
  logo,
  title,
  description,
  features,
  featureToneClass,
  loading,
  connected,
  needsAdAccount,
  pendingLabel,
  connectedTag,
  actions,
  error,
  footer,
}: {
  id?: string;
  accentColor: string;
  logo: ReactNode;
  title: string;
  description: string;
  features: string[];
  featureToneClass: string;
  loading: boolean;
  connected: boolean;
  needsAdAccount?: boolean;
  pendingLabel?: string;
  connectedTag?: string | null;
  actions: ReactNode;
  error?: string | null;
  footer?: ReactNode;
}) {
  return (
    <article
      id={id}
      className={`${cardShellClass} transition-[opacity,transform,box-shadow] duration-300 ease-out`}
    >
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
            <StatusBadge
              loading={loading}
              connected={connected}
              needsAdAccount={needsAdAccount}
              pendingLabel={pendingLabel}
            />
          </div>
          <p className="m-0 mt-0.5 text-xs text-slate-500">{description}</p>
          <FeatureRow
            items={features}
            toneClass={featureToneClass}
            connectedTag={connectedTag}
          />
        </div>
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
        <div className="border-t border-[#EEF2F7] px-4 py-2">
          {footer}
        </div>
      ) : null}
    </article>
  );
}

export function BusinessIntegrationsPanel({
  businessId,
  focus = "",
}: BusinessIntegrationsPanelProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const namesSoftRefetchDone = useRef(false);
  const [stripeBusy, setStripeBusy] = useState<ConnectStatus>("idle");
  const [stripeActionError, setStripeActionError] = useState<string | null>(null);
  const [metaBusy, setMetaBusy] = useState<ConnectStatus>("idle");
  const [metaActionError, setMetaActionError] = useState<string | null>(null);
  const [metaConnectModalOpen, setMetaConnectModalOpen] = useState(false);
  const [selectedMetaScopes, setSelectedMetaScopes] = useState<
    MetaSelectableScopeId[]
  >(() => getDefaultSelectedMetaScopes());
  const [googleBusy, setGoogleBusy] = useState<ConnectStatus>("idle");
  const [googleActionError, setGoogleActionError] = useState<string | null>(null);
  const [twilioDialogOpen, setTwilioDialogOpen] = useState(false);
  const [twilioCredentialsDialogOpen, setTwilioCredentialsDialogOpen] =
    useState(false);
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);
  const [disconnectTarget, setDisconnectTarget] = useState<
    "stripe" | "meta" | "google" | "twilio" | null
  >(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const disconnectTwilioMutation =
    useDisconnectBusinessTwilioCredentialsMutation(businessId);
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

  const statusInitialLoading = statusQuery.isLoading;
  const statusRefreshing =
    statusQuery.isFetching && !statusQuery.isLoading && Boolean(statusQuery.data);
  const statusError =
    statusQuery.error instanceof Error
      ? statusQuery.error.message
      : statusQuery.error
        ? "Could not check integration connections."
        : null;

  const stripeConnected = Boolean(statusQuery.data?.stripe.connected);
  const stripeAccountName =
    statusQuery.data?.stripe.stripeAccountName?.trim() || null;
  const stripeNeedsSetup =
    stripeConnected &&
    (statusQuery.data?.stripe.status ?? "").toLowerCase() === "incomplete";

  const metaConnected = Boolean(statusQuery.data?.facebook.connected);
  const metaScopes = statusQuery.data?.facebook.metaOauthScopes ?? [];
  const metaAdAccountName =
    statusQuery.data?.facebook.metaAdAccountName?.trim() || null;
  const metaAdAccountId =
    statusQuery.data?.facebook.metaAdAccountId?.trim() || null;
  const metaNeedsAdAccount = metaConnected && !metaAdAccountId;

  const googleConnected = Boolean(statusQuery.data?.googleAds.connected);
  const googleCustomerName =
    statusQuery.data?.googleAds.googleCustomerName?.trim() || null;
  const googleCustomerSelected = isGoogleAdsCustomerSelected(
    statusQuery.data?.googleAds.status,
  );
  const googleNeedsCustomer = googleConnected && !googleCustomerSelected;

  const twilioQuery = useBusinessTwilioPhoneNumbersQuery(businessId, {
    enabled: businessId > 0,
  });
  const twilioNumber = twilioQuery.selectedPhoneNumber?.trim() || "";
  const twilioCredentialsConnected = Boolean(twilioQuery.credentialsConnected);
  const twilioConnected = twilioCredentialsConnected || Boolean(twilioNumber);
  const twilioRefreshing =
    twilioQuery.isFetching && !twilioQuery.isLoading && Boolean(twilioQuery.data);

  const panelReady = !statusInitialLoading;
  const panelRefreshing = statusRefreshing || twilioRefreshing;
  const loadError = statusError || twilioQuery.error;

  useEffect(() => {
    namesSoftRefetchDone.current = false;
  }, [businessId]);

  useEffect(() => {
    if (!statusQuery.isSuccess || !statusQuery.data) return;
    if (namesSoftRefetchDone.current) return;
    const data = statusQuery.data;
    const missingName =
      (data.facebook.connected &&
        data.facebook.metaAdAccountId &&
        !data.facebook.metaAdAccountName) ||
      (data.googleAds.connected &&
        data.googleAds.googleCustomerId &&
        !data.googleAds.googleCustomerName) ||
      (data.stripe.connected &&
        data.stripe.stripeAccountId &&
        !data.stripe.stripeAccountName);
    if (!missingName) return;

    namesSoftRefetchDone.current = true;
    const timer = window.setTimeout(() => {
      void queryClient.invalidateQueries({
        queryKey: integrationsStatusQueryKey(businessId),
      });
    }, 2_000);
    return () => window.clearTimeout(timer);
  }, [businessId, queryClient, statusQuery.data, statusQuery.isSuccess]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: integrationsStatusQueryKey(businessId),
      }),
      queryClient.invalidateQueries({
        queryKey: businessQueryKeys.twilioPhoneNumbers(businessId),
      }),
    ]);
    bumpAuditLogs();
  }, [bumpAuditLogs, businessId, queryClient]);

  const connectedCount = [
    twilioConnected,
    stripeConnected && !stripeNeedsSetup,
    metaConnected && !metaNeedsAdAccount,
    googleConnected && !googleNeedsCustomer,
  ].filter(Boolean).length;

  const refreshStatus = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: integrationsStatusQueryKey(businessId),
    });
  }, [businessId, queryClient]);

  const applyMetaOAuthStatusSync = useCallback(
    async (phase?: "authenticated" | "complete") => {
      await refreshStatus();
      bumpAuditLogs();
      if (phase === "complete") {
        setMetaConnectModalOpen(false);
        setMetaActionError(null);
        setMetaBusy("idle");
        toast.success("Meta Ads connected.");
      }
    },
    [bumpAuditLogs, refreshStatus],
  );

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || typeof data !== "object") return;

      const type = (data as { type?: string }).type;
      if (
        type !== FACEBOOK_OAUTH_COMPLETE_MESSAGE &&
        type !== FACEBOOK_OAUTH_AUTHENTICATED_MESSAGE
      ) {
        return;
      }

      const raw =
        (data as { businessId?: unknown }).businessId ??
        (data as { restaurantId?: unknown }).restaurantId;
      if (typeof raw !== "number" || raw !== businessId) return;

      void applyMetaOAuthStatusSync(
        type === FACEBOOK_OAUTH_COMPLETE_MESSAGE ? "complete" : "authenticated",
      );
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== FACEBOOK_OAUTH_STATUS_SYNC_KEY || !event.newValue) {
        return;
      }
      try {
        const parsed = JSON.parse(event.newValue) as {
          businessId?: unknown;
          phase?: unknown;
        };
        if (parsed.businessId !== businessId) return;
        void applyMetaOAuthStatusSync(
          parsed.phase === "complete" ? "complete" : "authenticated",
        );
        window.localStorage.removeItem(FACEBOOK_OAUTH_STATUS_SYNC_KEY);
      } catch {}
    };

    const onAppVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!consumeFacebookOAuthStatusSync(businessId)) return;
      void applyMetaOAuthStatusSync("complete");
    };

    window.addEventListener("message", onMessage);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onAppVisible);
    document.addEventListener("visibilitychange", onAppVisible);
    onAppVisible();

    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onAppVisible);
      document.removeEventListener("visibilitychange", onAppVisible);
    };
  }, [applyMetaOAuthStatusSync, businessId]);

  const handleConnectStripe = async () => {
    setStripeBusy("loading");
    setStripeActionError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) throw new Error("You're signed out. Sign in again.");
      const result = await connectStripeInPopup(token, businessId);
      if (result.status === "connected") {
        await refreshStatus();
        toast.success("Stripe connected.");
      } else {
        await abortStripeConnect(businessId);
        await refreshStatus();
        setStripeActionError("Stripe connect was cancelled. You can try again.");
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
    setDisconnectTarget("stripe");
  };

  const handleDisconnectMeta = async () => {
    setDisconnectTarget("meta");
  };

  const handleDisconnectGoogle = async () => {
    setDisconnectTarget("google");
  };

  const handleDisconnectTwilio = async () => {
    setDisconnectTarget("twilio");
  };

  const confirmDisconnectIntegration = async () => {
    if (disconnectTarget == null || disconnecting) return;
    const target = disconnectTarget;
    setDisconnecting(true);

    if (target === "twilio") {
      try {
        const result = await disconnectTwilioMutation.mutateAsync();
        bumpAuditLogs();
        toast.success(
          result?.inboundWebhookCleared
            ? "Twilio removed. Your number stays on Twilio; Dealioo no longer receives replies."
            : "Twilio removed from this business. Your number stays on your Twilio account.",
        );
        setDisconnectTarget(null);
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Could not remove Twilio.",
        );
      } finally {
        setDisconnecting(false);
      }
      return;
    }

    if (target === "stripe") {
      setStripeBusy("loading");
      setStripeActionError(null);
      try {
        const token = getSetupAccessToken().trim();
        if (!token) throw new Error("You're signed out. Sign in again.");
        await disconnectStripe(token, businessId);
        await refreshStatus();
        setStripeBusy("idle");
        bumpAuditLogs();
        toast.success("Stripe removed.");
        setDisconnectTarget(null);
      } catch (e) {
        setStripeBusy("error");
        setStripeActionError(
          e instanceof Error ? e.message : "Could not remove Stripe.",
        );
      } finally {
        setDisconnecting(false);
      }
      return;
    }

    if (target === "meta") {
      setMetaBusy("loading");
      setMetaActionError(null);
      try {
        const token = getSetupAccessToken().trim();
        if (!token) throw new Error("You're signed out. Sign in again.");
        await disconnectFacebook(token, businessId);
        await refreshStatus();
        setMetaBusy("idle");
        bumpAuditLogs();
        toast.success("Meta Ads removed.");
        setDisconnectTarget(null);
      } catch (e) {
        setMetaBusy("error");
        setMetaActionError(
          e instanceof Error ? e.message : "Could not remove Meta Ads.",
        );
      } finally {
        setDisconnecting(false);
      }
      return;
    }

    setGoogleBusy("loading");
    setGoogleActionError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) throw new Error("You're signed out. Sign in again.");
      await disconnectGoogleAds(token, businessId);
      await refreshStatus();
      setGoogleBusy("idle");
      bumpAuditLogs();
      toast.success("Google Ads removed.");
      setDisconnectTarget(null);
    } catch (e) {
      setGoogleBusy("error");
      setGoogleActionError(
        e instanceof Error ? e.message : "Could not remove Google Ads.",
      );
    } finally {
      setDisconnecting(false);
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
        toast.success("Meta Ads connected.");
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

  const handleConnectGoogle = async () => {
    setGoogleBusy("loading");
    setGoogleActionError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) throw new Error("You're signed out. Sign in again.");
      const result = await connectGoogleAdsInPopup(token, businessId);
      if (result.status === "connected") {
        await refreshStatus();
        toast.success("Google Ads connected.");
        router.push(`/business/${businessId}/dashboard/google-ads`);
      } else {
        await abortGoogleAdsConnect(businessId);
        await refreshStatus();
        setGoogleActionError(
          "Google Ads connect was cancelled. You can try again.",
        );
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

  const actionBtn =
    "inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-lg px-3 text-xs font-semibold disabled:opacity-60";

  const normalizedFocus = focus.trim().toLowerCase();

  useEffect(() => {
    if (!panelReady) return;
    const targetId =
      normalizedFocus === "stripe"
        ? "settings-integration-stripe"
        : normalizedFocus === "meta"
          ? "settings-integration-meta"
          : normalizedFocus === "google"
            ? "settings-integration-google"
            : normalizedFocus === "twilio"
              ? "settings-integration-twilio"
              : "";
    if (!targetId) return;
    const timer = window.setTimeout(() => {
      document
        .getElementById(targetId)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 160);
    return () => window.clearTimeout(timer);
  }, [normalizedFocus, panelReady]);

  useEffect(() => {
    if (!panelReady) return;
    if (normalizedFocus === "twilio" && !twilioConnected) {
      if (twilioCredentialsConnected) {
        setTwilioDialogOpen(true);
      } else {
        setTwilioCredentialsDialogOpen(true);
      }
    }
  }, [normalizedFocus, panelReady, twilioConnected, twilioCredentialsConnected]);

  if (!panelReady) {
    return (
      <div className="flex flex-col gap-2.5" aria-busy="true" aria-live="polite">
        <div className="rounded-xl border border-[#E8EDF5] bg-white px-4 py-3 shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1.5">
              <div className="h-2.5 w-28 animate-pulse rounded bg-slate-100" />
              <div className="h-3.5 w-56 max-w-full animate-pulse rounded bg-slate-100" />
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[0.72rem] font-bold text-slate-500">
              <Loader2 className="size-3 animate-spin" strokeWidth={2.5} />
              Checking…
            </span>
          </div>
        </div>
        <IntegrationCardSkeleton />
        <IntegrationCardSkeleton />
        <IntegrationCardSkeleton />
        <IntegrationCardSkeleton />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-2.5"
      style={{
        animation: "integrationsPanelIn 280ms ease-out",
      }}
    >
      <style>{`
        @keyframes integrationsPanelIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="relative overflow-hidden rounded-xl border border-[#E8EDF5] bg-white px-4 py-3 shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
        {panelRefreshing ? (
          <span
            className="absolute inset-x-0 top-0 h-0.5 origin-left animate-pulse bg-[#1877F2]/70"
            aria-hidden
          />
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="m-0 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-500">
              Connected platforms
            </p>
            <p className="m-0 mt-0.5 text-sm text-slate-600">
              Link SMS, payments, and ad accounts for this business.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void refreshAll()}
              disabled={panelRefreshing}
              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-[#E8EDF5] bg-white px-2.5 text-[0.7rem] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                className={`size-3 ${panelRefreshing ? "animate-spin" : ""}`}
                strokeWidth={2.25}
              />
              {panelRefreshing ? "Refreshing…" : "Refresh"}
            </button>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[0.72rem] font-bold text-slate-700 transition-colors duration-200">
              {`${connectedCount} of 4 ready`}
            </span>
          </div>
        </div>
        {loadError ? (
          <div
            role="alert"
            className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[0.72rem] text-red-700"
          >
            <span className="inline-flex items-start gap-1.5">
              <AlertCircle className="mt-px size-3.5 shrink-0" />
              {loadError}
            </span>
            <button
              type="button"
              onClick={() => void refreshAll()}
              className="cursor-pointer rounded-md border border-red-200 bg-white px-2.5 py-1 text-[0.68rem] font-semibold text-red-700"
            >
              Try again
            </button>
          </div>
        ) : null}
      </div>

      <IntegrationCard
        id="settings-integration-twilio"
        accentColor="bg-[#F22F46]"
        logo={<TwilioMark className="size-6" />}
        title="Twilio"
        description="Connect your Twilio account to send SMS from your own number."
        featureToneClass="text-[#F22F46]"
        features={[
          "Own Twilio account",
          "SMS outreach",
          "Campaign messages",
        ]}
        loading={false}
        connected={twilioConnected}
        connectedTag={twilioNumber || null}
        actions={
          twilioCredentialsConnected ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTwilioDialogOpen(true)}
                className={`${actionBtn} bg-[#F22F46] text-white`}
              >
                {twilioNumber ? "Change number" : "Select number"}
              </button>
              <button
                type="button"
                onClick={() => void handleDisconnectTwilio()}
                className={`${actionBtn} border border-red-200 bg-red-50 text-red-600`}
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setTwilioCredentialsDialogOpen(true)}
              className={`${actionBtn} bg-[#F22F46] text-white`}
            >
              Connect Twilio
            </button>
          )
        }
      />

      <IntegrationCard
        id="settings-integration-stripe"
        accentColor="bg-[#635BFF]"
        logo={<StripeLogo className="size-6" />}
        title="Stripe"
        description="Accept payments from campaigns and funnels."
        featureToneClass="text-[#635BFF]"
        features={[
          "Secure payments",
          "Invoices & history",
          "Automatic sync",
        ]}
        loading={false}
        connected={stripeConnected}
        needsAdAccount={stripeNeedsSetup}
        pendingLabel="Setup needed"
        error={stripeActionError}
        connectedTag={
          stripeConnected && stripeAccountName ? stripeAccountName : null
        }
        actions={
          stripeConnected ? (
            <button
              type="button"
              onClick={() => void handleDisconnectStripe()}
              disabled={stripeBusy === "loading"}
              className={`${actionBtn} border border-red-200 bg-red-50 text-red-600`}
            >
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
        id="settings-integration-meta"
        accentColor="bg-[#1877F2]"
        logo={<MetaLogo className="size-6" />}
        title="Meta Ads"
        description="Run and track Meta ad campaigns."
        featureToneClass="text-[#1877F2]"
        features={[
          "Ad performance",
          "Audience insights",
          "Campaign tracking",
        ]}
        loading={false}
        connected={metaConnected}
        needsAdAccount={metaNeedsAdAccount}
        error={metaActionError}
        connectedTag={
          metaConnected && metaAdAccountName ? metaAdAccountName : null
        }
        actions={
          metaConnected ? (
            <>
              {metaNeedsAdAccount ? (
                <Link
                  href={`/facebook/select-ad-account?businessId=${businessId}`}
                  className={`${actionBtn} border border-[#C5D8F6] bg-[#E8F1FF] text-[#1877F2] no-underline`}
                >
                  Choose ad account
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => void handleDisconnectMeta()}
                disabled={metaBusy === "loading"}
                className={`${actionBtn} border border-red-200 bg-red-50 text-red-600`}
              >
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
        footer={
          metaConnected ? (
            <CompactGrantedPermissions scopes={metaScopes} />
          ) : null
        }
      />
      <MetaConnectPermissionsModal
        open={metaConnectModalOpen}
        selectedScopes={selectedMetaScopes}
        onChangeScopes={setSelectedMetaScopes}
        connecting={metaBusy === "loading"}
        error={metaActionError}
        onClose={closeMetaConnectModal}
        onContinue={() => void handleConnectMeta()}
      />

      <IntegrationCard
        id="settings-integration-google"
        accentColor="bg-[#34A853]"
        logo={<GoogleAdsLogo className="size-6" />}
        title="Google Ads"
        description="Pull spend, clicks, and campaign stats from Google Ads."
        featureToneClass="text-[#188038]"
        features={[
          "Spend insights",
          "Click tracking",
          "Campaign stats",
        ]}
        loading={false}
        connected={googleConnected}
        needsAdAccount={googleNeedsCustomer}
        error={googleActionError}
        connectedTag={
          googleConnected && googleCustomerSelected && googleCustomerName
            ? googleCustomerName
            : null
        }
        actions={
          googleConnected ? (
            <>
              <Link
                href={`/google/select-customer?businessId=${businessId}`}
                className={`${actionBtn} border border-[#B7E0C4] bg-[#E8F5EE] text-[#188038] no-underline`}
              >
                {googleNeedsCustomer ? "Choose Ads account" : "Change Ads account"}
              </Link>
              <button
                type="button"
                onClick={() => void handleDisconnectGoogle()}
                disabled={googleBusy === "loading"}
                className={`${actionBtn} border border-red-200 bg-red-50 text-red-600`}
              >
                {googleBusy === "loading" ? "Removing…" : "Remove account"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void handleConnectGoogle()}
              disabled={googleBusy === "loading"}
              className={`${actionBtn} gap-1.5 bg-[#34A853] text-white`}
            >
              {googleBusy === "loading" ? (
                "Connecting…"
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

      <ConnectTwilioCredentialsDialog
        open={twilioCredentialsDialogOpen}
        businessId={businessId}
        onClose={() => setTwilioCredentialsDialogOpen(false)}
        onConnected={async (result) => {
          setTwilioCredentialsDialogOpen(false);
          toast.success(
            result.accountSidMasked
              ? `Twilio connected (${result.accountSidMasked}).`
              : "Twilio connected.",
          );
          await queryClient.invalidateQueries({
            queryKey: businessQueryKeys.twilioPhoneNumbers(businessId),
          });
          await queryClient.invalidateQueries({
            queryKey: businessQueryKeys.detail(businessId),
          });
          bumpAuditLogs();
          if (!result.selectedPhoneNumber) {
            setTwilioDialogOpen(true);
          }
        }}
      />

      <ChooseNumberDialog
        open={twilioDialogOpen}
        businessId={businessId}
        title="Choose a Twilio number"
        description="Pick a number you own, or search for one to buy on your Twilio account."
        confirmLabel="Save number"
        confirmingLabel="Saving number…"
        onClose={() => setTwilioDialogOpen(false)}
        onConfirmed={async (selected) => {
          setTwilioDialogOpen(false);
          toast.success(`Twilio number set to ${selected.phoneNumber}.`);
          await queryClient.invalidateQueries({
            queryKey: businessQueryKeys.twilioPhoneNumbers(businessId),
          });
          await queryClient.invalidateQueries({
            queryKey: businessQueryKeys.detail(businessId),
          });
          await queryClient.invalidateQueries({
            queryKey: businessQueryKeys.myLists(),
          });
          bumpAuditLogs();
        }}
      />

      <DeleteConfirmationDialog
        open={disconnectTarget != null}
        itemName={
          disconnectTarget === "stripe"
            ? "Stripe"
            : disconnectTarget === "meta"
              ? "Meta Ads"
              : disconnectTarget === "google"
                ? "Google Ads"
                : disconnectTarget === "twilio"
                  ? "Twilio"
                  : "this integration"
        }
        title={
          disconnectTarget === "stripe"
            ? "Remove Stripe?"
            : disconnectTarget === "meta"
              ? "Remove Meta Ads?"
              : disconnectTarget === "google"
                ? "Remove Google Ads?"
                : disconnectTarget === "twilio"
                  ? "Remove Twilio?"
                  : "Remove this integration?"
        }
        description={
          disconnectTarget === "stripe" ? (
            <>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-[#1877f2]">Stripe</span> from
              this business? You can connect the same account again later.
            </>
          ) : disconnectTarget === "meta" ? (
            <>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-[#1877f2]">Meta Ads</span> from
              this business? This cannot be undone until you reconnect.
            </>
          ) : disconnectTarget === "twilio" ? (
            <>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-[#F22F46]">Twilio</span> from
              this business? SMS sending stops until you reconnect. Your phone
              number stays on your Twilio account — we only disconnect Dealioo
              and stop inbound replies here.
            </>
          ) : (
            <>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-[#1877f2]">Google Ads</span>{" "}
              from this business? This cannot be undone until you reconnect.
            </>
          )
        }
        confirmText={
          disconnectTarget === "stripe"
            ? "Remove Stripe"
            : disconnectTarget === "meta"
              ? "Remove Meta Ads"
              : disconnectTarget === "twilio"
                ? "Remove Twilio"
                : "Remove Google Ads"
        }
        checkboxLabel={
          disconnectTarget === "stripe"
            ? "Are you sure you want to remove Stripe from this business?"
            : disconnectTarget === "meta"
              ? "Are you sure you want to remove Meta Ads from this business?"
              : disconnectTarget === "twilio"
                ? "Are you sure you want to remove Twilio from this business?"
                : "Are you sure you want to remove Google Ads from this business?"
        }
        isLoading={disconnecting}
        onConfirm={() => {
          void confirmDisconnectIntegration();
        }}
        onCancel={() => {
          if (!disconnecting) setDisconnectTarget(null);
        }}
      />
    </div>
  );
}
