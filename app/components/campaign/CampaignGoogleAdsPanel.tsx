"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Check,
  ExternalLink,
  Eye,
  Loader2,
  Megaphone,
  MousePointerClick,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { MetricStatCardAccent } from "@/app/components/shared/MetricStatCard";
import {
  formatMetaCount,
  formatMetaDeliveryStatus,
  formatMetaSpend,
} from "@/app/lib/format-meta-ads";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import {
  getGoogleAdsCampaignStats,
  type GoogleAdsCampaign,
  type GoogleAdsCampaignStats,
} from "@/app/services/google-ads/get-google-ads-campaign-stats";
import { getGoogleAdsConnectionStatus } from "@/app/services/google-ads/get-google-ads-connection-status";

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

function formatCustomerId(id: string): string {
  const digits = id.replace(/\D/g, "");
  if (digits.length === 10) {
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  }
  return id;
}

function statusBadgeClass(status: string | null | undefined): string {
  const normalized = status?.toUpperCase() ?? "";
  if (normalized === "ENABLED" || normalized === "ACTIVE") {
    return "bg-emerald-500/15 text-emerald-700 ring-emerald-500/25";
  }
  if (normalized === "PAUSED" || normalized.includes("PAUSED")) {
    return "bg-amber-500/15 text-amber-800 ring-amber-500/25";
  }
  return "bg-blue-500/15 text-blue-700 ring-blue-500/25";
}

function statusAccentClass(status: string | null | undefined): string {
  const normalized = status?.toUpperCase() ?? "";
  if (normalized === "ENABLED" || normalized === "ACTIVE") {
    return "from-emerald-500 to-teal-500";
  }
  if (normalized === "PAUSED" || normalized.includes("PAUSED")) {
    return "from-amber-400 to-orange-500";
  }
  return "from-blue-500 to-indigo-500";
}

function sumMetric(
  campaigns: GoogleAdsCampaign[],
  key: "spend" | "impressions" | "clicks",
): number {
  return campaigns.reduce((total, campaign) => {
    const raw = campaign.insights?.[key];
    const n =
      key === "spend"
        ? Number.parseFloat(raw ?? "")
        : Number.parseInt(raw ?? "", 10);
    return total + (Number.isFinite(n) ? n : 0);
  }, 0);
}

type MetricTone = "blue" | "violet" | "emerald" | "amber";

const metricToneStyles: Record<
  MetricTone,
  { icon: string; value: string }
> = {
  blue: { icon: "bg-blue-500/10 text-blue-600", value: "text-blue-950" },
  violet: { icon: "bg-violet-500/10 text-violet-600", value: "text-violet-950" },
  emerald: {
    icon: "bg-emerald-500/10 text-emerald-600",
    value: "text-emerald-950",
  },
  amber: { icon: "bg-amber-500/10 text-amber-600", value: "text-amber-950" },
};

function CampaignMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  tone: MetricTone;
}) {
  const styles = metricToneStyles[tone];
  return (
    <div className="rounded-xl border border-zinc-100 bg-gradient-to-br from-white to-zinc-50/90 p-3.5 shadow-sm ring-1 ring-zinc-950/[0.03]">
      <div
        className={`mb-2.5 flex size-9 items-center justify-center rounded-lg ${styles.icon}`}
      >
        <Icon className="size-4" aria-hidden />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
        {label}
      </p>
      <p
        className={`mt-0.5 text-base font-bold tabular-nums tracking-tight ${styles.value}`}
      >
        {value}
      </p>
    </div>
  );
}

export function CampaignGoogleAdsPanel({
  restaurantId,
}: {
  restaurantId: number;
}) {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleCustomerId, setGoogleCustomerId] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(true);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [adStats, setAdStats] = useState<GoogleAdsCampaignStats | null>(null);
  const [adStatsLoading, setAdStatsLoading] = useState(false);
  const [adStatsError, setAdStatsError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setAdStatsLoading(true);
    setAdStatsError(null);
    try {
      const stats = await getGoogleAdsCampaignStats(restaurantId);
      setAdStats(stats);
    } catch (e) {
      setAdStats(null);
      setAdStatsError(
        e instanceof Error ? e.message : "Could not load Google Ads.",
      );
    } finally {
      setAdStatsLoading(false);
    }
  }, [restaurantId]);

  const refreshConnection = useCallback(async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) {
        setGoogleConnected(false);
        setGoogleCustomerId(null);
        return { connected: false, googleCustomerId: null as string | null };
      }
      const status = await getGoogleAdsConnectionStatus(token, restaurantId);
      setGoogleConnected(status.connected);
      setGoogleCustomerId(status.googleCustomerId);
      return {
        connected: status.connected,
        googleCustomerId: status.googleCustomerId,
      };
    } catch (e) {
      setGoogleConnected(false);
      setGoogleCustomerId(null);
      setGoogleError(
        e instanceof Error ? e.message : "Could not check Google Ads.",
      );
      return { connected: false, googleCustomerId: null as string | null };
    } finally {
      setGoogleLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    void (async () => {
      const { connected, googleCustomerId: customerId } =
        await refreshConnection();
      if (connected && customerId) {
        await loadStats();
      }
    })();
  }, [refreshConnection, loadStats]);

  const campaigns = adStats?.campaigns ?? [];
  const currency = adStats?.currency;
  const totalSpend = useMemo(() => sumMetric(campaigns, "spend"), [campaigns]);
  const totalImpressions = useMemo(
    () => sumMetric(campaigns, "impressions"),
    [campaigns],
  );
  const totalClicks = useMemo(() => sumMetric(campaigns, "clicks"), [campaigns]);
  const activeCount = campaigns.filter(
    (c) => c.effectiveStatus?.toUpperCase() === "ENABLED",
  ).length;

  const adsConsoleUrl = googleCustomerId
    ? `https://ads.google.com/aw/campaigns?ocid=${googleCustomerId}`
    : "https://ads.google.com";

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-blue-50/40 via-white to-white px-4 py-8 sm:px-8 sm:py-10">
      <div
        className="pointer-events-none absolute -right-24 top-0 size-72 rounded-full bg-[#4285F4]/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 size-56 rounded-full bg-[#34A853]/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#4285F4]/20 bg-white/80 px-3 py-1 text-xs font-semibold text-[#3367D6] shadow-sm backdrop-blur-sm">
              <Sparkles className="size-3.5" aria-hidden />
              Google Ads performance
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-zinc-200/80">
                <GoogleLogo className="size-7" />
              </span>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                  Google ads
                </h2>
                <p className="text-sm text-zinc-500">Last 30 days, live sync</p>
              </div>
            </div>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">
              Track spend, impressions, clicks, and conversions from your linked
              Google Ads account, all in one place.
            </p>
          </div>

          {googleConnected && googleCustomerId ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void loadStats()}
                disabled={adStatsLoading}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200/80 bg-white/90 px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm backdrop-blur-sm transition hover:bg-white disabled:opacity-60"
              >
                <RefreshCw
                  className={`size-4 ${adStatsLoading ? "animate-spin" : ""}`}
                  aria-hidden
                />
                Refresh
              </button>
              <a
                href={adsConsoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4285F4] to-[#3367D6] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:from-[#3367D6] hover:to-[#2a56c6]"
              >
                Open Google Ads
                <ExternalLink className="size-4" aria-hidden />
              </a>
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-3xl border border-zinc-200/70 bg-white/90 shadow-xl shadow-zinc-900/5 ring-1 ring-zinc-950/[0.04] backdrop-blur-sm">
          {googleLoading ? (
            <div className="flex items-center gap-3 border-b border-zinc-100 px-6 py-5">
              <Loader2 className="size-5 animate-spin text-[#4285F4]" aria-hidden />
              <p className="text-sm font-medium text-zinc-600">
                Checking Google Ads connection…
              </p>
            </div>
          ) : null}

          {!googleLoading && !googleConnected ? (
            <div className="px-6 py-10 text-center sm:px-10">
              <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50 shadow-inner ring-1 ring-zinc-200/80">
                <GoogleLogo className="size-9 opacity-80" />
              </span>
              <p className="mt-5 text-lg font-bold text-zinc-900">
                Connect Google Ads
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-600">
                Open{" "}
                <span className="font-semibold text-zinc-800">
                  Settings → Integrations
                </span>{" "}
                and connect Google to unlock campaign analytics here.
              </p>
            </div>
          ) : null}

          {!googleLoading && googleConnected && !googleCustomerId ? (
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
                href={`/google/select-customer?restaurantId=${restaurantId}`}
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#4285F4] to-[#3367D6] px-6 py-3 text-sm font-semibold text-white no-underline shadow-lg shadow-blue-500/20 hover:from-[#3367D6] hover:to-[#2a56c6]"
              >
                Choose Ads account
              </Link>
            </div>
          ) : null}

          {!googleLoading && googleConnected && googleCustomerId ? (
            <div className="relative overflow-hidden border-b border-[#4285F4]/20 bg-gradient-to-r from-[#4285F4] via-[#3367D6] to-[#1a56db] px-6 py-5 sm:px-8">
              <div
                className="absolute -right-6 -top-6 size-28 rounded-full bg-white/10 blur-2xl"
                aria-hidden
              />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-white shadow-lg">
                    <GoogleLogo className="size-7" />
                  </span>
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-blue-100">
                      <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-70" />
                        <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                      </span>
                      Live connection
                    </p>
                    <p className="mt-0.5 text-lg font-bold text-white">
                      {adStats?.customerName?.trim() || "Google Ads account"}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-blue-100/90">
                      {formatCustomerId(googleCustomerId)}
                      {currency ? `, ${currency}` : ""}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/google/select-customer?restaurantId=${restaurantId}`}
                  className="inline-flex shrink-0 items-center rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm transition hover:bg-white/25"
                >
                  Change account
                </Link>
              </div>
            </div>
          ) : null}

          <div className="space-y-8 p-5 sm:p-7">
            {googleConnected && googleCustomerId && adStatsLoading && !adStats ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-28 animate-pulse rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50"
                  />
                ))}
              </div>
            ) : null}

            {googleConnected && googleCustomerId && adStats && campaigns.length > 0 ? (
              <>
                <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricStatCardAccent
                    label="Total spend"
                    value={formatMetaSpend(String(totalSpend), currency)}
                    icon={Wallet}
                    tone="blue"
                  />
                  <MetricStatCardAccent
                    label="Impressions"
                    value={formatMetaCount(String(totalImpressions))}
                    icon={Eye}
                    tone="violet"
                  />
                  <MetricStatCardAccent
                    label="Clicks"
                    value={formatMetaCount(String(totalClicks))}
                    icon={MousePointerClick}
                    tone="emerald"
                  />
                  <MetricStatCardAccent
                    label="Active campaigns"
                    value={`${activeCount} / ${campaigns.length}`}
                    icon={TrendingUp}
                    tone="zinc"
                    highlight
                  />
                </div>

                <div>
                  <div className="mb-5 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                        <BarChart3 className="size-4" aria-hidden />
                      </span>
                      <h3 className="text-base font-bold text-zinc-900">
                        Campaigns
                      </h3>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      {adStats.datePreset.replace(/_/g, " ")}
                    </span>
                    <span className="rounded-full bg-[#4285F4]/10 px-3 py-1 text-xs font-semibold text-[#3367D6]">
                      {campaigns.length} total
                    </span>
                  </div>

                  <ul className="grid gap-5 lg:grid-cols-2">
                    {campaigns.map((c) => (
                      <li
                        key={c.id}
                        className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm ring-1 ring-zinc-950/[0.03] transition duration-300 hover:-translate-y-0.5 hover:border-[#4285F4]/30 hover:shadow-lg hover:shadow-blue-500/10"
                      >
                        <div
                          className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${statusAccentClass(c.effectiveStatus)}`}
                          aria-hidden
                        />
                        <div className="flex items-start justify-between gap-3 pl-2">
                          <div className="min-w-0">
                            <p className="truncate text-lg font-bold tracking-tight text-zinc-900">
                              {c.name}
                            </p>
                            <p className="mt-1 font-mono text-[11px] text-zinc-400">
                              ID {c.id}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${statusBadgeClass(c.effectiveStatus)}`}
                          >
                            {formatMetaDeliveryStatus(c.effectiveStatus)}
                          </span>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 pl-2">
                          <CampaignMetric
                            icon={Wallet}
                            label="Spent"
                            value={formatMetaSpend(c.insights?.spend, currency)}
                            tone="blue"
                          />
                          <CampaignMetric
                            icon={Eye}
                            label="Impressions"
                            value={formatMetaCount(c.insights?.impressions)}
                            tone="violet"
                          />
                          <CampaignMetric
                            icon={MousePointerClick}
                            label="Clicks"
                            value={formatMetaCount(c.insights?.clicks)}
                            tone="amber"
                          />
                          <CampaignMetric
                            icon={Users}
                            label="Conversions"
                            value={formatMetaCount(c.insights?.conversions)}
                            tone="emerald"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}

            {googleConnected &&
            googleCustomerId &&
            !adStatsLoading &&
            adStats &&
            campaigns.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-gradient-to-br from-zinc-50 to-white px-6 py-14 text-center">
                <Megaphone
                  className="mx-auto size-12 text-zinc-300"
                  aria-hidden
                />
                <p className="mt-4 text-lg font-bold text-zinc-900">
                  No campaigns yet
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
                  Create campaigns in Google Ads, they&apos;ll show here once
                  they have activity in the last 30 days.
                </p>
                <a
                  href={adsConsoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-zinc-800"
                >
                  Go to Google Ads
                  <ExternalLink className="size-4" aria-hidden />
                </a>
              </div>
            ) : null}

            {adStatsError ? (
              <div
                className="rounded-2xl border border-red-200/80 bg-gradient-to-br from-red-50 to-white px-5 py-4 shadow-sm"
                role="alert"
              >
                <p className="flex items-start gap-2 text-sm font-medium text-red-800">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {adStatsError}
                </p>
                <button
                  type="button"
                  onClick={() => void loadStats()}
                  disabled={adStatsLoading}
                  className="mt-3 cursor-pointer rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-900 shadow-sm hover:bg-red-50 disabled:opacity-60"
                >
                  Try again
                </button>
              </div>
            ) : null}

            {googleError ? (
              <p
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {googleError}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
