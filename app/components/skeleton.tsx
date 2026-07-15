"use client";

import type { ComponentType } from "react";

export function Skeleton({
  className,
  funnel = false,
}: {
  className?: string;
  funnel?: boolean;
}) {
  return (
    <div
      className={`animate-pulse rounded-md ${funnel ? "bg-zinc-100" : "bg-zinc-200/80"} ${className ?? ""}`}
      aria-hidden
    />
  );
}

export function SkeletonGrid({
  count = 6,
  className,
  Card,
}: {
  count?: number;
  className?: string;
  Card: ComponentType;
}) {
  return (
    <div className={className} aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} />
      ))}
    </div>
  );
}

const restaurantCardShell =
  "org-biz-card org-biz-card--grid overflow-hidden rounded-[1.25rem] p-5";

export function BusinessCardSkeleton() {
  return (
    <article className={restaurantCardShell} aria-hidden>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Skeleton className="size-16 shrink-0 rounded-full bg-slate-100" />
          <div className="min-w-0 space-y-1">
            <Skeleton className="h-3 w-10 bg-slate-100" />
            <Skeleton className="h-5 w-24 bg-slate-100" />
          </div>
        </div>
        <Skeleton className="h-5 w-[4.75rem] shrink-0 rounded-full bg-amber-50" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Skeleton className="h-[5.5rem] w-full rounded-xl bg-blue-50" />
        <Skeleton className="h-[5.5rem] w-full rounded-xl bg-emerald-50" />
      </div>
      <Skeleton className="mt-auto h-11 w-full rounded-xl bg-blue-100" />
    </article>
  );
}

const campaignCardShell =
  "flex w-full flex-col overflow-hidden rounded-[1.1rem] border border-[#e8edf5] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.04)]";

export function CampaignFunnelCardSkeleton() {
  return (
    <article className={campaignCardShell} aria-hidden>
      <Skeleton className="h-40 w-full shrink-0 rounded-none bg-[#f1f5f9]" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-2/3 bg-[#f8fafc]" />
        <Skeleton className="h-3 w-1/2 bg-[#f8fafc]" />
        <Skeleton className="mt-2 h-3 w-1/3 bg-[#f8fafc]" />
      </div>
    </article>
  );
}
