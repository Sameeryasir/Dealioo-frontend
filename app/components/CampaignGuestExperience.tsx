"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  LayoutTemplate,
  Loader2,
  MessageSquare,
  Smartphone,
} from "lucide-react";
import type { Funnel } from "@/app/services/funnel/get-campaigns-by-business";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import {
  formatMetaDailyBudget,
  formatMetaDeliveryStatus,
  formatMetaSpend,
} from "@/app/lib/format-meta-ads";
import { connectFacebookInPopup } from "@/app/lib/facebook-oauth-popup";
import {
  getFacebookAdCampaignStats,
  type FacebookAdCampaignStats,
} from "@/app/services/facebook/get-facebook-ad-campaign-stats";
import { getFacebookConnectionStatus } from "@/app/services/facebook/get-facebook-connection-status";

export type CampaignGuestExperienceProps = {
  businessId: number;
  campaignsHref: string;
  /** `undefined` while loading; `null` if not found after load. */
  funnel: Funnel | null | undefined;
  loadError: string | null;
  /** When set, “Fix funnel” navigates to the funnel editor for this campaign. */
  funnelEditorHref?: string;
};

/** Full-width card CTAs: shared look + sits on bottom row via parent flex layout */
const CARD_PRIMARY_ACTION_CLASS =
  "w-full shrink-0 cursor-pointer rounded-xl border border-zinc-800/90 bg-zinc-950 py-3 text-sm font-semibold leading-snug text-white shadow-md shadow-zinc-950/30 ring-1 ring-inset ring-white/[0.08] transition hover:border-zinc-700 hover:bg-zinc-800 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 active:bg-zinc-900";

export default function CampaignGuestExperience({
  businessId,
  campaignsHref,
  funnel,
  loadError,
  funnelEditorHref,
}: CampaignGuestExperienceProps) {
  const [metaConnected, setMetaConnected] = useState(false);
  const [metaAdAccountId, setMetaAdAccountId] = useState<string | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaConnectLoading, setMetaConnectLoading] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [adStats, setAdStats] = useState<FacebookAdCampaignStats | null>(null);
  const [adStatsLoading, setAdStatsLoading] = useState(false);
  const [adStatsError, setAdStatsError] = useState<string | null>(null);

  const refreshMetaStatus = useCallback(async () => {
    setMetaLoading(true);
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
      return status;
    } catch (e) {
      setMetaError(
        e instanceof Error ? e.message : "Could not check Facebook connection.",
      );
    } finally {
      setMetaLoading(false);
    }
  }, [businessId]);

  const loadAdCampaignStats = useCallback(async () => {
    setAdStatsLoading(true);
    setAdStatsError(null);
    try {
      const stats = await getFacebookAdCampaignStats(businessId);
      setAdStats(stats);
    } catch (e) {
      setAdStats(null);
      setAdStatsError(
        e instanceof Error ? e.message : "Could not load Meta campaign stats.",
      );
    } finally {
      setAdStatsLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void (async () => {
      const status = await refreshMetaStatus();
      if (status?.connected && status.metaAdAccountId) {
        void loadAdCampaignStats();
      }
    })();
  }, [refreshMetaStatus, loadAdCampaignStats]);

  const handleConnectFacebook = async () => {
    setMetaConnectLoading(true);
    setMetaError(null);
    try {
      const token = getSetupAccessToken().trim();
      if (!token) {
        throw new Error("You're signed out. Sign in again.");
      }
      const result = await connectFacebookInPopup(token, businessId);
      if (result.status === "connected") {
        const status = await refreshMetaStatus();
        if (status?.connected && status.metaAdAccountId) {
          void loadAdCampaignStats();
        }
      }
    } catch (e) {
      setMetaError(
        e instanceof Error ? e.message : "Could not connect to Facebook.",
      );
    } finally {
      setMetaConnectLoading(false);
    }
  };

  const offerTitle =
    funnel?.offer?.trim() || funnel?.campaignName || "Offer";
  const offerSubtitle =
    funnel?.price != null
      ? `Prepay for ${offerTitle}`
      : "The deal guests redeem in their wallet.";

  return (
    <div className="mx-auto flex w-full max-w-[min(100%,77.62rem)] flex-col gap-10 px-4 py-8 sm:px-8 lg:px-10">
      <header className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Set up your guest experience
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Finish each step so guests can discover your funnel and redeem your
          offer.
        </p>
        <Link
          href={campaignsHref}
          className="mt-4 inline-block text-sm font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900"
        >
          ← All campaigns
        </Link>
      </header>

      <ol
        className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2 text-zinc-500 sm:gap-4"
        aria-label="Setup progress"
      >
        <li className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white ring-2 ring-emerald-600/30">
            <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden />
          </span>
          <span className="hidden text-xs font-medium text-emerald-800 sm:inline">
            Offers
          </span>
        </li>
        <span className="text-zinc-300" aria-hidden>
          →
        </span>
        <li className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-zinc-200 bg-white text-sm font-semibold text-zinc-500">
            <Smartphone className="h-5 w-5" aria-hidden />
          </span>
          <span className="hidden text-xs font-medium sm:inline">Ads</span>
        </li>
        <span className="text-zinc-300" aria-hidden>
          →
        </span>
        <li className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-50 text-sm font-semibold text-amber-800">
            <LayoutTemplate className="h-5 w-5" aria-hidden />
          </span>
          <span className="hidden text-xs font-medium text-amber-900 sm:inline">
            Funnel
          </span>
        </li>
        <span className="text-zinc-300" aria-hidden>
          →
        </span>
        <li className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-zinc-200 bg-white text-sm font-semibold text-zinc-500">
            <MessageSquare className="h-5 w-5" aria-hidden />
          </span>
          <span className="hidden text-xs font-medium sm:inline">
            Automations
          </span>
        </li>
      </ol>

      {loadError ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800"
          role="alert"
        >
          {loadError}
        </p>
      ) : null}

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        {/* h-full + flex-1 body: buttons align to card bottom within each grid row */}
        <section className="flex h-full min-h-0 flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-md ring-1 ring-emerald-900/[0.04]">
          <div className="shrink-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase leading-none tracking-wide text-emerald-800">
                Step 1, Offers
              </p>
              <span className="shrink-0 rounded-full bg-emerald-600 px-2.5 py-1 text-[0.65rem] font-semibold uppercase leading-none tracking-wide text-white">
                Done
              </span>
            </div>
            <p className="mt-2 text-sm font-normal leading-relaxed text-emerald-900/90">
              The deal guests redeem in their wallet, your campaign hook.
            </p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="rounded-xl border border-emerald-200/80 bg-white/90 px-4 py-3.5 shadow-sm">
              <p className="text-base font-semibold leading-snug text-zinc-900">
                {offerTitle}
              </p>
              <p className="mt-1 text-sm font-normal leading-relaxed text-zinc-600">
                {offerSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={CARD_PRIMARY_ACTION_CLASS}
          >
            Edit offer
          </button>
        </section>

        <section className="flex h-full min-h-0 flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-md ring-1 ring-zinc-900/[0.04]">
          <div className="shrink-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase leading-none tracking-wide text-zinc-500">
                Step 2, Ads
              </p>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase leading-none tracking-wide ${
                  metaConnected
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {metaLoading
                  ? "…"
                  : metaConnected
                    ? "Connected"
                    : "Not started"}
              </span>
            </div>
            <p className="mt-2 text-sm font-normal leading-relaxed text-zinc-600">
              Link Facebook to see your ads here, then send people to your funnel.
            </p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col justify-start gap-3">
            {metaLoading ? (
              <p className="text-sm text-zinc-500">Checking Facebook…</p>
            ) : null}

            {!metaLoading && !metaConnected ? (
              <p className="text-sm text-zinc-600">
                Not linked yet. Tap the button below to connect.
              </p>
            ) : null}

            {!metaLoading && metaConnected && !metaAdAccountId ? (
              <>
                <p className="flex items-center gap-2 text-sm font-medium text-emerald-800">
                  <Check className="size-4 shrink-0" aria-hidden />
                  Facebook is linked
                </p>
                <p className="text-sm text-zinc-600">
                  Choose which Meta ad account belongs to this business.
                </p>
                <Link
                  href={`/facebook/select-ad-account?businessId=${businessId}`}
                  className="inline-flex rounded-xl bg-[#1877F2] px-4 py-2.5 text-sm font-semibold text-white no-underline hover:bg-[#166fe5]"
                >
                  Choose ad account
                </Link>
              </>
            ) : null}

            {!metaLoading && metaConnected && metaAdAccountId ? (
              <>
                <p className="flex items-center gap-2 text-sm font-medium text-emerald-800">
                  <Check className="size-4 shrink-0" aria-hidden />
                  Facebook is linked
                </p>

                {adStatsLoading ? (
                  <p className="flex items-center gap-2 text-sm text-zinc-500">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Loading your Facebook ads…
                  </p>
                ) : null}

                {!adStatsLoading &&
                adStats &&
                adStats.campaigns.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-500">
                      Your Meta campaigns (last 30 days)
                      {adStats.adAccountName
                        ? `, ${adStats.adAccountName}`
                        : ""}
                    </p>
                    <ul className="space-y-2">
                      {adStats.campaigns.map((c) => (
                        <li
                          key={c.id}
                          className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5"
                        >
                          <p className="truncate text-sm font-semibold text-zinc-900">
                            {c.name}
                          </p>
                          <dl className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-zinc-600">
                            <dt>Status</dt>
                            <dd className="text-right font-medium text-zinc-800">
                              {formatMetaDeliveryStatus(c.effectiveStatus)}
                            </dd>
                            <dt>Spent</dt>
                            <dd className="text-right font-medium text-zinc-800">
                              {formatMetaSpend(
                                c.insights?.spend,
                                adStats.currency,
                              )}
                            </dd>
                            {c.dailyBudget ? (
                              <>
                                <dt>Budget</dt>
                                <dd className="text-right font-medium text-zinc-800">
                                  {formatMetaDailyBudget(
                                    c.dailyBudget,
                                    adStats.currency,
                                  )}
                                </dd>
                              </>
                            ) : null}
                          </dl>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {!adStatsLoading &&
                adStats &&
                adStats.campaigns.length === 0 ? (
                  <p className="text-sm text-zinc-600">
                    No campaigns in your Meta ad account yet. Create one in Ads
                    Manager.
                  </p>
                ) : null}
              </>
            ) : null}

            {adStatsError ? (
              <p
                className="flex items-start gap-2 text-sm text-red-700"
                role="alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {adStatsError}
              </p>
            ) : null}
            {metaError ? (
              <p
                className="flex items-start gap-2 text-sm text-red-700"
                role="alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {metaError}
              </p>
            ) : null}
          </div>
          {!metaConnected ? (
            <button
              type="button"
              onClick={() => void handleConnectFacebook()}
              disabled={metaConnectLoading || metaLoading}
              className={`${CARD_PRIMARY_ACTION_CLASS} inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {metaConnectLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Connecting…
                </>
              ) : (
                <>
                  <span
                    className="flex size-5 items-center justify-center rounded bg-[#1877F2] text-[10px] font-bold text-white"
                    aria-hidden
                  >
                    f
                  </span>
                  Connect with Facebook
                </>
              )}
            </button>
          ) : null}
        </section>

        <section className="flex h-full min-h-0 flex-col gap-4 rounded-2xl border border-amber-300 bg-amber-50/70 p-6 shadow-md ring-1 ring-amber-900/[0.06]">
          <div className="shrink-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase leading-none tracking-wide text-amber-900">
                Step 3, Funnel
              </p>
              <span className="shrink-0 rounded-full bg-amber-500 px-2.5 py-1 text-[0.65rem] font-semibold uppercase leading-none tracking-wide text-white">
                Needs attention
              </span>
            </div>
            <p className="mt-2 text-sm font-normal leading-relaxed text-amber-950/90">
              Where guests land after tapping an ad, book, buy, or learn more.
            </p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col justify-start gap-1">
            <p className="text-sm font-semibold leading-relaxed text-amber-950">
              2 screens need attention
            </p>
            <p className="text-sm font-normal leading-relaxed text-amber-900/85">
              2 issues to resolve
            </p>
          </div>
          {funnelEditorHref ? (
            <Link
              href={funnelEditorHref}
              className={`${CARD_PRIMARY_ACTION_CLASS} inline-flex items-center justify-center text-center no-underline`}
            >
              Fix funnel
            </Link>
          ) : (
            <button type="button" className={CARD_PRIMARY_ACTION_CLASS}>
              Fix funnel
            </button>
          )}
        </section>

        <section className="flex h-full min-h-0 flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-md ring-1 ring-zinc-900/[0.04]">
          <div className="shrink-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase leading-none tracking-wide text-zinc-500">
                Step 4, Automations
              </p>
              <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-[0.65rem] font-semibold uppercase leading-none tracking-wide text-zinc-600">
                Not started
              </span>
            </div>
            <p className="mt-2 text-sm font-normal leading-relaxed text-zinc-600">
              Texts that keep guests warm until they visit.
            </p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col justify-start">
            <p className="text-sm font-normal leading-relaxed text-zinc-600">
              Welcome, reminder, thank you
            </p>
          </div>
          <button
            type="button"
            className={CARD_PRIMARY_ACTION_CLASS}
          >
            Add automations
          </button>
        </section>
      </div>

      <footer className="sticky bottom-4 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-zinc-700">
          <span className="font-medium text-zinc-900">Ready to share.</span>{" "}
          Generate a tracking link to start driving traffic.
        </p>
        <button
          type="button"
          className="shrink-0 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-900"
        >
          Generate tracking link
        </button>
      </footer>
    </div>
  );
}
