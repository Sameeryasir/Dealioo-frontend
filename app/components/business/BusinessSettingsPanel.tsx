"use client";

import {
  AlertCircle,
  BarChart3,
  Building2,
  ExternalLink,
  Link2,
  Loader2,
  ScanLine,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { clearSetupUser } from "@/app/lib/setup-user";
import { connectGoogleAdsInPopup } from "@/app/lib/google-oauth-popup";
import { BusinessGeneralSettingsForm } from "@/app/components/business/BusinessGeneralSettingsForm";
import { BusinessMembersPanel } from "@/app/components/business/BusinessMembersPanel";
import { FacebookPermissionsPanel } from "@/app/components/facebook/FacebookPermissionsPanel";
import RegisterBusinessCreateMetaAdAccountStep from "@/app/components/register-business/RegisterBusinessCreateMetaAdAccountStep";
import RegisterBusinessCreateStripeAccountStep from "@/app/components/register-business/RegisterBusinessCreateStripeAccountStep";
import RegisterBusinessFacebookConnectStep from "@/app/components/register-business/RegisterBusinessFacebookConnectStep";
import RegisterBusinessMetaAdsQuestionStep from "@/app/components/register-business/RegisterBusinessMetaAdsQuestionStep";
import RegisterBusinessStripeConnectStep from "@/app/components/register-business/RegisterBusinessStripeConnectStep";
import RegisterBusinessStripeQuestionStep from "@/app/components/register-business/RegisterBusinessStripeQuestionStep";
import { getFacebookConnectionStatus } from "@/app/services/facebook/get-facebook-connection-status";
import { disconnectFacebook } from "@/app/services/facebook/disconnect-facebook";
import { getGoogleAdsConnectionStatus } from "@/app/services/google-ads/get-google-ads-connection-status";
import { abortGoogleAdsConnect } from "@/app/services/google-ads/abort-google-ads-connect";
import { disconnectGoogleAds } from "@/app/services/google-ads/disconnect-google-ads";
import { GoogleAdsCampaignsDialog } from "@/app/components/google-ads/GoogleAdsCampaignsDialog";
import { fetchBusinessById } from "@/app/services/business/get-my-business";
import { disconnectStripe } from "@/app/services/stripe/disconnect-stripe";
import { OwnerProfileForm } from "@/app/components/profile/OwnerProfileForm";
import { OwnerSubscriptionSection } from "@/app/components/profile/OwnerSubscriptionSection";
import {
  businessSettingsHref,
  orgSettingsHref,
  type BusinessSettingsSection,
} from "@/app/lib/business-settings-routes";
import { DASHBOARD_KPI_ICON } from "@/app/lib/dashboard-brand-tones";
import { logoutSession } from "@/app/services/auth/logout";

const DASHBOARD_HREF = "/dashboard" as const;

type SectionId = BusinessSettingsSection;

type MetaSetupStep = "question" | "create" | "connect";
type StripeSetupStep = "question" | "create" | "connect";
type IntegrationSetup =
  | { provider: "meta"; step: MetaSetupStep }
  | { provider: "stripe"; step: StripeSetupStep };

type NavItem = {
  id: SectionId;
  label: string;
  icon: typeof User;
  tone: keyof typeof DASHBOARD_KPI_ICON;
};

const accountNav: NavItem[] = [
  { id: "account", label: "Account", icon: User, tone: "blue" },
];

const organizationNav: NavItem[] = [
  { id: "general", label: "Business profile", icon: Building2, tone: "blue" },
  { id: "members", label: "Members", icon: Users, tone: "green" },
  { id: "integrations", label: "Integrations", icon: Link2, tone: "pink" },
  { id: "usage", label: "Usage", icon: BarChart3, tone: "orange" },
  { id: "scanning", label: "Scanning", icon: ScanLine, tone: "blue" },
];

const sectionTitles: Record<SectionId, string> = {
  account: "Account",
  general: "Business profile",
  members: "Members",
  integrations: "Integrations",
  usage: "Usage",
  scanning: "Scanning",
};

// --- Integration card themes (sync with dashboard brand tones) ---
const integrationCardThemes = {
  stripe: {
    accent: "bg-gradient-to-r from-[#635BFF] via-[#7c3aed] to-[#635BFF]",
    surface: "bg-gradient-to-br from-white to-[#f5f3ff]",
    chip: "bg-[#ede9fe] text-[#5b21b6] ring-1 ring-[#ddd6fe]",
    secondaryBtn:
      "inline-flex h-9 shrink-0 cursor-pointer items-center rounded-lg border border-[#ddd6fe] bg-[#f5f3ff] px-3.5 text-xs font-semibold text-[#5b21b6] no-underline shadow-sm transition-all hover:border-[#c4b5fd] hover:bg-[#ede9fe]",
  },
  facebook: {
    accent: "bg-gradient-to-r from-[#1877F2] via-[#3b82f6] to-[#1877F2]",
    surface: "bg-gradient-to-br from-white to-[#f4f8ff]",
    chip: "bg-[#e8f2ff] text-[#1877f2] ring-1 ring-[#bfdbfe]",
    secondaryBtn:
      "inline-flex h-9 shrink-0 cursor-pointer items-center rounded-lg border border-[#bfdbfe] bg-[#e8f2ff] px-3.5 text-xs font-semibold text-[#1877f2] no-underline shadow-sm transition-all hover:border-[#93c5fd] hover:bg-[#dbeafe]",
  },
  google: {
    accent: "bg-gradient-to-r from-[#34a853] via-[#4285F4] to-[#f77737]",
    surface: "bg-gradient-to-br from-white to-[#f0fdf4]",
    chip: "bg-[#ecfdf5] text-[#166534] ring-1 ring-[#bbf7d0]",
    secondaryBtn:
      "inline-flex h-9 shrink-0 cursor-pointer items-center rounded-lg border border-[#bbf7d0] bg-[#ecfdf5] px-3.5 text-xs font-semibold text-[#166534] no-underline shadow-sm transition-all hover:border-[#86efac] hover:bg-[#d1fae5]",
  },
} as const;

function IntegrationCardShell({
  theme,
  children,
}: {
  theme: keyof typeof integrationCardThemes;
  children: ReactNode;
}) {
  const t = integrationCardThemes[theme];
  return (
    <li
      className={`overflow-hidden rounded-[1.35rem] border border-[#e8edf5] shadow-[0_6px_18px_rgba(15,23,42,0.04)] ${t.surface}`}
    >
      <div className={`h-1.5 w-full ${t.accent}`} aria-hidden />
      <div className="p-5">{children}</div>
    </li>
  );
}

const integrationRemoveBtnClass =
  "inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 text-xs font-semibold text-red-700 transition-all hover:border-red-300 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/40 disabled:cursor-not-allowed disabled:opacity-70";

function IntegrationConnectedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[0.65rem] font-semibold text-emerald-700 ring-1 ring-emerald-200">
      <span
        className="size-1.5 rounded-full bg-emerald-500"
        aria-hidden
      />
      Connected
    </span>
  );
}

function IntegrationLoadingBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[0.65rem] font-medium text-slate-500 ring-1 ring-slate-200">
      <Loader2 className="size-2.5 animate-spin" strokeWidth={2.5} aria-hidden />
      Checking
    </span>
  );
}

function IntegrationAccountChip({
  label,
  value,
  chipClassName = "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
}: {
  label: string;
  value: string;
  chipClassName?: string;
}) {
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-2">
      <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </span>
      <code
        className={`rounded-md px-2 py-0.5 font-mono text-[0.7rem] ${chipClassName}`}
      >
        {value}
      </code>
    </div>
  );
}

function IntegrationsOverview({
  stripeConnected,
  metaConnected,
  googleConnected,
  loading,
}: {
  stripeConnected: boolean;
  metaConnected: boolean;
  googleConnected: boolean;
  loading: boolean;
}) {
  const connectedCount = [stripeConnected, metaConnected, googleConnected].filter(
    Boolean,
  ).length;

  return (
    <div className="mb-4 overflow-hidden rounded-[1.2rem] border border-[#e8edf5] bg-gradient-to-r from-[#f8faff] via-white to-[#fdf2f8] p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="m-0 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#1877f2]">
            Connected platforms
          </p>
          <p className="m-0 mt-1 text-sm text-slate-600">
            Link payments and ad accounts to run campaigns and track performance.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-[#1877f2]/10 px-3 py-1 text-[0.72rem] font-bold text-[#1877f2] ring-1 ring-[#1877f2]/20">
          {loading ? "Checking…" : `${connectedCount} of 3 connected`}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ring-1 ${
            stripeConnected
              ? "bg-[#ede9fe] text-[#5b21b6] ring-[#ddd6fe]"
              : "bg-white text-slate-500 ring-[#e8edf5]"
          }`}
        >
          <span className="size-1.5 rounded-full bg-[#635BFF]" aria-hidden />
          Stripe
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ring-1 ${
            metaConnected
              ? "bg-[#e8f2ff] text-[#1877f2] ring-[#bfdbfe]"
              : "bg-white text-slate-500 ring-[#e8edf5]"
          }`}
        >
          <span className="size-1.5 rounded-full bg-[#1877f2]" aria-hidden />
          Facebook
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ring-1 ${
            googleConnected
              ? "bg-[#ecfdf5] text-[#166534] ring-[#bbf7d0]"
              : "bg-white text-slate-500 ring-[#e8edf5]"
          }`}
        >
          <span className="size-1.5 rounded-full bg-[#34a853]" aria-hidden />
          Google Ads
        </span>
      </div>
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

type BusinessSettingsPanelProps = {
  section: SectionId;
  businessId?: number;
};

export function BusinessSettingsPanel({
  section,
  businessId,
}: BusinessSettingsPanelProps) {
  const router = useRouter();

  type ConnectStatus = "idle" | "loading" | "error";
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeStatusLoading, setStripeStatusLoading] = useState(true);
  const [stripeStatus, setStripeStatus] = useState<ConnectStatus>("idle");
  const [stripeDisconnectStatus, setStripeDisconnectStatus] =
    useState<ConnectStatus>("idle");
  const [stripeError, setStripeError] = useState<string | null>(null);

  const [metaConnected, setMetaConnected] = useState(false);
  const [metaAdAccountId, setMetaAdAccountId] = useState<string | null>(null);
  const [metaOauthScopes, setMetaOauthScopes] = useState<string[]>([]);
  const [metaMissingRequiredScopes, setMetaMissingRequiredScopes] = useState<
    string[]
  >([]);
  const [metaRequestedScopes, setMetaRequestedScopes] = useState<string[]>([]);
  const [metaRequiredScopes, setMetaRequiredScopes] = useState<string[]>([]);
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
  const [businessName, setBusinessName] = useState("Your business");
  const [integrationSetup, setIntegrationSetup] =
    useState<IntegrationSetup | null>(null);

  const refreshStripeStatus = useCallback(async () => {
    if (businessId == null) {
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
      const business = await fetchBusinessById(token, businessId);
      setStripeConnected(Boolean(business.stripeAccountId?.trim()));
      if (business.name?.trim()) {
        setBusinessName(business.name.trim());
      }
    } catch (e) {
      setStripeError(
        e instanceof Error ? e.message : "Could not check Stripe connection.",
      );
    } finally {
      setStripeStatusLoading(false);
    }
  }, [businessId]);

  const refreshMetaStatus = useCallback(async () => {
    if (businessId == null) {
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
      const status = await getFacebookConnectionStatus(token, businessId);
      setMetaConnected(status.connected);
      setMetaAdAccountId(status.metaAdAccountId);
      setMetaOauthScopes(status.metaOauthScopes ?? []);
      setMetaMissingRequiredScopes(status.missingRequiredScopes ?? []);
      setMetaRequestedScopes(status.requestedScopes ?? []);
      setMetaRequiredScopes(status.requiredScopes ?? []);
    } catch (e) {
      setMetaError(
        e instanceof Error ? e.message : "Could not check Facebook connection.",
      );
    } finally {
      setMetaStatusLoading(false);
    }
  }, [businessId]);

  const refreshGoogleStatus = useCallback(async () => {
    if (businessId == null) {
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
      const status = await getGoogleAdsConnectionStatus(token, businessId);
      setGoogleConnected(status.connected);
      setGoogleCustomerId(status.googleCustomerId);
    } catch (e) {
      setGoogleError(
        e instanceof Error ? e.message : "Could not check Google Ads connection.",
      );
    } finally {
      setGoogleStatusLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (businessId == null) return;
    void refreshStripeStatus();
    void refreshMetaStatus();
    void refreshGoogleStatus();
  }, [businessId, refreshStripeStatus, refreshMetaStatus, refreshGoogleStatus]);

  useEffect(() => {
    setIntegrationSetup(null);
  }, [businessId, section]);

  const handleSignOut = useCallback(async () => {
    await logoutSession();
    clearSetupUser();
    router.push("/auth/login");
  }, [router]);

  const settingsHref = useCallback(
    (targetSection: SectionId) => {
      if (businessId != null) {
        return businessSettingsHref(businessId, targetSection);
      }
      return orgSettingsHref(targetSection);
    },
    [businessId],
  );

  const startMetaSetup = useCallback(() => {
    if (businessId == null) {
      setMetaError(
        "Open this from a business page so we know which one to connect.",
      );
      setMetaConnectStatus("error");
      return;
    }
    setMetaError(null);
    setMetaConnectStatus("idle");
    setIntegrationSetup({ provider: "meta", step: "question" });
  }, [businessId]);

  const startStripeSetup = useCallback(() => {
    if (businessId == null) {
      setStripeError(
        "Open this from a business page so we know which one to connect.",
      );
      setStripeStatus("error");
      return;
    }
    setStripeError(null);
    setStripeStatus("idle");
    setIntegrationSetup({ provider: "stripe", step: "question" });
  }, [businessId]);

  const exitIntegrationSetup = useCallback(
    async (provider: "meta" | "stripe") => {
      setIntegrationSetup(null);
      if (provider === "meta") {
        await refreshMetaStatus();
      } else {
        await refreshStripeStatus();
      }
    },
    [refreshMetaStatus, refreshStripeStatus],
  );

  const handleDisconnectStripe = async () => {
    if (businessId == null) return;

    const confirmed = window.confirm(
      "Remove this Stripe account from Dealioo? Funnel payments will stop until you connect Stripe again.",
    );
    if (!confirmed) return;

    setStripeDisconnectStatus("loading");
    setStripeError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) {
        throw new Error("You're signed out. Sign in again to remove Stripe.");
      }
      await disconnectStripe(token, businessId);
      setStripeConnected(false);
      setStripeDisconnectStatus("idle");
    } catch (e) {
      setStripeDisconnectStatus("error");
      setStripeError(
        e instanceof Error ? e.message : "Could not remove Stripe account.",
      );
    }
  };

  const handleDisconnectFacebook = async () => {
    if (businessId == null) return;

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
      await disconnectFacebook(token, businessId);
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
      if (businessId == null) {
        throw new Error(
          "Open this from a business page so we know which one to connect.",
        );
      }
      const result = await connectGoogleAdsInPopup(token, businessId);
      if (result.status === "connected") {
        await refreshGoogleStatus();
      } else {
        await abortGoogleAdsConnect(businessId);
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
    if (businessId == null) return;

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
      await disconnectGoogleAds(token, businessId);
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

  const navLink = (item: NavItem) => {
    const Icon = item.icon;
    const selected = section === item.id;
    const hoverBorder =
      item.tone === "pink"
        ? "hover:border-[#e1306c]/35"
        : item.tone === "green"
          ? "hover:border-[#34a853]/35"
          : item.tone === "orange"
            ? "hover:border-[#f77737]/35"
            : "hover:border-[#1877f2]/35";

    return (
      <Link
        key={item.id}
        href={settingsHref(item.id)}
        className={`flex items-center gap-2.5 rounded-[0.95rem] border px-2.5 py-2.5 text-left text-sm font-semibold no-underline transition duration-200 ${
          selected
            ? "border-[#1877f2]/30 bg-[#1877f2]/[0.07] text-[#1877f2] shadow-[0_4px_14px_rgba(24,119,242,0.12)]"
            : `border-[#e8edf5] bg-white text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.03)] ${hoverBorder}`
        }`}
        aria-current={selected ? "page" : undefined}
      >
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
            selected ? DASHBOARD_KPI_ICON[item.tone] : DASHBOARD_KPI_ICON[item.tone]
          }`}
        >
          <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <section className="rd-premium rd-premium--fill" aria-label="Settings">
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(14.5rem,16.5rem)_minmax(0,1fr)] lg:items-stretch">
          <aside className="relative flex flex-col overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-gradient-to-b from-white via-white to-[#f4f8ff] px-3.5 py-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]">
            <span
              className="pointer-events-none absolute -top-8 left-1/2 size-28 -translate-x-1/2 rounded-full bg-[#1877f2]/10 blur-3xl"
              aria-hidden
            />
            <p className="relative m-0 text-center text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500">
              Menu
            </p>

            <div className="relative mt-3 flex flex-col gap-3">
              {businessId != null ? (
                <div>
                  <p className="mb-2 px-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Organization
                  </p>
                  <div className="flex flex-col gap-2">
                    {organizationNav.map(navLink)}
                  </div>
                </div>
              ) : null}
              {businessId == null ? (
                <div>
                  <p className="mb-2 px-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Account
                  </p>
                  <div className="flex flex-col gap-2">{accountNav.map(navLink)}</div>
                </div>
              ) : null}
              {businessId == null ? (
                <div>
                  <p className="mb-2 px-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Organization
                  </p>
                  <div className="flex flex-col gap-2">
                    {organizationNav.map(navLink)}
                  </div>
                </div>
              ) : null}
            </div>
          </aside>

          <article className="relative flex min-h-0 flex-col overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]">
            <header className="shrink-0 border-b border-[#e8edf5] bg-gradient-to-r from-[#f8faff] to-white px-5 py-4 sm:px-7 sm:py-5">
              <p className="m-0 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#1877f2]">
                {businessId != null ? "Organization" : "Account"}
              </p>
              <h2 className="m-0 mt-1 text-[clamp(1.2rem,2vw,1.5rem)] font-extrabold tracking-tight text-slate-900">
                {section === "integrations" && integrationSetup?.provider === "stripe"
                  ? "Connect Stripe"
                  : section === "integrations" &&
                      integrationSetup?.provider === "meta"
                    ? "Connect Meta Ads"
                    : sectionTitles[section]}
              </h2>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">

            {section === "general" && businessId != null ? (
              <BusinessGeneralSettingsForm businessId={businessId} />
            ) : section === "members" && businessId != null ? (
              <BusinessMembersPanel businessId={businessId} embedded />
            ) : section === "account" && businessId == null ? (
              <div className="flex max-w-3xl flex-col gap-8">
                <OwnerProfileForm variant="light" layout="compact" />
                <OwnerSubscriptionSection variant="light" layout="page" />
                <div className="flex flex-col gap-3 border-t border-[#e8edf5] pt-6">
                <button
                  type="button"
                  onClick={() => {
                    router.push(DASHBOARD_HREF);
                  }}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#1877f2]/25 bg-[#f8faff] px-4 py-3 text-sm font-medium text-[#1877f2] transition-colors hover:border-[#1877f2]/40 hover:bg-[#1877f2]/10"
                >
                  <Building2 className="size-4 shrink-0" aria-hidden strokeWidth={2} />
                  Switch Organization
                </button>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="w-full cursor-pointer rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-500 active:bg-red-700"
                >
                  Sign Out
                </button>
                </div>
              </div>
            ) : section === "integrations" ? (
              <div className="w-full max-w-3xl lg:max-w-none">
                {integrationSetup && businessId != null ? (
                  <div className="w-full">
                    {integrationSetup.provider === "meta" &&
                    integrationSetup.step === "question" ? (
                      <RegisterBusinessMetaAdsQuestionStep
                        embedded
                        onHasAccount={() =>
                          setIntegrationSetup({
                            provider: "meta",
                            step: "connect",
                          })
                        }
                        onNoAccount={() =>
                          setIntegrationSetup({
                            provider: "meta",
                            step: "create",
                          })
                        }
                        onSkip={() => void exitIntegrationSetup("meta")}
                      />
                    ) : null}
                    {integrationSetup.provider === "meta" &&
                    integrationSetup.step === "create" ? (
                      <RegisterBusinessCreateMetaAdAccountStep
                        embedded
                        onContinue={() =>
                          setIntegrationSetup({
                            provider: "meta",
                            step: "connect",
                          })
                        }
                        onBack={() =>
                          setIntegrationSetup({
                            provider: "meta",
                            step: "question",
                          })
                        }
                        onSkip={() => void exitIntegrationSetup("meta")}
                      />
                    ) : null}
                    {integrationSetup.provider === "meta" &&
                    integrationSetup.step === "connect" ? (
                      <RegisterBusinessFacebookConnectStep
                        embedded
                        businessId={businessId}
                        businessName={businessName}
                        onContinue={() => void exitIntegrationSetup("meta")}
                        onBack={() =>
                          setIntegrationSetup({
                            provider: "meta",
                            step: "question",
                          })
                        }
                      />
                    ) : null}
                    {integrationSetup.provider === "stripe" &&
                    integrationSetup.step === "question" ? (
                      <RegisterBusinessStripeQuestionStep
                        embedded
                        onHasAccount={() =>
                          setIntegrationSetup({
                            provider: "stripe",
                            step: "connect",
                          })
                        }
                        onNoAccount={() =>
                          setIntegrationSetup({
                            provider: "stripe",
                            step: "create",
                          })
                        }
                        onSkip={() => void exitIntegrationSetup("stripe")}
                        onBack={() => setIntegrationSetup(null)}
                      />
                    ) : null}
                    {integrationSetup.provider === "stripe" &&
                    integrationSetup.step === "create" ? (
                      <RegisterBusinessCreateStripeAccountStep
                        embedded
                        onContinue={() =>
                          setIntegrationSetup({
                            provider: "stripe",
                            step: "connect",
                          })
                        }
                        onBack={() =>
                          setIntegrationSetup({
                            provider: "stripe",
                            step: "question",
                          })
                        }
                        onSkip={() => void exitIntegrationSetup("stripe")}
                      />
                    ) : null}
                    {integrationSetup.provider === "stripe" &&
                    integrationSetup.step === "connect" ? (
                      <RegisterBusinessStripeConnectStep
                        embedded
                        businessId={businessId}
                        businessName={businessName}
                        onContinue={() => void exitIntegrationSetup("stripe")}
                        onBack={() =>
                          setIntegrationSetup({
                            provider: "stripe",
                            step: "question",
                          })
                        }
                      />
                    ) : null}
                  </div>
                ) : (
                  <>
                <IntegrationsOverview
                  stripeConnected={stripeConnected}
                  metaConnected={metaConnected}
                  googleConnected={googleConnected}
                  loading={
                    stripeStatusLoading || metaStatusLoading || googleStatusLoading
                  }
                />
                <ul className="space-y-4">
                  <IntegrationCardShell theme="stripe">
                    <div className="flex flex-wrap items-center gap-5 lg:flex-nowrap lg:justify-between">
                      <span
                        aria-hidden
                        className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#635BFF] shadow-lg shadow-[#635BFF]/30 ring-1 ring-white/20"
                      >
                        <StripeLogo className="h-4 w-auto text-white" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold tracking-tight text-slate-900">
                            Stripe
                          </p>
                          {stripeStatusLoading ? (
                            <IntegrationLoadingBadge />
                          ) : stripeConnected ? (
                            <IntegrationConnectedBadge />
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          Accept payments and manage subscriptions for your funnels.
                        </p>
                      </div>

                      {stripeStatusLoading ? null : stripeConnected ? (
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                          <button
                            type="button"
                            onClick={() => void handleDisconnectStripe()}
                            disabled={
                              stripeDisconnectStatus === "loading" ||
                              stripeStatusLoading
                            }
                            className={integrationRemoveBtnClass}
                          >
                            {stripeDisconnectStatus === "loading" ? (
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
                            onClick={startStripeSetup}
                            disabled={stripeStatusLoading}
                            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-[#635BFF] px-4 text-xs font-semibold text-white shadow-md shadow-[#635BFF]/25 transition-all hover:bg-[#544ae0] hover:shadow-lg hover:shadow-[#635BFF]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9C95FF] disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            <ExternalLink
                              className="size-3.5"
                              strokeWidth={2}
                              aria-hidden
                            />
                            Connect
                          </button>
                        </div>
                      )}
                    </div>

                    {(stripeStatus === "error" || stripeDisconnectStatus === "error") &&
                    stripeError ? (
                      <div
                        role="alert"
                        className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                      >
                        <AlertCircle
                          className="mt-px size-3.5 shrink-0"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        <span>{stripeError}</span>
                      </div>
                    ) : null}
                  </IntegrationCardShell>

                  <IntegrationCardShell theme="facebook">
                    <div className="flex flex-wrap items-center gap-5 lg:flex-nowrap lg:justify-between">
                      <span
                        aria-hidden
                        className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#1877F2] shadow-lg shadow-[#1877F2]/30 ring-1 ring-white/20"
                      >
                        <FacebookLogo className="size-8 text-white" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold tracking-tight text-slate-900">
                            Facebook
                          </p>
                          {metaStatusLoading ? (
                            <IntegrationLoadingBadge />
                          ) : metaConnected ? (
                            <IntegrationConnectedBadge />
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          Pull ad spend, impressions, reach, clicks, and campaign
                          stats from Meta.
                        </p>
                        {metaConnected && metaAdAccountId ? (
                          <IntegrationAccountChip
                            label="Ad account"
                            value={metaAdAccountId.replace(/^act_/, "")}
                            chipClassName={integrationCardThemes.facebook.chip}
                          />
                        ) : null}
                      </div>

                      {metaStatusLoading ? null : metaConnected ? (
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                          {metaAdAccountId && businessId != null ? (
                            <a
                              href={`/facebook/select-ad-account?businessId=${businessId}`}
                              className={integrationCardThemes.facebook.secondaryBtn}
                            >
                              Change ad account
                            </a>
                          ) : businessId != null ? (
                            <a
                              href={`/facebook/select-ad-account?businessId=${businessId}`}
                              className={integrationCardThemes.facebook.secondaryBtn}
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
                            onClick={startMetaSetup}
                            disabled={metaStatusLoading}
                            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-[#1877F2] px-4 text-xs font-semibold text-white shadow-md shadow-[#1877F2]/25 transition-all hover:bg-[#166fe5] hover:shadow-lg hover:shadow-[#1877F2]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2]/60 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            <ExternalLink
                              className="size-3.5"
                              strokeWidth={2}
                              aria-hidden
                            />
                            Connect with Facebook
                          </button>
                        </div>
                      )}
                    </div>

                    <FacebookPermissionsPanel
                      grantedScopes={metaOauthScopes}
                      missingRequiredScopes={metaMissingRequiredScopes}
                      requestedScopes={metaRequestedScopes}
                      requiredScopes={metaRequiredScopes}
                      connected={metaConnected}
                      loading={metaStatusLoading}
                    />

                    {(metaConnectStatus === "error" || metaDisconnectStatus === "error") &&
                    metaError ? (
                      <div
                        role="alert"
                        className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                      >
                        <AlertCircle
                          className="mt-px size-3.5 shrink-0"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        <span>{metaError}</span>
                      </div>
                    ) : null}
                  </IntegrationCardShell>

                  <IntegrationCardShell theme="google">
                    <div className="flex flex-wrap items-center gap-5 lg:flex-nowrap lg:justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            googleConnected &&
                            googleCustomerId &&
                            businessId != null
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
                        className="flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-white shadow-lg shadow-[#34a853]/20 ring-1 ring-[#bbf7d0] transition-all hover:shadow-xl hover:shadow-[#4285F4]/25 hover:ring-[#4285F4]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]/60 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <GoogleLogo className="size-8" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold tracking-tight text-slate-900">
                            Google Ads
                          </p>
                          {googleStatusLoading ? (
                            <IntegrationLoadingBadge />
                          ) : googleConnected ? (
                            <IntegrationConnectedBadge />
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          Pull spend, impressions, clicks, and campaign stats
                          from Google Ads.
                        </p>
                        {googleConnected && googleCustomerId ? (
                          <IntegrationAccountChip
                            label="Customer ID"
                            value={googleCustomerId}
                            chipClassName={integrationCardThemes.google.chip}
                          />
                        ) : null}
                      </div>

                      {googleStatusLoading ? null : googleConnected ? (
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                          {businessId != null ? (
                            <a
                              href={`/google/select-customer?businessId=${businessId}`}
                              className={integrationCardThemes.google.secondaryBtn}
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
                            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-[#34a853] to-[#4285F4] px-4 text-xs font-semibold text-white shadow-md shadow-[#34a853]/25 transition-all hover:from-[#2d9749] hover:to-[#3b78e0] hover:shadow-lg hover:shadow-[#4285F4]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]/50 disabled:cursor-not-allowed disabled:opacity-70"
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
                        className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                      >
                        <AlertCircle
                          className="mt-px size-3.5 shrink-0"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        <span>{googleError}</span>
                      </div>
                    ) : null}
                  </IntegrationCardShell>
                </ul>
                  </>
                )}
              </div>
            ) : (
              <p className="max-w-md text-sm leading-relaxed text-slate-500">
                {sectionTitles[section]} settings will be available here.
              </p>
            )}
            </div>
          </article>
        </div>

      {businessId != null ? (
        <GoogleAdsCampaignsDialog
          open={googleCampaignsOpen}
          onClose={() => setGoogleCampaignsOpen(false)}
          businessId={businessId}
          customerId={googleCustomerId}
        />
      ) : null}
    </section>
  );
}
