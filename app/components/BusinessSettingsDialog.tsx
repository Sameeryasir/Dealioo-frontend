"use client";

import {
  AlertCircle,
  BarChart3,
  Building2,
  CreditCard,
  Cog,
  ExternalLink,
  Link2,
  Loader2,
  ScanLine,
  User,
  Users,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { connectFacebookInPopup } from "@/app/lib/facebook-oauth-popup";
import { connectGoogleAdsInPopup } from "@/app/lib/google-oauth-popup";
import { FacebookPermissionsPanel } from "@/app/components/facebook/FacebookPermissionsPanel";
import { getFacebookConnectionStatus } from "@/app/services/facebook/get-facebook-connection-status";
import { disconnectFacebook } from "@/app/services/facebook/disconnect-facebook";
import { getGoogleAdsConnectionStatus } from "@/app/services/google-ads/get-google-ads-connection-status";
import { abortGoogleAdsConnect } from "@/app/services/google-ads/abort-google-ads-connect";
import { disconnectGoogleAds } from "@/app/services/google-ads/disconnect-google-ads";
import { GoogleAdsCampaignsDialog } from "@/app/components/google-ads/GoogleAdsCampaignsDialog";
import { fetchBusinessById } from "@/app/services/business/get-my-business";
import { connectStripe } from "@/app/services/stripe/connect-stripe";

function parseRestaurantIdFromParams(raw: unknown): number | undefined {
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) return undefined;
  const n = Number.parseInt(raw, 10);
  return n >= 1 ? n : undefined;
}

const DASHBOARD_HREF = "/dashboard" as const;

type SectionId =
  | "account"
  | "general"
  | "members"
  | "integrations"
  | "usage"
  | "scanning"
  | "subscription";

type NavItem = { id: SectionId; label: string; icon: typeof User };

const accountNav: NavItem[] = [{ id: "account", label: "Account", icon: User }];

const organizationNav: NavItem[] = [
  { id: "general", label: "General", icon: Cog },
  { id: "members", label: "Members", icon: Users },
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "usage", label: "Usage", icon: BarChart3 },
  { id: "scanning", label: "Scanning", icon: ScanLine },
  { id: "subscription", label: "Subscription", icon: CreditCard },
];

const sectionTitles: Record<SectionId, string> = {
  account: "Account",
  general: "General",
  members: "Members",
  integrations: "Integrations",
  usage: "Usage",
  scanning: "Scanning",
  subscription: "Subscription",
};

const integrationCardClass =
  "rounded-2xl border border-zinc-800/50 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.45)] ring-1 ring-inset ring-white/[0.04] transition-colors hover:border-zinc-700/60";

const integrationSecondaryBtnClass =
  "inline-flex h-9 shrink-0 cursor-pointer items-center rounded-lg border border-zinc-600/70 bg-zinc-800/70 px-3.5 text-xs font-semibold text-zinc-100 no-underline shadow-sm transition-all hover:border-zinc-500 hover:bg-zinc-700/90 hover:shadow-md hover:shadow-black/20";

const integrationRemoveBtnClass =
  "inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-red-500/35 bg-red-500/10 px-3.5 text-xs font-semibold text-red-200 transition-all hover:border-red-500/55 hover:bg-red-500/20 hover:shadow-sm hover:shadow-red-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 disabled:cursor-not-allowed disabled:opacity-70";

function IntegrationConnectedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[0.65rem] font-semibold text-emerald-300 ring-1 ring-emerald-500/25">
      <span
        className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.75)]"
        aria-hidden
      />
      Connected
    </span>
  );
}

function IntegrationLoadingBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/80 px-2.5 py-0.5 text-[0.65rem] font-medium text-zinc-400 ring-1 ring-zinc-700/50">
      <Loader2 className="size-2.5 animate-spin" strokeWidth={2.5} aria-hidden />
      Checking
    </span>
  );
}

function IntegrationAccountChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-2">
      <span className="text-[0.65rem] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <code className="rounded-md bg-zinc-800/90 px-2 py-0.5 font-mono text-[0.7rem] text-zinc-300 ring-1 ring-zinc-700/50">
        {value}
      </code>
    </div>
  );
}

function StripeLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 25"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Stripe"
      className={className}
    >
      <path
        fill="currentColor"
        d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.13V9.1h-3.12v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.13 1.31 4.46 1.31.9 0 1.54-.24 1.54-.99 0-1.94-6.15-1.2-6.15-5.69 0-2.92 2.2-4.66 5.55-4.66 1.34 0 2.68.2 4.02.74v3.88a9.18 9.18 0 0 0-4.02-1.05c-.84 0-1.36.25-1.36.88 0 1.84 6.15.96 6.15 5.78z"
      />
    </svg>
  );
}

function FacebookLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Facebook"
      className={className}
    >
      <path
        fill="currentColor"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Google" className={className}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

type BusinessSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignOut: () => void;
};

export default function BusinessSettingsDialog({
  open,
  onOpenChange,
  onSignOut,
}: BusinessSettingsDialogProps) {
  const router = useRouter();
  const params = useParams();
  const titleId = useId();
  const [section, setSection] = useState<SectionId>("account");

  const restaurantId = useMemo(
    () => parseRestaurantIdFromParams(params?.restaurantId),
    [params?.restaurantId],
  );

  type ConnectStatus = "idle" | "loading" | "error";
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeStatusLoading, setStripeStatusLoading] = useState(true);
  const [stripeStatus, setStripeStatus] = useState<ConnectStatus>("idle");
  const [stripeError, setStripeError] = useState<string | null>(null);

  const [metaConnected, setMetaConnected] = useState(false);
  const [metaAdAccountId, setMetaAdAccountId] = useState<string | null>(null);
  const [metaOauthScopes, setMetaOauthScopes] = useState<string[]>([]);
  const [metaMissingRequiredScopes, setMetaMissingRequiredScopes] = useState<
    string[]
  >([]);
  const [metaStatusLoading, setMetaStatusLoading] = useState(true);
  const [metaConnectStatus, setMetaConnectStatus] = useState<ConnectStatus>("idle");
  const [metaDisconnectStatus, setMetaDisconnectStatus] = useState<ConnectStatus>("idle");
  const [metaError, setMetaError] = useState<string | null>(null);

  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleCustomerId, setGoogleCustomerId] = useState<string | null>(null);
  const [googleStatusLoading, setGoogleStatusLoading] = useState(true);
  const [googleConnectStatus, setGoogleConnectStatus] = useState<ConnectStatus>("idle");
  const [googleDisconnectStatus, setGoogleDisconnectStatus] = useState<ConnectStatus>("idle");
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googleCampaignsOpen, setGoogleCampaignsOpen] = useState(false);

  const refreshStripeStatus = useCallback(async () => {
    if (restaurantId == null) {
      setStripeConnected(false);
      setStripeStatusLoading(false);
      return;
    }
    setStripeStatusLoading(true);
    setStripeError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) {
        setStripeConnected(false);
        return;
      }
      const restaurant = await fetchBusinessById(token, restaurantId);
      setStripeConnected(Boolean(restaurant.stripeAccountId?.trim()));
    } catch (e) {
      setStripeError(
        e instanceof Error ? e.message : "Could not check Stripe connection.",
      );
    } finally {
      setStripeStatusLoading(false);
    }
  }, [restaurantId]);

  const refreshMetaStatus = useCallback(async () => {
    if (restaurantId == null) {
      setMetaConnected(false);
      setMetaStatusLoading(false);
      return;
    }
    setMetaStatusLoading(true);
    setMetaError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) {
        setMetaConnected(false);
        return;
      }
      const status = await getFacebookConnectionStatus(token, restaurantId);
      setMetaConnected(status.connected);
      setMetaAdAccountId(status.metaAdAccountId);
      setMetaOauthScopes(status.metaOauthScopes ?? []);
      setMetaMissingRequiredScopes(status.missingRequiredScopes ?? []);
    } catch (e) {
      setMetaError(
        e instanceof Error ? e.message : "Could not check Facebook connection.",
      );
    } finally {
      setMetaStatusLoading(false);
    }
  }, [restaurantId]);

  const refreshGoogleStatus = useCallback(async () => {
    if (restaurantId == null) {
      setGoogleConnected(false);
      setGoogleStatusLoading(false);
      return;
    }
    setGoogleStatusLoading(true);
    setGoogleError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) {
        setGoogleConnected(false);
        return;
      }
      const status = await getGoogleAdsConnectionStatus(token, restaurantId);
      setGoogleConnected(status.connected);
      setGoogleCustomerId(status.googleCustomerId);
    } catch (e) {
      setGoogleError(
        e instanceof Error ? e.message : "Could not check Google Ads connection.",
      );
    } finally {
      setGoogleStatusLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (!open || restaurantId == null) return;
    void refreshStripeStatus();
    void refreshMetaStatus();
    void refreshGoogleStatus();
  }, [open, restaurantId, refreshStripeStatus, refreshMetaStatus, refreshGoogleStatus]);

  const handleConnectStripe = async () => {
    setStripeStatus("loading");
    setStripeError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) {
        throw new Error("You're signed out. Sign in again to connect Stripe.");
      }
      if (restaurantId == null) {
        throw new Error(
          "Open this from a business page so we know which one to connect.",
        );
      }
      const { url } = await connectStripe(token, restaurantId);
      window.open(url, "_blank", "noopener,noreferrer");
      setStripeStatus("idle");
    } catch (e) {
      setStripeStatus("error");
      setStripeError(
        e instanceof Error ? e.message : "Could not connect to Stripe.",
      );
    }
  };

  const handleConnectFacebook = async () => {
    setMetaConnectStatus("loading");
    setMetaError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) {
        throw new Error("You're signed out. Sign in again to connect Facebook.");
      }
      if (restaurantId == null) {
        throw new Error(
          "Open this from a business page so we know which one to connect.",
        );
      }
      const result = await connectFacebookInPopup(token, restaurantId);
      if (result.status === "connected") {
        await refreshMetaStatus();
      }
      setMetaConnectStatus("idle");
    } catch (e) {
      setMetaConnectStatus("error");
      setMetaError(
        e instanceof Error ? e.message : "Could not connect to Facebook.",
      );
    }
  };

  const handleDisconnectFacebook = async () => {
    if (restaurantId == null) return;

    const confirmed = window.confirm(
      "Remove this Facebook account from Dealioo? Your linked ad account and login will be cleared. You can connect again anytime.",
    );
    if (!confirmed) return;

    setMetaDisconnectStatus("loading");
    setMetaError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) {
        throw new Error("You're signed out. Sign in again to remove Facebook.");
      }
      await disconnectFacebook(token, restaurantId);
      setMetaConnected(false);
      setMetaAdAccountId(null);
      setMetaOauthScopes([]);
      setMetaMissingRequiredScopes([]);
      setMetaDisconnectStatus("idle");
    } catch (e) {
      setMetaDisconnectStatus("error");
      setMetaError(
        e instanceof Error ? e.message : "Could not remove Facebook account.",
      );
    }
  };

  const handleConnectGoogle = async () => {
    setGoogleConnectStatus("loading");
    setGoogleError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) {
        throw new Error("You're signed out. Sign in again to connect Google Ads.");
      }
      if (restaurantId == null) {
        throw new Error(
          "Open this from a business page so we know which one to connect.",
        );
      }
      const result = await connectGoogleAdsInPopup(token, restaurantId);
      if (result.status === "connected") {
        await refreshGoogleStatus();
      } else {
        await abortGoogleAdsConnect(restaurantId);
        await refreshGoogleStatus();
      }
      setGoogleConnectStatus("idle");
    } catch (e) {
      setGoogleConnectStatus("error");
      setGoogleError(
        e instanceof Error ? e.message : "Could not connect to Google Ads.",
      );
    }
  };

  const handleDisconnectGoogle = async () => {
    if (restaurantId == null) return;

    const confirmed = window.confirm(
      "Remove this Google Ads account from Dealioo? Your linked customer account and login will be cleared. You can connect again anytime.",
    );
    if (!confirmed) return;

    setGoogleDisconnectStatus("loading");
    setGoogleError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) {
        throw new Error("You're signed out. Sign in again to remove Google Ads.");
      }
      await disconnectGoogleAds(token, restaurantId);
      setGoogleConnected(false);
      setGoogleCustomerId(null);
      setGoogleDisconnectStatus("idle");
    } catch (e) {
      setGoogleDisconnectStatus("error");
      setGoogleError(
        e instanceof Error ? e.message : "Could not remove Google Ads account.",
      );
    }
  };

  if (!open) return null;

  const navButton = (item: NavItem) => {
    const Icon = item.icon;
    const selected = section === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => setSection(item.id)}
        className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
          selected
            ? "bg-sky-500/20 text-sky-100 ring-1 ring-sky-500/40"
            : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
        }`}
      >
        <Icon className="size-4 shrink-0 opacity-80" aria-hidden strokeWidth={2} />
        {item.label}
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-black/70 backdrop-blur-sm"
        aria-label="Close settings"
        onClick={() => onOpenChange(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex h-[min(32rem,92dvh)] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-zinc-700/90 bg-zinc-900 shadow-2xl shadow-black/60 sm:max-h-[85vh] sm:rounded-2xl"
        onKeyDown={(e) => {
          if (e.key === "Escape") onOpenChange(false);
        }}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/95 px-4 py-3 sm:px-5">
          <h2 id={titleId} className="text-base font-semibold tracking-tight text-white">
            Settings
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={2} aria-hidden />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <aside className="flex w-full shrink-0 flex-col gap-4 border-b border-zinc-800 bg-zinc-950/80 p-3 sm:w-52 sm:border-b-0 sm:border-r sm:border-zinc-800 sm:py-4">
            <div>
              <p className="mb-1.5 px-3 text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500">
                Account
              </p>
              <div className="space-y-0.5">{accountNav.map(navButton)}</div>
            </div>
            <div>
              <p className="mb-1.5 px-3 text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500">
                Organization
              </p>
              <div className="space-y-0.5">{organizationNav.map(navButton)}</div>
            </div>
          </aside>

          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-zinc-950 p-5 sm:p-8">
            <h3 className="text-lg font-semibold text-white">{sectionTitles[section]}</h3>

            {section === "account" ? (
              <div className="mt-8 flex max-w-md flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    router.push(DASHBOARD_HREF);
                  }}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-sky-500/70 bg-transparent px-4 py-3 text-sm font-medium text-sky-400 transition-colors hover:border-sky-400 hover:bg-sky-500/10 hover:text-sky-300"
                >
                  <Building2 className="size-4 shrink-0" aria-hidden strokeWidth={2} />
                  Switch Organization
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSignOut();
                    onOpenChange(false);
                  }}
                  className="w-full cursor-pointer rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-500 active:bg-red-700"
                >
                  Sign Out
                </button>
              </div>
            ) : section === "integrations" ? (
              <div className="mt-6 max-w-2xl">
                <ul className="space-y-4">
                  <li className={integrationCardClass}>
                    <div className="flex flex-wrap items-center gap-5">
                      <span
                        aria-hidden
                        className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#635BFF] shadow-lg shadow-[#635BFF]/30 ring-1 ring-white/20"
                      >
                        <StripeLogo className="h-4 w-auto text-white" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold tracking-tight text-white">
                            Stripe
                          </p>
                          {stripeStatusLoading ? (
                            <IntegrationLoadingBadge />
                          ) : stripeConnected ? (
                            <IntegrationConnectedBadge />
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                          Accept payments and manage subscriptions for your funnels.
                        </p>
                      </div>

                      {stripeStatusLoading ? null : !stripeConnected ? (
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                          <button
                            type="button"
                            onClick={() => void handleConnectStripe()}
                            disabled={
                              stripeStatus === "loading" || stripeStatusLoading
                            }
                            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-[#635BFF] px-4 text-xs font-semibold text-white shadow-md shadow-[#635BFF]/25 transition-all hover:bg-[#544ae0] hover:shadow-lg hover:shadow-[#635BFF]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9C95FF] disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {stripeStatus === "loading" ? (
                              <>
                                <Loader2
                                  className="size-3.5 animate-spin"
                                  strokeWidth={2.25}
                                  aria-hidden
                                />
                                Connecting…
                              </>
                            ) : (
                              <>
                                <ExternalLink
                                  className="size-3.5"
                                  strokeWidth={2}
                                  aria-hidden
                                />
                                Connect
                              </>
                            )}
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {stripeStatus === "error" && stripeError ? (
                      <div
                        role="alert"
                        className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200"
                      >
                        <AlertCircle
                          className="mt-px size-3.5 shrink-0"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        <span>{stripeError}</span>
                      </div>
                    ) : null}
                  </li>

                  <li className={integrationCardClass}>
                    <div className="flex flex-wrap items-center gap-5">
                      <span
                        aria-hidden
                        className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#1877F2] shadow-lg shadow-[#1877F2]/30 ring-1 ring-white/20"
                      >
                        <FacebookLogo className="size-8 text-white" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold tracking-tight text-white">
                            Facebook
                          </p>
                          {metaStatusLoading ? (
                            <IntegrationLoadingBadge />
                          ) : metaConnected ? (
                            <IntegrationConnectedBadge />
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                          Pull ad spend, impressions, reach, clicks, and campaign
                          stats from Meta.
                        </p>
                        {metaConnected && metaAdAccountId ? (
                          <IntegrationAccountChip
                            label="Ad account"
                            value={metaAdAccountId.replace(/^act_/, "")}
                          />
                        ) : null}
                      </div>

                      {metaStatusLoading ? null : metaConnected ? (
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                          {metaAdAccountId && restaurantId != null ? (
                            <a
                              href={`/facebook/select-ad-account?restaurantId=${restaurantId}`}
                              className={integrationSecondaryBtnClass}
                            >
                              Change ad account
                            </a>
                          ) : restaurantId != null ? (
                            <a
                              href={`/facebook/select-ad-account?restaurantId=${restaurantId}`}
                              className={integrationSecondaryBtnClass}
                            >
                              Choose ad account
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => void handleDisconnectFacebook()}
                            disabled={
                              metaDisconnectStatus === "loading" ||
                              metaStatusLoading
                            }
                            className={integrationRemoveBtnClass}
                          >
                            {metaDisconnectStatus === "loading" ? (
                              <>
                                <Loader2
                                  className="size-3.5 animate-spin"
                                  strokeWidth={2.25}
                                  aria-hidden
                                />
                                Removing…
                              </>
                            ) : (
                              "Remove account"
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                          <button
                            type="button"
                            onClick={() => void handleConnectFacebook()}
                            disabled={
                              metaConnectStatus === "loading" || metaStatusLoading
                            }
                            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-[#1877F2] px-4 text-xs font-semibold text-white shadow-md shadow-[#1877F2]/25 transition-all hover:bg-[#166fe5] hover:shadow-lg hover:shadow-[#1877F2]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2]/60 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {metaConnectStatus === "loading" ? (
                              <>
                                <Loader2
                                  className="size-3.5 animate-spin"
                                  strokeWidth={2.25}
                                  aria-hidden
                                />
                                Connecting…
                              </>
                            ) : (
                              <>
                                <ExternalLink
                                  className="size-3.5"
                                  strokeWidth={2}
                                  aria-hidden
                                />
                                Connect with Facebook
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <FacebookPermissionsPanel
                      grantedScopes={metaOauthScopes}
                      missingRequiredScopes={metaMissingRequiredScopes}
                      connected={metaConnected}
                      loading={metaStatusLoading}
                    />

                    {(metaConnectStatus === "error" || metaDisconnectStatus === "error") &&
                    metaError ? (
                      <div
                        role="alert"
                        className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200"
                      >
                        <AlertCircle
                          className="mt-px size-3.5 shrink-0"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        <span>{metaError}</span>
                      </div>
                    ) : null}
                  </li>

                  <li className={integrationCardClass}>
                    <div className="flex flex-wrap items-center gap-5">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            googleConnected &&
                            googleCustomerId &&
                            restaurantId != null
                          ) {
                            setGoogleCampaignsOpen(true);
                          }
                        }}
                        disabled={
                          !googleConnected ||
                          !googleCustomerId ||
                          googleStatusLoading
                        }
                        title={
                          googleConnected && googleCustomerId
                            ? "View Google Ads campaigns"
                            : "Connect Google Ads first"
                        }
                        className="flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-white shadow-lg shadow-black/20 ring-1 ring-white/30 transition-all hover:shadow-xl hover:shadow-[#4285F4]/20 hover:ring-[#4285F4]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]/60 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <GoogleLogo className="size-8" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold tracking-tight text-white">
                            Google Ads
                          </p>
                          {googleStatusLoading ? (
                            <IntegrationLoadingBadge />
                          ) : googleConnected ? (
                            <IntegrationConnectedBadge />
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                          Pull spend, impressions, clicks, and campaign stats
                          from Google Ads.
                        </p>
                        {googleConnected && googleCustomerId ? (
                          <IntegrationAccountChip
                            label="Customer ID"
                            value={googleCustomerId}
                          />
                        ) : null}
                      </div>

                      {googleStatusLoading ? null : googleConnected ? (
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                          {restaurantId != null ? (
                            <a
                              href={`/google/select-customer?restaurantId=${restaurantId}`}
                              className={integrationSecondaryBtnClass}
                            >
                              {googleCustomerId ? "Change Ads account" : "Choose Ads account"}
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => void handleDisconnectGoogle()}
                            disabled={
                              googleDisconnectStatus === "loading" ||
                              googleStatusLoading
                            }
                            className={integrationRemoveBtnClass}
                          >
                            {googleDisconnectStatus === "loading" ? (
                              <>
                                <Loader2
                                  className="size-3.5 animate-spin"
                                  strokeWidth={2.25}
                                  aria-hidden
                                />
                                Removing…
                              </>
                            ) : (
                              "Remove account"
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                          <button
                            type="button"
                            onClick={() => void handleConnectGoogle()}
                            disabled={
                              googleConnectStatus === "loading" || googleStatusLoading
                            }
                            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-white px-4 text-xs font-semibold text-zinc-900 shadow-md shadow-black/15 transition-all hover:bg-zinc-100 hover:shadow-lg hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {googleConnectStatus === "loading" ? (
                              <>
                                <Loader2
                                  className="size-3.5 animate-spin"
                                  strokeWidth={2.25}
                                  aria-hidden
                                />
                                Connecting…
                              </>
                            ) : (
                              <>
                                <ExternalLink
                                  className="size-3.5"
                                  strokeWidth={2}
                                  aria-hidden
                                />
                                Connect with Google
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {(googleConnectStatus === "error" || googleDisconnectStatus === "error") &&
                    googleError ? (
                      <div
                        role="alert"
                        className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200"
                      >
                        <AlertCircle
                          className="mt-px size-3.5 shrink-0"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        <span>{googleError}</span>
                      </div>
                    ) : null}
                  </li>
                </ul>
              </div>
            ) : (
              <p className="mt-6 max-w-md text-sm leading-relaxed text-zinc-500">
                {sectionTitles[section]} settings will be available here.
              </p>
            )}
          </div>
        </div>
      </div>

      {restaurantId != null ? (
        <GoogleAdsCampaignsDialog
          open={googleCampaignsOpen}
          onClose={() => setGoogleCampaignsOpen(false)}
          restaurantId={restaurantId}
          customerId={googleCustomerId}
        />
      ) : null}
    </div>
  );
}
