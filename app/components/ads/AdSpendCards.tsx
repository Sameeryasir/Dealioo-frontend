"use client";

import { Skeleton } from "@/app/components/skeleton";
import { OVERVIEW_AD_SOURCE_COLORS } from "@/app/components/campaign/overview/charts/overview-chart-config";
import { formatCents } from "@/app/lib/money";
import { Eye, MousePointerClick, Percent, Radar } from "lucide-react";

function AdSpendSparkline({ accent }: { accent: "meta" | "google" }) {
  const stroke =
    accent === "meta"
      ? OVERVIEW_AD_SOURCE_COLORS.meta
      : OVERVIEW_AD_SOURCE_COLORS.google;
  const fillId = `ad-spend-fill-${accent}`;

  return (
    <svg
      className="funnel-overview-ad-spend-card__sparkline"
      viewBox="0 0 160 64"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 48 C18 46, 28 20, 44 24 C60 28, 68 50, 84 42 C100 34, 112 12, 128 18 C140 22, 150 34, 160 28 L160 64 L0 64 Z"
        fill={`url(#${fillId})`}
      />
      <path
        d="M0 48 C18 46, 28 20, 44 24 C60 28, 68 50, 84 42 C100 34, 112 12, 128 18 C140 22, 150 34, 160 28"
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AdSpendCardSkeleton({
  accent,
}: {
  accent: "meta" | "google";
}) {
  return (
    <article
      className={`funnel-overview-ad-spend-card funnel-overview-ad-spend-card--${accent}`}
      aria-busy="true"
      aria-label="Loading ad spend"
    >
      <div className="funnel-overview-ad-spend-card__header">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>
      <div className="funnel-overview-ad-spend-card__body">
        <div className="funnel-overview-ad-spend-card__metrics">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="mt-2 h-4 w-32 rounded-md" />
        </div>
        <Skeleton className="funnel-overview-ad-spend-card__sparkline-slot h-16 w-full rounded-xl" />
      </div>
      <div className="funnel-overview-ad-spend-card__footer">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="funnel-overview-ad-spend-card__stat">
            <Skeleton className="size-9 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-10 rounded-md" />
              <Skeleton className="h-3 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

export function AdSpendCard({
  provider,
  spendCents,
  currency,
  monthLabel,
  linkedCount,
  accent,
  impressions = 0,
  reach = 0,
  clicks = 0,
  ctr = null,
}: {
  provider: "Meta Ads" | "Google Ads";
  spendCents: number;
  currency: string;
  monthLabel: string;
  linkedCount: number;
  accent: "meta" | "google";
  impressions?: number;
  reach?: number;
  clicks?: number;
  ctr?: number | null;
}) {
  return (
    <article
      className={`funnel-overview-ad-spend-card funnel-overview-ad-spend-card--${accent}`}
      aria-label={`${provider} spend for ${monthLabel}`}
    >
      <div className="funnel-overview-ad-spend-card__header">
        <span className="funnel-overview-ad-spend-card__title">
          {provider}
        </span>
        <span className="funnel-overview-ad-spend-card__month">{monthLabel}</span>
      </div>

      <div className="funnel-overview-ad-spend-card__body">
        <div className="funnel-overview-ad-spend-card__metrics">
          <p className="funnel-overview-ad-spend-card__value">
            {formatCents(spendCents, currency)}
          </p>
          {linkedCount > 0 ? (
            <p className="funnel-overview-ad-spend-card__change funnel-overview-ad-spend-card__change--muted">
              {`${linkedCount} linked campaign${linkedCount === 1 ? "" : "s"}`}
            </p>
          ) : null}
        </div>
        <div className="funnel-overview-ad-spend-card__sparkline-slot">
          <AdSpendSparkline accent={accent} />
        </div>
      </div>

      <div className="funnel-overview-ad-spend-card__footer">
        <div className="funnel-overview-ad-spend-card__stat">
          <span className="funnel-overview-ad-spend-card__stat-icon funnel-overview-ad-spend-card__stat-icon--blue">
            <Eye className="size-4" strokeWidth={2.25} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="funnel-overview-ad-spend-card__stat-value">
              {impressions.toLocaleString()}
            </p>
            <p className="funnel-overview-ad-spend-card__stat-label">
              Impressions
            </p>
          </div>
        </div>
        <div className="funnel-overview-ad-spend-card__stat">
          <span className="funnel-overview-ad-spend-card__stat-icon funnel-overview-ad-spend-card__stat-icon--purple">
            <Percent className="size-4" strokeWidth={2.25} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="funnel-overview-ad-spend-card__stat-value">
              {ctr == null ? "—" : `${ctr.toFixed(2)}%`}
            </p>
            <p className="funnel-overview-ad-spend-card__stat-label">CTR</p>
          </div>
        </div>
        <div className="funnel-overview-ad-spend-card__stat">
          <span className="funnel-overview-ad-spend-card__stat-icon funnel-overview-ad-spend-card__stat-icon--green">
            <Radar className="size-4" strokeWidth={2.25} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="funnel-overview-ad-spend-card__stat-value">
              {reach.toLocaleString()}
            </p>
            <p className="funnel-overview-ad-spend-card__stat-label">Reach</p>
          </div>
        </div>
        <div className="funnel-overview-ad-spend-card__stat">
          <span className="funnel-overview-ad-spend-card__stat-icon funnel-overview-ad-spend-card__stat-icon--orange">
            <MousePointerClick className="size-4" strokeWidth={2.25} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="funnel-overview-ad-spend-card__stat-value">
              {clicks.toLocaleString()}
            </p>
            <p className="funnel-overview-ad-spend-card__stat-label">Clicks</p>
          </div>
        </div>
      </div>
    </article>
  );
}

export function AdSpendSection({
  monthLabel,
  subtitle,
  currency,
  metaLoading,
  googleLoading,
  meta,
  google,
}: {
  monthLabel: string;
  subtitle: string;
  currency: string;
  metaLoading: boolean;
  googleLoading: boolean;
  meta: {
    spendCents: number;
    linkedCount: number;
    impressions: number;
    reach: number;
    clicks: number;
    ctr: number | null;
  };
  google: {
    spendCents: number;
    linkedCount: number;
    impressions: number;
    reach: number;
    clicks: number;
    ctr: number | null;
  };
}) {
  return (
    <section
      className="funnel-overview-ad-spend"
      aria-label={`Ad spend for ${monthLabel}`}
    >
      <div className="funnel-overview-ad-spend__heading">
        <p className="funnel-overview-ad-spend__title">Ad spend</p>
        <p className="funnel-overview-ad-spend__subtitle">{subtitle}</p>
      </div>
      <div className="funnel-overview-ad-spend__grid">
        <div className="h-full">
          {metaLoading ? (
            <AdSpendCardSkeleton accent="meta" />
          ) : (
            <AdSpendCard
              provider="Meta Ads"
              spendCents={meta.spendCents}
              currency={currency}
              monthLabel={monthLabel}
              linkedCount={meta.linkedCount}
              accent="meta"
              impressions={meta.impressions}
              reach={meta.reach}
              clicks={meta.clicks}
              ctr={meta.ctr}
            />
          )}
        </div>
        <div className="h-full">
          {googleLoading ? (
            <AdSpendCardSkeleton accent="google" />
          ) : (
            <AdSpendCard
              provider="Google Ads"
              spendCents={google.spendCents}
              currency={currency}
              monthLabel={monthLabel}
              linkedCount={google.linkedCount}
              accent="google"
              impressions={google.impressions}
              reach={google.reach}
              clicks={google.clicks}
              ctr={google.ctr}
            />
          )}
        </div>
      </div>
    </section>
  );
}
