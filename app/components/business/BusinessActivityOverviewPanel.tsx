"use client";

import {
  buildCheckInsMonthlyData,
  buildMembersMonthlyData,
  buildOrdersMonthlyData,
  buildRevenueMonthlyData,
  hasBusinessActivityMonthly,
  sumActivityFromMonthly,
} from "@/app/components/business/business-activity-chart-config";
import { BusinessMembersMiniChart } from "@/app/components/business/BusinessMembersMiniChart";
import { BusinessMonthlyBarChart } from "@/app/components/business/BusinessMonthlyBarChart";
import { BusinessRevenueMiniChart } from "@/app/components/business/BusinessRevenueMiniChart";
import { CheckInsBarChart } from "@/app/components/business/CheckInsBarChart";
import { Skeleton } from "@/app/components/skeleton";
import { OVERVIEW_CHART_COLORS } from "@/app/components/campaign/overview/charts/overview-chart-config";
import { DASHBOARD_KPI_ICON } from "@/app/lib/dashboard-brand-tones";
import { formatCents } from "@/app/lib/money";
import { funnelPanelItem, funnelPanelStagger } from "@/app/lib/motion";
import type { ActivityMonthlyPoint } from "@/app/services/activity/get-business-activity";
import { DollarSign, Megaphone, ScanLine, ShoppingBag, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";

const overviewCardClass =
  "relative overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]";

function OverviewKpiTile({
  label,
  value,
  hint,
  icon: Icon,
  iconBg,
  hoverTone = "blue",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  iconBg: string;
  hoverTone?: "blue" | "pink" | "green" | "orange";
}) {
  const hoverBorder =
    hoverTone === "pink"
      ? "hover:border-[#e1306c]/45 hover:shadow-[0_14px_32px_rgba(225,48,108,0.14)]"
      : hoverTone === "green"
        ? "hover:border-[#34a853]/45 hover:shadow-[0_14px_32px_rgba(52,168,83,0.14)]"
        : hoverTone === "orange"
          ? "hover:border-[#f77737]/45 hover:shadow-[0_14px_32px_rgba(247,119,55,0.14)]"
          : "hover:border-[#1877f2]/45 hover:shadow-[0_14px_32px_rgba(24,119,242,0.14)]";

  const hoverText =
    hoverTone === "pink"
      ? "group-hover:text-[#e1306c]"
      : hoverTone === "green"
        ? "group-hover:text-[#34a853]"
        : hoverTone === "orange"
          ? "group-hover:text-[#f77737]"
          : "group-hover:text-[#1877f2]";

  return (
    <div
      className={`group flex items-center gap-3 rounded-[1.1rem] border border-[#e8edf5] bg-white px-3.5 py-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.03)] ring-1 ring-black/[0.02] transition duration-200 hover:-translate-y-[2px] ${hoverBorder}`}
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
      >
        <Icon className="size-4" strokeWidth={2.25} aria-hidden />
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p
          className={`m-0 truncate text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-600 transition ${hoverText}`}
        >
          {label}
        </p>
        <p
          className={`m-0 mt-0.5 truncate text-[1.15rem] font-extrabold leading-none tracking-tight text-black transition sm:text-[1.2rem] ${hoverText}`}
        >
          {value}
        </p>
        {hint ? (
          <p className="m-0 mt-1 truncate text-[0.72rem] font-medium text-slate-500">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading activity">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-[1.1rem] border border-[#e8edf5] bg-white px-3.5 py-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.03)]"
          >
            <Skeleton funnel className="size-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <Skeleton funnel className="h-3 w-16" />
              <Skeleton funnel className="mt-2 h-7 w-20" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[280px] rounded-[1.15rem] border border-[#e8edf5] bg-white px-4 py-4 shadow-[0_6px_18px_rgba(15,23,42,0.03)] sm:px-5 sm:py-5"
          >
            <Skeleton funnel className="h-4 w-36" />
            <Skeleton funnel className="mt-2 h-3 w-28" />
            <Skeleton funnel className="mt-6 h-[220px] w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

function NoActivityCard() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center sm:py-16">
      <p className="m-0 text-[0.95rem] font-extrabold text-[#07111f]">
        No records found
      </p>
      <p className="m-0 mt-1.5 max-w-sm text-[0.82rem] font-medium text-slate-500">
        No activity or business metrics yet for this restaurant.
      </p>
    </div>
  );
}

export function BusinessActivityOverviewPanel({
  businessName,
  data,
  months,
  activeCampaigns = 0,
  totalOrders = 0,
  totalMembers = 0,
  todayRevenueCents = 0,
  isLoading,
}: {
  businessName?: string;
  data: ActivityMonthlyPoint[];
  months: number;
  activeCampaigns?: number;
  totalOrders?: number;
  totalMembers?: number;
  todayRevenueCents?: number;
  isLoading?: boolean;
}) {
  const totals = useMemo(() => sumActivityFromMonthly(data), [data]);
  const hasActivity = useMemo(
    () =>
      hasBusinessActivityMonthly(data, {
        activeCampaigns,
        totalOrders,
        totalMembers,
        todayRevenueCents,
      }),
    [data, activeCampaigns, totalOrders, totalMembers, todayRevenueCents],
  );
  const checkInsMonthly = useMemo(() => buildCheckInsMonthlyData(data), [data]);
  const revenueMonthly = useMemo(() => buildRevenueMonthlyData(data), [data]);
  const ordersMonthly = useMemo(() => buildOrdersMonthlyData(data), [data]);
  const membersMonthly = useMemo(() => buildMembersMonthlyData(data), [data]);
  const newMembersInPeriod = useMemo(
    () => membersMonthly.reduce((sum, row) => sum + row.value, 0),
    [membersMonthly],
  );

  const displayName = businessName?.trim() || "Your business";
  const showNoRecords = !isLoading && !hasActivity;

  return (
    <article className={`${overviewCardClass} w-full`} aria-label="Business activity">
      <span
        className="pointer-events-none absolute -top-10 right-8 size-32 rounded-full bg-[#1877f2]/10 blur-3xl"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-8 left-6 size-24 rounded-full bg-[#e1306c]/8 blur-3xl"
        aria-hidden
      />

      <div className="relative shrink-0 border-b border-[#e8edf5] bg-white px-2.5 py-3 sm:px-3 sm:py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex w-fit items-center rounded-full bg-[#1877f2]/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#1877f2] ring-1 ring-[#1877f2]/15">
            Business performance
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-[#1877f2] px-2.5 py-1 text-[0.68rem] font-bold text-white shadow-[0_4px_12px_rgba(24,119,242,0.2)]">
              {displayName}
            </span>
            <span className="inline-flex items-center rounded-full bg-[#f4f7fb] px-2.5 py-1 text-[0.68rem] font-semibold text-slate-600 ring-1 ring-[#e8edf5]">
              Last {months} months
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="px-2.5 py-4 sm:px-3 sm:py-5">
          <OverviewSkeleton />
        </div>
      ) : showNoRecords ? (
        <NoActivityCard />
      ) : (
        <div className="px-2.5 py-3.5 sm:px-3 sm:py-4">
          <motion.div
            className="space-y-4"
            variants={funnelPanelStagger}
            initial="hidden"
            animate="show"
          >
            <motion.section
              className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3"
              aria-label="Business summary"
              variants={funnelPanelStagger}
            >
              <motion.div variants={funnelPanelItem}>
                <OverviewKpiTile
                  label="Active campaigns"
                  value={activeCampaigns}
                  hint="Published"
                  icon={Megaphone}
                  iconBg={DASHBOARD_KPI_ICON.green}
                  hoverTone="green"
                />
              </motion.div>
              <motion.div variants={funnelPanelItem}>
                <OverviewKpiTile
                  label="Total orders"
                  value={totalOrders}
                  hint="Paid payments"
                  icon={ShoppingBag}
                  iconBg={DASHBOARD_KPI_ICON.orange}
                  hoverTone="orange"
                />
              </motion.div>
              <motion.div variants={funnelPanelItem}>
                <OverviewKpiTile
                  label="Total members"
                  value={totalMembers}
                  hint="Guests with chats"
                  icon={Users}
                  iconBg={DASHBOARD_KPI_ICON.pink}
                  hoverTone="pink"
                />
              </motion.div>
              <motion.div variants={funnelPanelItem}>
                <OverviewKpiTile
                  label="QR check-ins"
                  value={totals.checkIns}
                  hint="Visits and redemptions"
                  icon={ScanLine}
                  iconBg={DASHBOARD_KPI_ICON.blue}
                  hoverTone="blue"
                />
              </motion.div>
              <motion.div variants={funnelPanelItem}>
                <OverviewKpiTile
                  label="Revenue"
                  value={formatCents(totals.revenueCents, "usd")}
                  hint={`Last ${months} months`}
                  icon={DollarSign}
                  iconBg={DASHBOARD_KPI_ICON.pink}
                  hoverTone="pink"
                />
              </motion.div>
              <motion.div variants={funnelPanelItem}>
                <OverviewKpiTile
                  label="Today's revenue"
                  value={formatCents(todayRevenueCents, "usd")}
                  hint="Paid today"
                  icon={DollarSign}
                  iconBg={DASHBOARD_KPI_ICON.orange}
                  hoverTone="orange"
                />
              </motion.div>
            </motion.section>

            <motion.section
              className="rd-premium-section"
              aria-label="Performance charts"
              variants={funnelPanelItem}
            >
              <div className="rd-premium-section-head">
                <h2>Performance insights</h2>
              </div>
              <div className="grid gap-3 sm:gap-3.5 lg:grid-cols-2">
                <motion.div className="min-h-[300px]" variants={funnelPanelItem}>
                  <CheckInsBarChart data={checkInsMonthly} months={months} />
                </motion.div>
                <motion.div className="min-h-[300px]" variants={funnelPanelItem}>
                  <BusinessRevenueMiniChart
                    data={revenueMonthly}
                    totalRevenueCents={totals.revenueCents}
                    months={months}
                  />
                </motion.div>
                <motion.div className="min-h-[300px]" variants={funnelPanelItem}>
                  <BusinessMonthlyBarChart
                    title="Orders"
                    subtitle="Paid payments"
                    data={ordersMonthly}
                    dataKey="value"
                    seriesName="Orders"
                    accent="orange"
                    barFill={OVERVIEW_CHART_COLORS.orange}
                    legendColor={OVERVIEW_CHART_COLORS.orange}
                    months={months}
                  />
                </motion.div>
                <motion.div className="min-h-[300px]" variants={funnelPanelItem}>
                  <BusinessMembersMiniChart
                    data={membersMonthly}
                    total={newMembersInPeriod}
                    months={months}
                  />
                </motion.div>
              </div>
            </motion.section>
          </motion.div>
        </div>
      )}
    </article>
  );
}
