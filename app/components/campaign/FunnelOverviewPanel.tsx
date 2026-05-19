"use client";

import { DollarSign, TrendingUp, UserPlus, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { Skeleton } from "@/app/components/skeleton";
import { useFunnelEventStats } from "@/app/hooks/use-funnel-event-stats";

const overviewEase = [0.22, 1, 0.36, 1] as const;

const overviewStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.08 },
  },
};

const overviewItem = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: overviewEase },
  },
};

function OverviewSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading stats">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton funnel className="h-3 w-16" />
                <Skeleton funnel className="h-8 w-20" />
                <Skeleton funnel className="h-3 w-28" />
              </div>
              <Skeleton funnel className="size-10 shrink-0 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm sm:p-5">
          <Skeleton funnel className="h-4 w-36" />
          <Skeleton funnel className="mt-2 h-3 w-28" />
          <div className="mt-6 space-y-5">
            <Skeleton funnel className="h-3 w-full rounded-full" />
            <Skeleton funnel className="h-3 w-4/5 rounded-full" />
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm sm:p-5">
          <Skeleton funnel className="h-4 w-24" />
          <Skeleton funnel className="mt-2 h-3 w-32" />
          <div className="mt-4 space-y-3">
            <Skeleton funnel className="h-10 w-full" />
            <Skeleton funnel className="h-10 w-full" />
            <Skeleton funnel className="h-10 w-full" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm sm:p-5">
        <Skeleton funnel className="h-4 w-28" />
        <Skeleton funnel className="mt-2 mb-4 h-3 w-40" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between gap-4">
                <Skeleton funnel className="h-3 w-32" />
                <Skeleton funnel className="h-3 w-20" />
              </div>
              <Skeleton funnel className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatRevenue(amount: number, currency: string): string {
  const code = (currency || "usd").toUpperCase();
  const dollars = amount / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code === "USD" ? "USD" : "USD",
    maximumFractionDigits: 2,
  }).format(dollars);
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Users;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            {value}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{hint}</p>
        </div>
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${accent}`}
        >
          <Icon className="size-5 text-white" strokeWidth={2} aria-hidden />
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
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-sm font-semibold text-zinc-900">Signups vs payments</h3>
      <p className="mt-0.5 text-xs text-zinc-500">Totals from your funnel</p>
      <div className="mt-6 space-y-5">
        <div>
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="font-medium text-zinc-700">Signups</span>
            <span className="tabular-nums text-zinc-500">{signups}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-zinc-300"
              style={{ width: `${(signups / max) * 100}%` }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="font-medium text-zinc-700">Payments</span>
            <span className="tabular-nums text-zinc-500">{payments}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-zinc-900"
              style={{ width: `${(payments / max) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
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
      },
      {
        step: "Signup only (not paid)",
        count: stats.signupOnly,
        pct: (stats.signupOnly / base) * 100,
      },
      {
        step: "Paid after signup",
        count: stats.paidAfterSignup,
        pct: (stats.paidAfterSignup / base) * 100,
      },
      {
        step: "Total payments",
        count: stats.payments,
        pct: (stats.payments / base) * 100,
      },
    ];
  }, [stats]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: overviewEase }}
        >
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">
            {campaignName?.trim() ? campaignName : "Campaign"} overview
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Funnel signups, payments, and revenue
            {funnelId != null ? (
              <span className="ml-1 font-mono text-xs text-zinc-500">
                (funnel #{funnelId})
              </span>
            ) : null}
          </p>
        </motion.div>

        {showNoFunnelMessage ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            No funnel id yet. Open the Funnel tab and save once to load stats.
          </p>
        ) : null}

        {showSkeleton ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: overviewEase }}
          >
            <OverviewSkeleton />
          </motion.div>
        ) : null}

        {error && !showSkeleton ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {stats && !showSkeleton ? (
          <motion.div
            key="overview-content"
            className="space-y-6"
            variants={overviewStagger}
            initial="hidden"
            animate="show"
          >
            <motion.div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              variants={overviewStagger}
            >
              <motion.div variants={overviewItem}>
                <StatCard
                label="Signups"
                value={String(stats.signups)}
                hint="Completed signup on this funnel"
                icon={UserPlus}
                accent="bg-zinc-900"
              />
              </motion.div>
              <motion.div variants={overviewItem}>
                <StatCard
                label="Payments"
                value={String(stats.payments)}
                hint="Successful payments recorded"
                icon={Users}
                accent="bg-zinc-800"
              />
              </motion.div>
              <motion.div variants={overviewItem}>
                <StatCard
                label="Revenue"
                value={formatRevenue(stats.revenue, stats.currency)}
                hint={`Currency: ${stats.currency.toUpperCase()}`}
                icon={DollarSign}
                accent="bg-zinc-900"
              />
              </motion.div>
              <motion.div variants={overviewItem}>
                <StatCard
                label="Conversion"
                value={`${conversionRate.toFixed(1)}%`}
                hint="Payments ÷ signups"
                icon={TrendingUp}
                accent="bg-zinc-800"
              />
              </motion.div>
            </motion.div>

            <motion.div
              className="grid gap-6 lg:grid-cols-2"
              variants={overviewStagger}
            >
              <motion.div variants={overviewItem}>
                <TotalsBarChart signups={stats.signups} payments={stats.payments} />
              </motion.div>
              <motion.div
                variants={overviewItem}
                className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm sm:p-5"
              >
                <h3 className="text-sm font-semibold text-zinc-900">Breakdown</h3>
                <p className="mt-0.5 text-xs text-zinc-500">From funnel events API</p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4 border-b border-zinc-100 pb-3">
                    <dt className="text-zinc-600">Signup only</dt>
                    <dd className="font-semibold tabular-nums text-zinc-900">
                      {stats.signupOnly}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-zinc-100 pb-3">
                    <dt className="text-zinc-600">Paid after signup</dt>
                    <dd className="font-semibold tabular-nums text-zinc-900">
                      {stats.paidAfterSignup}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-600">Funnel id</dt>
                    <dd className="font-mono text-xs font-semibold text-zinc-900">
                      {stats.funnelId}
                    </dd>
                  </div>
                </dl>
              </motion.div>
            </motion.div>

            <motion.div
              variants={overviewItem}
              className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm sm:p-5"
            >
              <h3 className="text-sm font-semibold text-zinc-900">Funnel steps</h3>
              <p className="mt-0.5 mb-4 text-xs text-zinc-500">
                Relative to total signups
              </p>
              <div className="space-y-3">
                {funnelSteps.map((row) => (
                  <div key={row.step}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-zinc-800">{row.step}</span>
                      <span className="tabular-nums text-zinc-500">
                        {row.count.toLocaleString()} · {row.pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-zinc-900 transition-all"
                        style={{ width: `${Math.min(100, row.pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
