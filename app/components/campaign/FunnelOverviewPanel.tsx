"use client";

import { DollarSign, TrendingUp, UserPlus, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, type ReactNode } from "react";
import { MetricStatCardAccent } from "@/app/components/shared/MetricStatCard";
import { Skeleton } from "@/app/components/skeleton";
import { useFunnelEventStats } from "@/app/hooks/use-funnel-event-stats";
import { formatCents } from "@/app/lib/money";
import { funnelPanelItem, funnelPanelStagger, standardEase } from "@/app/lib/motion";
import { panelCardClass, panelCardPaddingClass } from "@/app/lib/panel-styles";

type ProgressTone = "zinc" | "emerald" | "blue" | "amber" | "violet";

const progressFillClass: Record<ProgressTone, string> = {
  zinc: "bg-zinc-800",
  emerald: "bg-emerald-600",
  blue: "bg-blue-600",
  amber: "bg-amber-500",
  violet: "bg-violet-600",
};

function OverviewPanelCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex h-full min-h-0 flex-col ${panelCardClass} ${panelCardPaddingClass} transition duration-200 hover:shadow-md ${className}`}
    >
      <div className="mb-5 shrink-0 border-b border-zinc-100 pb-4">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function FunnelProgressBar({
  label,
  valueLabel,
  percent,
  tone = "zinc",
}: {
  label: string;
  valueLabel: string;
  percent: number;
  tone?: ProgressTone;
}) {
  const width = `${Math.min(100, Math.max(0, percent))}%`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-zinc-800">{label}</span>
        <span className="shrink-0 tabular-nums text-zinc-500">{valueLabel}</span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-inset ring-zinc-200/60"
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${progressFillClass[tone]}`}
          style={{ width }}
        />
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading stats">
      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-full ${panelCardClass} ${panelCardPaddingClass}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton funnel className="h-3 w-16" />
                <Skeleton funnel className="h-8 w-20" />
                <Skeleton funnel className="h-3 w-28" />
              </div>
              <Skeleton funnel className="size-11 shrink-0 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid auto-rows-fr gap-5 lg:grid-cols-2">
        <div className={`h-full ${panelCardClass} ${panelCardPaddingClass}`}>
          <Skeleton funnel className="h-4 w-36" />
          <Skeleton funnel className="mt-2 h-3 w-28" />
          <div className="mt-6 space-y-5">
            <Skeleton funnel className="h-2.5 w-full rounded-full" />
            <Skeleton funnel className="h-2.5 w-4/5 rounded-full" />
          </div>
        </div>
        <div className={`h-full ${panelCardClass} ${panelCardPaddingClass}`}>
          <Skeleton funnel className="h-4 w-24" />
          <Skeleton funnel className="mt-2 h-3 w-32" />
          <div className="mt-4 space-y-3">
            <Skeleton funnel className="h-12 w-full rounded-xl" />
            <Skeleton funnel className="h-12 w-full rounded-xl" />
            <Skeleton funnel className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>

      <div className={`${panelCardClass} ${panelCardPaddingClass}`}>
        <Skeleton funnel className="h-4 w-28" />
        <Skeleton funnel className="mt-2 mb-5 h-3 w-40" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between gap-4">
                <Skeleton funnel className="h-3 w-32" />
                <Skeleton funnel className="h-3 w-20" />
              </div>
              <Skeleton funnel className="h-2.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TotalsBarChart({
  signups,
  payments,
}: {
  signups: number;
  payments: number;
}) {
  const max = Math.max(signups, payments, 1);

  return (
    <OverviewPanelCard
      className="h-full"
      title="Signups vs payments"
      subtitle="Compare volume side by side"
    >
      <div className="flex flex-1 flex-col justify-center space-y-6">
        <FunnelProgressBar
          label="Signups"
          valueLabel={signups.toLocaleString()}
          percent={(signups / max) * 100}
          tone="emerald"
        />
        <FunnelProgressBar
          label="Payments"
          valueLabel={payments.toLocaleString()}
          percent={(payments / max) * 100}
          tone="blue"
        />
      </div>
    </OverviewPanelCard>
  );
}

function BreakdownCard({
  signupOnly,
  paidAfterSignup,
}: {
  signupOnly: number;
  paidAfterSignup: number;
}) {
  const rows = [
    { label: "Signup only", value: signupOnly, tone: "text-amber-700 bg-amber-50" },
    {
      label: "Paid after signup",
      value: paidAfterSignup,
      tone: "text-emerald-700 bg-emerald-50",
    },
  ];

  return (
    <OverviewPanelCard
      className="h-full"
      title="Breakdown"
      subtitle="Signup and payment split"
    >
      <ul className="flex flex-1 flex-col justify-center gap-2">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between gap-4 rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3.5 transition hover:border-zinc-200 hover:bg-white"
          >
            <span className="text-sm font-medium text-zinc-700">{row.label}</span>
            <span
              className={`inline-flex min-w-[2.5rem] items-center justify-center rounded-lg px-2.5 py-1 text-sm font-semibold tabular-nums ${row.tone}`}
            >
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </OverviewPanelCard>
  );
}

export function FunnelOverviewPanel({
  campaignName,
  funnelId,
  isFunnelIdLoading = false,
}: {
  campaignName?: string;
  price?: number | string;
  funnelId?: number | null;
  isFunnelIdLoading?: boolean;
}) {
  const { stats, isLoading: isStatsLoading, error } =
    useFunnelEventStats(funnelId);

  const isWaitingForStats =
    funnelId != null && stats == null && error == null;
  const showSkeleton =
    isFunnelIdLoading || isStatsLoading || isWaitingForStats;
  const showNoFunnelMessage = !showSkeleton && funnelId == null;

  const conversionRate = useMemo(() => {
    if (!stats || stats.signups <= 0) return 0;
    return (stats.payments / stats.signups) * 100;
  }, [stats]);

  const funnelSteps = useMemo(() => {
    if (!stats) return [];
    const base = Math.max(stats.signups, 1);
    return [
      {
        step: "Signups",
        count: stats.signups,
        pct: 100,
        tone: "emerald" as ProgressTone,
      },
      {
        step: "Signup only (not paid)",
        count: stats.signupOnly,
        pct: (stats.signupOnly / base) * 100,
        tone: "amber" as ProgressTone,
      },
      {
        step: "Paid after signup",
        count: stats.paidAfterSignup,
        pct: (stats.paidAfterSignup / base) * 100,
        tone: "blue" as ProgressTone,
      },
      {
        step: "Total payments",
        count: stats.payments,
        pct: (stats.payments / base) * 100,
        tone: "violet" as ProgressTone,
      },
    ];
  }, [stats]);

  const displayName = campaignName?.trim() ? campaignName : "Campaign";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-zinc-50 via-white to-zinc-100/70">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
        <motion.header
          className="mb-8 rounded-2xl border border-zinc-200/80 bg-white/90 px-5 py-5 shadow-sm ring-1 ring-zinc-950/[0.03] backdrop-blur-sm sm:px-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: standardEase }}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Overview
            </p>
            <h2 className="font-display mt-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
              {displayName}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600">
              Signups, payments, and revenue for this funnel.
            </p>
          </div>
        </motion.header>

        {showNoFunnelMessage ? (
          <p className="rounded-2xl border border-amber-200/90 bg-amber-50 px-4 py-3.5 text-sm text-amber-950 shadow-sm">
            No funnel id yet. Open the Funnel tab and save once to load stats.
          </p>
        ) : null}

        {showSkeleton ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: standardEase }}
          >
            <OverviewSkeleton />
          </motion.div>
        ) : null}

        {error && !showSkeleton ? (
          <p className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3.5 text-sm text-red-900 shadow-sm">
            {error}
          </p>
        ) : null}

        {stats && !showSkeleton ? (
          <motion.div
            key="overview-content"
            className="space-y-8"
            variants={funnelPanelStagger}
            initial="hidden"
            animate="show"
          >
            <motion.div
              className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4"
              variants={funnelPanelStagger}
            >
              <motion.div className="h-full" variants={funnelPanelItem}>
                <MetricStatCardAccent
                  label="Signups"
                  value={stats.signups}
                  icon={UserPlus}
                  tone="emerald"
                />
              </motion.div>
              <motion.div className="h-full" variants={funnelPanelItem}>
                <MetricStatCardAccent
                  label="Payments"
                  value={stats.payments}
                  icon={Users}
                  tone="blue"
                  highlight={stats.payments > 0}
                />
              </motion.div>
              <motion.div className="h-full" variants={funnelPanelItem}>
                <MetricStatCardAccent
                  label="Revenue"
                  value={formatCents(stats.revenue, stats.currency ?? "usd")}
                  icon={DollarSign}
                  tone="violet"
                />
              </motion.div>
              <motion.div className="h-full" variants={funnelPanelItem}>
                <MetricStatCardAccent
                  label="Conversion"
                  value={`${conversionRate.toFixed(1)}%`}
                  icon={TrendingUp}
                  tone="zinc"
                  highlight={conversionRate >= 50}
                />
              </motion.div>
            </motion.div>

            <motion.div
              className="grid auto-rows-fr gap-5 lg:grid-cols-2"
              variants={funnelPanelStagger}
            >
              <motion.div className="h-full" variants={funnelPanelItem}>
                <TotalsBarChart signups={stats.signups} payments={stats.payments} />
              </motion.div>
              <motion.div className="h-full" variants={funnelPanelItem}>
                <BreakdownCard
                  signupOnly={stats.signupOnly}
                  paidAfterSignup={stats.paidAfterSignup}
                />
              </motion.div>
            </motion.div>

            <motion.div variants={funnelPanelItem}>
              <OverviewPanelCard
                title="Funnel steps"
                subtitle="Each step as a share of total signups"
              >
                <div className="space-y-5">
                  {funnelSteps.map((row) => (
                    <FunnelProgressBar
                      key={row.step}
                      label={row.step}
                      valueLabel={`${row.count.toLocaleString()} · ${row.pct.toFixed(1)}%`}
                      percent={row.pct}
                      tone={row.tone}
                    />
                  ))}
                </div>
              </OverviewPanelCard>
            </motion.div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
