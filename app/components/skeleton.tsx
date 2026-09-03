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
  "org-campaign-card relative flex w-full flex-col overflow-hidden sm:max-w-none";

export function CampaignFunnelCardSkeleton() {
  return (
    <article className={campaignCardShell} aria-hidden>
      <div className="flex min-h-[11.5rem] flex-col p-3.5 pt-3 sm:p-4 sm:pt-3.5">
        <div className="flex items-start gap-3 pr-8">
          <Skeleton className="size-[4.25rem] shrink-0 rounded-full bg-[#f8fafc] sm:size-[4.75rem]" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/4 bg-[#f8fafc]" />
            <Skeleton className="h-2.5 w-full bg-[#f8fafc]" />
            <Skeleton className="h-2.5 w-5/6 bg-[#f8fafc]" />
          </div>
        </div>
        <Skeleton className="mt-3 h-7 w-2/5 max-w-[12rem] rounded-full bg-[#f8fafc]" />
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <Skeleton className="h-6 w-12 bg-[#f8fafc]" />
          <Skeleton className="h-3 w-20 bg-[#f8fafc]" />
        </div>
      </div>
    </article>
  );
}
