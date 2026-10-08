"use client";

import { motion } from "framer-motion";
import { OverviewChartLegend } from "@/app/components/campaign/overview/charts/OverviewChartLegend";
import { OverviewChartShell } from "@/app/components/campaign/overview/charts/OverviewChartShell";
import { OVERVIEW_CHART_COLORS } from "@/app/components/campaign/overview/charts/overview-chart-config";
import { Skeleton } from "@/app/components/skeleton";
import { useCountUp } from "@/app/hooks/use-count-up";

function stepRate(from: number, to: number): number | null {
  if (from <= 0) return null;
  return Math.round((to / from) * 1000) / 10;
}

function DropoffStepRow({
  label,
  count,
  maxStep,
  barClass,
  delayMs,
}: {
  label: string;
  count: number;
  maxStep: number;
  barClass: string;
  delayMs: number;
}) {
  const animatedCount = useCountUp(count, true, 900);
  const targetWidthPct = Math.max(
    count > 0 ? 8 : 0,
    Math.min(100, (count / maxStep) * 100),
  );

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-500">
          {label}
        </p>
        <p className="m-0 text-[1.05rem] font-extrabold tabular-nums leading-none text-[#07111f]">
          {Math.round(animatedCount).toLocaleString()}
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f1f5f9] ring-1 ring-[#e8edf5]">
        <motion.div
          className={`h-full rounded-full ${barClass}`}
          initial={{ width: "0%" }}
          animate={{ width: `${targetWidthPct}%` }}
          transition={{
            duration: 0.9,
            delay: delayMs / 1000,
            ease: [0.22, 1, 0.36, 1],
          }}
          aria-hidden
        />
      </div>
    </div>
  );
}

const DROPOFF_SKELETON_STEPS = [
  { key: "views", labelClass: "w-20", barClass: "w-[92%]" },
  { key: "signups", labelClass: "w-16", barClass: "w-[58%]" },
  { key: "payments", labelClass: "w-[4.5rem]", barClass: "w-[34%]" },
] as const;

function DropoffStepSkeleton({
  labelClass,
  barClass,
}: {
  labelClass: string;
  barClass: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <Skeleton funnel className={`h-3 ${labelClass}`} />
        <Skeleton funnel className="h-5 w-10" />
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f1f5f9] ring-1 ring-[#e8edf5]">
        <Skeleton funnel className={`h-full rounded-full ${barClass}`} />
      </div>
    </div>
  );
}

function DropoffLegendSkeleton() {
  return (
    <ul className="m-0 mt-3 flex list-none flex-wrap items-center justify-center gap-2 p-0">
      {Array.from({ length: 3 }).map((_, index) => (
        <li key={index}>
          <Skeleton funnel className="h-7 w-28 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

export function FunnelDropoffMiniChartSkeleton() {
  return (
    <OverviewChartShell
      title="Funnel drop-off"
      subtitle="Page view → Signup → Payment"
      minHeightClass="min-h-[300px]"
      className="h-full"
      accent="blue"
      stat={<Skeleton funnel className="h-8 w-14" />}
    >
      <div
        className="flex h-full min-h-0 flex-col justify-center gap-4 px-1 py-1"
        aria-busy="true"
        aria-label="Loading funnel drop-off"
      >
        <div className="flex flex-col gap-3.5">
          {DROPOFF_SKELETON_STEPS.map((step) => (
            <DropoffStepSkeleton
              key={step.key}
              labelClass={step.labelClass}
              barClass={step.barClass}
            />
          ))}
        </div>
        <DropoffLegendSkeleton />
      </div>
    </OverviewChartShell>
  );
}

export function FunnelDropoffMiniChart({
  pageViews,
  signups,
  payments,
  caption,
}: {
  pageViews: number;
  signups: number;
  payments: number;
  caption?: string;
}) {
  const views = Math.max(0, pageViews);
  const signupCount = Math.max(0, signups);
  const paidCount = Math.max(0, payments);
  const maxStep = Math.max(views, signupCount, paidCount, 1);

  const viewToSignup = stepRate(views, signupCount);
  const signupToPaid = stepRate(signupCount, paidCount);
  const overall = stepRate(views, paidCount);
  const animatedOverall = useCountUp(overall ?? 0, overall != null, 900);

  const steps = [
    {
      key: "views",
      label: "Page views",
      count: views,
      barClass: "bg-[#1877f2]",
      delayMs: 0,
    },
    {
      key: "signups",
      label: "Signups",
      count: signupCount,
      barClass: "bg-[#34a853]",
      delayMs: 120,
    },
    {
      key: "payments",
      label: "Payments",
      count: paidCount,
      barClass: "bg-[#f77737]",
      delayMs: 240,
    },
  ] as const;

  return (
    <OverviewChartShell
      title="Funnel drop-off"
      subtitle={caption ?? "Page view → Signup → Payment"}
      minHeightClass="min-h-[300px]"
      className="h-full"
      accent="blue"
      stat={overall != null ? `${animatedOverall.toFixed(1)}%` : "—"}
    >
      <div className="flex h-full min-h-0 flex-col justify-center gap-4 px-1 py-1">
        <div className="flex flex-col gap-3.5">
          {steps.map((step) => (
            <DropoffStepRow
              key={`${step.key}-${step.count}`}
              label={step.label}
              count={step.count}
              maxStep={maxStep}
              barClass={step.barClass}
              delayMs={step.delayMs}
            />
          ))}
        </div>

        <OverviewChartLegend
          items={[
            {
              label: "Views that signed up",
              value: viewToSignup != null ? `${viewToSignup}%` : "—",
              color: OVERVIEW_CHART_COLORS.blue,
            },
            {
              label: "Signups that paid",
              value: signupToPaid != null ? `${signupToPaid}%` : "—",
              color: OVERVIEW_CHART_COLORS.green,
            },
            {
              label: "Views that paid",
              value: overall != null ? `${overall}%` : "—",
              color: OVERVIEW_CHART_COLORS.orange,
            },
          ]}
        />
      </div>
    </OverviewChartShell>
  );
}
