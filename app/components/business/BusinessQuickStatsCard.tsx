"use client";

import { Skeleton } from "@/app/components/skeleton";
import { DASHBOARD_KPI_ICON } from "@/app/lib/dashboard-brand-tones";
import { formatCents } from "@/app/lib/money";
import { DollarSign, Megaphone, ShoppingBag, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type BusinessQuickStatsCardProps = {
  activeCampaigns: number;
  totalMembers: number;
  totalOrders: number;
  todayRevenueCents: number;
  isLoading?: boolean;
};

type QuickStatItem = {
  label: string;
  value: string;
  icon: LucideIcon;
  iconBg: string;
  hoverTone: "blue" | "pink" | "green" | "orange";
};

function QuickStatRow({
  label,
  value,
  icon: Icon,
  iconBg,
  hoverTone,
}: QuickStatItem) {
  const hoverBorder =
    hoverTone === "pink"
      ? "hover:border-[#e1306c]/35"
      : hoverTone === "green"
        ? "hover:border-[#34a853]/35"
        : hoverTone === "orange"
          ? "hover:border-[#f77737]/35"
          : "hover:border-[#1877f2]/35";

  return (
    <div
      className={`flex items-center gap-2.5 rounded-[0.95rem] border border-[#e8edf5] bg-white px-2.5 py-2.5 shadow-[0_4px_12px_rgba(15,23,42,0.03)] transition duration-200 ${hoverBorder}`}
    >
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
      >
        <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-[0.62rem] font-bold uppercase tracking-[0.1em] text-slate-500">
          {label}
        </p>
        <p className="m-0 mt-0.5 truncate text-[1rem] font-extrabold leading-none tracking-tight text-black">
          {value}
        </p>
      </div>
    </div>
  );
}

function QuickStatsSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading quick stats">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-2.5 rounded-[0.95rem] border border-[#e8edf5] bg-white px-2.5 py-2.5"
        >
          <Skeleton funnel className="size-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1">
            <Skeleton funnel className="h-2.5 w-16" />
            <Skeleton funnel className="mt-2 h-5 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BusinessQuickStatsCard({
  activeCampaigns,
  totalMembers,
  totalOrders,
  todayRevenueCents,
  isLoading = false,
}: BusinessQuickStatsCardProps) {
  const stats: QuickStatItem[] = [
    {
      label: "Active campaigns",
      value: String(activeCampaigns),
      icon: Megaphone,
      iconBg: DASHBOARD_KPI_ICON.blue,
      hoverTone: "blue",
    },
    {
      label: "Total members",
      value: String(totalMembers),
      icon: Users,
      iconBg: DASHBOARD_KPI_ICON.green,
      hoverTone: "green",
    },
    {
      label: "Total orders",
      value: String(totalOrders),
      icon: ShoppingBag,
      iconBg: DASHBOARD_KPI_ICON.orange,
      hoverTone: "orange",
    },
    {
      label: "Today's revenue",
      value: formatCents(todayRevenueCents, "usd"),
      icon: DollarSign,
      iconBg: DASHBOARD_KPI_ICON.pink,
      hoverTone: "pink",
    },
  ];

  return (
    <article
      className="relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-gradient-to-b from-white via-white to-[#f4f8ff] px-3.5 py-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]"
      aria-label="Quick stats"
    >
      <span
        className="pointer-events-none absolute -top-8 left-1/2 size-28 -translate-x-1/2 rounded-full bg-[#1877f2]/10 blur-3xl"
        aria-hidden
      />

      <p className="relative m-0 text-center text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500">
        Quick stats
      </p>

      <div className="relative mt-3 flex flex-1 flex-col justify-center gap-2">
        {isLoading ? (
          <QuickStatsSkeleton />
        ) : (
          stats.map((stat) => <QuickStatRow key={stat.label} {...stat} />)
        )}
      </div>
    </article>
  );
}
