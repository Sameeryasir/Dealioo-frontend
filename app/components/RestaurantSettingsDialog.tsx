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
import { getFacebookConnectionStatus } from "@/app/services/facebook/get-facebook-connection-status";
import { fetchRestaurantById } from "@/app/services/restaurant/get-my-restaurant";
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

type RestaurantSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignOut: () => void;
};

export default function RestaurantSettingsDialog({
  open,
  onOpenChange,
  onSignOut,
}: RestaurantSettingsDialogProps) {
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
  const [stripeStatusLoading, setStripeStatusLoading] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<ConnectStatus>("idle");
  const [stripeError, setStripeError] = useState<string | null>(null);

  const [metaConnected, setMetaConnected] = useState(false);
  const [metaAdAccountId, setMetaAdAccountId] = useState<string | null>(null);
  const [metaStatusLoading, setMetaStatusLoading] = useState(false);
  const [metaConnectStatus, setMetaConnectStatus] = useState<ConnectStatus>("idle");
  const [metaError, setMetaError] = useState<string | null>(null);

  const refreshStripeStatus = useCallback(async () => {
    if (restaurantId == null) {
      setStripeConnected(false);
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
      const restaurant = await fetchRestaurantById(token, restaurantId);
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
    } catch (e) {
      setMetaError(
        e instanceof Error ? e.message : "Could not check Facebook connection.",
      );
    } finally {
      setMetaStatusLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (!open || section !== "integrations") return;
    void refreshStripeStatus();
    void refreshMetaStatus();
  }, [open, section, refreshStripeStatus, refreshMetaStatus]);

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
          "Open this from a restaurant page so we know which one to connect.",
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
          "Open this from a restaurant page so we know which one to connect.",
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
                <p className="text-sm leading-relaxed text-zinc-500">
                  Connect third-party services to extend your workspace.
                </p>

                <ul className="mt-5 space-y-3">
                  <li className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <span
                        aria-hidden
                        className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#635BFF] shadow-sm ring-1 ring-white/10"
                      >
                        <StripeLogo className="h-4 w-auto text-white" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-white">Stripe</p>
                          {stripeStatusLoading ? (
                            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[0.65rem] font-medium text-zinc-400">
                              …
                            </span>
                          ) : stripeConnected ? (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-300">
                              Connected
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
                          Accept payments and manage subscriptions for your funnels.
                        </p>
                      </div>

                      {!stripeConnected ? (
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                          <button
                            type="button"
                            onClick={() => void handleConnectStripe()}
                            disabled={
                              stripeStatus === "loading" || stripeStatusLoading
                            }
                            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-[#635BFF] px-3.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#544ae0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9C95FF] disabled:cursor-not-allowed disabled:opacity-70"
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

                  <li className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <span
                        aria-hidden
                        className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#1877F2] shadow-sm ring-1 ring-white/10"
                      >
                        <FacebookLogo className="size-7 text-white" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-white">
                            Facebook
                          </p>
                          {metaStatusLoading ? (
                            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[0.65rem] font-medium text-zinc-400">
                              …
                            </span>
                          ) : metaConnected ? (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-300">
                              Connected
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
                          Link Meta to pull ad spend, impressions, reach, clicks,
                          and campaign stats into Only Deals. A small Facebook
                          window opens — you stay on this page.
                        </p>
                      </div>

                      {metaConnected && !metaAdAccountId && restaurantId != null ? (
                        <a
                          href={`/facebook/select-ad-account?restaurantId=${restaurantId}`}
                          className="inline-flex h-9 shrink-0 cursor-pointer items-center rounded-lg border border-zinc-600 bg-zinc-800 px-3.5 text-xs font-semibold text-zinc-100 no-underline transition-colors hover:border-zinc-500 hover:bg-zinc-700"
                        >
                          Choose ad account
                        </a>
                      ) : null}
                      {!metaConnected ? (
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                          <button
                            type="button"
                            onClick={() => void handleConnectFacebook()}
                            disabled={
                              metaConnectStatus === "loading" || metaStatusLoading
                            }
                            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-[#1877F2] px-3.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#166fe5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2]/60 disabled:cursor-not-allowed disabled:opacity-70"
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
                      ) : null}
                    </div>

                    {metaConnectStatus === "error" && metaError ? (
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
    </div>
  );
}
