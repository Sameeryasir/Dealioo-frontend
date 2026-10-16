"use client";

import { motion } from "framer-motion";
import { CreditCard, LayoutTemplate, UserPlus, UserRound, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
  icon: Icon,
  iconClass,
}: {
  label: string;
  count: number;
  maxStep: number;
  barClass: string;
  delayMs: number;
  icon?: LucideIcon;
  iconClass?: string;
}) {
  const animatedCount = useCountUp(count, true, 900);
  const targetWidthPct = Math.max(
    count > 0 ? 8 : 0,
    Math.min(100, (count / maxStep) * 100),
  );

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="m-0 inline-flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-500">
          {Icon ? (
            <Icon className={`size-3.5 shrink-0 ${iconClass ?? "text-slate-400"}`} aria-hidden />
          ) : null}
          {label}
        </p>
        <p className="m-0 text-[1.05rem] font-extrabold tabular-nums leading-none text-[#07111f]">
          {Math.round(animatedCount).toLocaleString()}
        </p>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#f1f5f9] ring-1 ring-[#e8edf5]">
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

const SAME_PERIOD_PAYMENT_COLOR = "bg-[#f77737]";
const EARLIER_PAYMENT_COLOR = "#d4a017";

function DropoffPaymentRow({
  samePeriod,
  earlier,
  maxStep,
  icon: Icon,
  iconClass,
}: {
  samePeriod: number;
  earlier: number;
  maxStep: number;
  icon?: LucideIcon;
  iconClass?: string;
}) {
  const total = samePeriod + earlier;
  const animatedTotal = useCountUp(total, true, 900);
  const totalWidthPct = Math.max(
    total > 0 ? 8 : 0,
    Math.min(100, (total / maxStep) * 100),
  );
  const sameShare = total > 0 ? samePeriod / total : 0;
  const earlierShare = total > 0 ? earlier / total : 0;

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="m-0 inline-flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-500">
          {Icon ? (
            <Icon className={`size-3.5 shrink-0 ${iconClass ?? "text-slate-400"}`} aria-hidden />
          ) : null}
          Payments
        </p>
        <p className="m-0 text-[1.05rem] font-extrabold tabular-nums leading-none text-[#07111f]">
          {Math.round(animatedTotal).toLocaleString()}
        </p>
      </div>
      <div className="mt-2.5 flex h-1.5 overflow-hidden rounded-full bg-[#f1f5f9] ring-1 ring-[#e8edf5]">
        <motion.div
          className={`h-full ${SAME_PERIOD_PAYMENT_COLOR}`}
          initial={{ width: "0%" }}
          animate={{ width: `${totalWidthPct * sameShare}%` }}
          transition={{ duration: 0.9, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        />
        <motion.div
          className="h-full"
          style={{ backgroundColor: EARLIER_PAYMENT_COLOR }}
          initial={{ width: "0%" }}
          animate={{ width: `${totalWidthPct * earlierShare}%` }}
          transition={{ duration: 0.9, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        />
      </div>
      {earlier > 0 ? (
        <p className="m-0 mt-2 text-[0.72rem] font-semibold leading-5 text-slate-500">
          {samePeriod.toLocaleString()} signed up this period
          <span className="px-1.5 text-slate-300">·</span>
          {earlier.toLocaleString()} signed up earlier
        </p>
      ) : null}
    </div>
  );
}

const DROPOFF_SKELETON_STEPS = [
  { key: "landing", labelClass: "w-16", barClass: "w-[92%]" },
  { key: "signup-views", labelClass: "w-20", barClass: "w-[70%]" },
  { key: "payment-views", labelClass: "w-24", barClass: "w-[48%]" },
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

function DropoffLegendSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul className="m-0 mt-3 flex list-none flex-wrap items-center justify-center gap-2 p-0">
      {Array.from({ length: count }).map((_, index) => (
        <li key={index}>
          <Skeleton funnel className="h-7 w-28 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

export function FunnelDropoffMiniChartSkeleton({
  hidePayments = false,
}: {
  hidePayments?: boolean;
}) {
  const steps = hidePayments
    ? DROPOFF_SKELETON_STEPS.filter(
        (step) => step.key !== "payment-views" && step.key !== "payments",
      )
    : DROPOFF_SKELETON_STEPS;

  return (
    <OverviewChartShell
      title="Funnel drop-off"
      subtitle={
        hidePayments
          ? "Landing and signup views"
          : "Landing, signup, and payment views"
      }
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
        <div className="flex flex-col gap-5">
          {steps.map((step) => (
            <DropoffStepSkeleton
              key={step.key}
              labelClass={step.labelClass}
              barClass={step.barClass}
            />
          ))}
        </div>
        <DropoffLegendSkeleton count={hidePayments ? 1 : 3} />
      </div>
    </OverviewChartShell>
  );
}

export function FunnelDropoffMiniChart({
  landingViews,
  signupViews,
  paymentViews,
  signups,
  payments,
  earlierPayments = 0,
  caption,
  hidePayments = false,
}: {
  landingViews: number;
  signupViews: number;
  paymentViews: number;
  signups: number;
  payments: number;
  earlierPayments?: number;
  caption?: string;
  hidePayments?: boolean;
}) {
  const landing = Math.max(0, landingViews);
  const signupPage = Math.max(0, signupViews);
  const paymentPage = Math.max(0, paymentViews);
  const signupCount = Math.max(0, signups);
  const paidCount = Math.max(0, payments);
  const earlierPaidCount = Math.max(0, earlierPayments);
  const totalPayments = paidCount + earlierPaidCount;
  const maxStep = Math.max(
    landing,
    signupPage,
    hidePayments ? 0 : paymentPage,
    signupCount,
    hidePayments ? 0 : totalPayments,
    1,
  );

  const viewToSignup = stepRate(landing, signupCount);
  const signupToPaid = hidePayments ? null : stepRate(signupCount, paidCount);
  const overall = hidePayments
    ? stepRate(landing, signupCount)
    : stepRate(landing, totalPayments);
  const animatedOverall = useCountUp(overall ?? 0, overall != null, 900);
  const viewSubtitle = hidePayments
    ? "Landing and signup views"
    : "Landing, signup, and payment views";

  const steps = [
    {
      key: "landing",
      label: "Landing views",
      count: landing,
      barClass: "bg-[#1877f2]",
      iconClass: "text-[#1877f2]",
      delayMs: 0,
      icon: LayoutTemplate,
    },
    {
      key: "signup-views",
      label: "Signup views",
      count: signupPage,
      barClass: "bg-[#60a5fa]",
      iconClass: "text-[#60a5fa]",
      delayMs: 80,
      icon: UserRound,
    },
    ...(hidePayments
      ? []
      : [
          {
            key: "payment-views",
            label: "Payment views",
            count: paymentPage,
            barClass: "bg-[#1d4ed8]",
            iconClass: "text-[#1d4ed8]",
            delayMs: 160,
            icon: CreditCard,
          },
        ]),
    {
      key: "signups",
      label: "Signups",
      count: signupCount,
      barClass: "bg-[#34a853]",
      iconClass: "text-[#34a853]",
      delayMs: 220,
      icon: UserPlus,
    },
  ];

  return (
    <OverviewChartShell
      title="Funnel drop-off"
      subtitle={caption ? `${caption} · ${viewSubtitle}` : viewSubtitle}
      minHeightClass="min-h-[300px]"
      className="h-full"
      accent="blue"
      stat={overall != null ? `${animatedOverall.toFixed(1)}%` : "—"}
    >
      <div className="flex h-full min-h-0 flex-col justify-center gap-5 px-1 py-2">
        <div className="flex flex-col gap-5">
          {steps.map((step) => (
            <DropoffStepRow
              key={`${step.key}-${step.count}`}
              label={step.label}
              count={step.count}
              maxStep={maxStep}
              barClass={step.barClass}
              delayMs={step.delayMs}
              icon={step.icon}
              iconClass={step.iconClass}
            />
          ))}
          {hidePayments ? null : (
            <DropoffPaymentRow
              key={`payments-${paidCount}-${earlierPaidCount}`}
              samePeriod={paidCount}
              earlier={earlierPaidCount}
              maxStep={maxStep}
              icon={Wallet}
              iconClass="text-[#f77737]"
            />
          )}
        </div>

        <OverviewChartLegend
          items={
            hidePayments
              ? [
                  {
                    label: "Landing views that signed up",
                    value: viewToSignup != null ? `${viewToSignup}%` : "—",
                    color: OVERVIEW_CHART_COLORS.blue,
                  },
                ]
              : [
                  {
                    label: "Landing views that signed up",
                    value: viewToSignup != null ? `${viewToSignup}%` : "—",
                    color: OVERVIEW_CHART_COLORS.blue,
                  },
                  {
                    label: "Signups that paid",
                    value: signupToPaid != null ? `${signupToPaid}%` : "—",
                    color: OVERVIEW_CHART_COLORS.green,
                  },
                  {
                    label: "Paid from this period",
                    value: paidCount.toLocaleString(),
                    color: OVERVIEW_CHART_COLORS.orange,
                  },
                  ...(earlierPaidCount > 0
                    ? [
                        {
                          label: "Paid from earlier signups",
                          value: earlierPaidCount.toLocaleString(),
                          color: EARLIER_PAYMENT_COLOR,
                        },
                      ]
                    : []),
                ]
          }
        />
      </div>
    </OverviewChartShell>
  );
}
