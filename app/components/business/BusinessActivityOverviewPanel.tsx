"use client";

/**
 * Change: Stop showing mock/preview activity when API totals are 0.
 * Why: Empty businesses were looking busy with fake "Preview data".
 * Related: business-activity-mock.ts, dashboard page.tsx
 */

import {
  buildCheckInsMonthlyData,
  buildMembersMonthlyData,
  buildOrdersMonthlyData,
  buildRevenueMonthlyData,
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
import type { ActivityMonthlyPoint } from "@/app/services/activity/get-business-activity";
import { DollarSign, Megaphone, ScanLine, ShoppingBag, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo } from "react";

const overviewCardClass =
  "relative overflow-hidden rounded-[1.45rem] border border-[#e8edf5] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.07)] ring-1 ring-black/[0.02]";

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
      className={`group flex items-center gap-3 rounded-[1.1rem] border border-[#e8edf5] bg-gradient-to-b from-white to-[#f8faff] px-3.5 py-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.03)] ring-1 ring-black/[0.02] transition duration-200 hover:-translate-y-[2px] ${hoverBorder}`}
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
  // Always use API values — never fall back to mock/preview when totals are 0.
  const chartData = data;
  const displayActiveCampaigns = activeCampaigns;
  const displayTotalOrders = totalOrders;
  const displayTotalMembers = totalMembers;
  const displayTodayRevenueCents = todayRevenueCents;

  const totals = useMemo(() => sumActivityFromMonthly(chartData), [chartData]);
  const checkInsMonthly = useMemo(
    () => buildCheckInsMonthlyData(chartData),
    [chartData],
  );
  const revenueMonthly = useMemo(
    () => buildRevenueMonthlyData(chartData),
    [chartData],
  );
  const ordersMonthly = useMemo(
    () => buildOrdersMonthlyData(chartData),
    [chartData],
  );
  const membersMonthly = useMemo(
    () => buildMembersMonthlyData(chartData),
    [chartData],
  );
  const newMembersInPeriod = useMemo(
    () => membersMonthly.reduce((sum, row) => sum + row.value, 0),
    [membersMonthly],
  );

  const displayName = businessName?.trim() || "Your business";

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

      <div className="relative shrink-0 border-b border-[#e8edf5] bg-gradient-to-r from-[#f8faff] via-white to-[#fdf2f8] px-3 py-3.5 sm:px-4 sm:py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="inline-flex w-fit items-center rounded-full bg-[#1877f2]/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#1877f2] ring-1 ring-[#1877f2]/15">
              Business performance
            </span>
            <p className="m-0 mt-1.5 text-[0.8rem] font-medium text-slate-500">
              Campaigns, orders, members and revenue at a glance.
            </p>
          </div>
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
      ) : (
        <div className="px-3 py-4 sm:px-4 sm:py-5">
          <div className="space-y-5">
            <section
              className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3"
              aria-label="Business summary"
            >
              <OverviewKpiTile
                label="Active campaigns"
                value={displayActiveCampaigns}
                hint="Published"
                icon={Megaphone}
                iconBg={DASHBOARD_KPI_ICON.green}
                hoverTone="green"
              />
              <OverviewKpiTile
                label="Total orders"
                value={displayTotalOrders}
                hint="Paid payments"
                icon={ShoppingBag}
                iconBg={DASHBOARD_KPI_ICON.orange}
                hoverTone="orange"
              />
              <OverviewKpiTile
                label="Total members"
                value={displayTotalMembers}
                hint="Guests with chats"
                icon={Users}
                iconBg={DASHBOARD_KPI_ICON.pink}
                hoverTone="pink"
              />
              <OverviewKpiTile
                label="QR check-ins"
                value={totals.checkIns}
                hint="Visits and redemptions"
                icon={ScanLine}
                iconBg={DASHBOARD_KPI_ICON.blue}
                hoverTone="blue"
              />
              <OverviewKpiTile
                label="Revenue"
                value={formatCents(totals.revenueCents, "usd")}
                hint={`Last ${months} months`}
                icon={DollarSign}
                iconBg={DASHBOARD_KPI_ICON.pink}
                hoverTone="pink"
              />
              <OverviewKpiTile
                label="Today's revenue"
                value={formatCents(displayTodayRevenueCents, "usd")}
                hint="Paid today"
                icon={DollarSign}
                iconBg={DASHBOARD_KPI_ICON.orange}
                hoverTone="orange"
              />
            </section>

            <section className="rd-premium-section" aria-label="Performance charts">
              <div className="mb-1 px-0.5">
                <h2 className="m-0 text-[1.05rem] font-extrabold tracking-tight text-[#07111f]">
                  Performance insights
                </h2>
                <p className="m-0 mt-1 text-[0.78rem] font-medium text-slate-500">
                  Monthly trends for the last {months} months.
                </p>
              </div>
              <div className="grid gap-3 sm:gap-3.5 lg:grid-cols-2">
                <div className="min-h-[300px]">
                  <CheckInsBarChart data={checkInsMonthly} months={months} />
                </div>
                <div className="min-h-[300px]">
                  <BusinessRevenueMiniChart
                    data={revenueMonthly}
                    totalRevenueCents={totals.revenueCents}
                    months={months}
                  />
                </div>
                <div className="min-h-[300px]">
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
                </div>
                <div className="min-h-[300px]">
                  <BusinessMembersMiniChart
                    data={membersMonthly}
                    total={newMembersInPeriod}
                    months={months}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </article>
  );
}
