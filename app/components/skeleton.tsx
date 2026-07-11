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
  "org-biz-card org-biz-card--grid min-h-[22.5rem] rounded-2xl p-4 sm:p-5";

export function BusinessCardSkeleton() {
  return (
    <article className={restaurantCardShell} aria-hidden>
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="size-11 rounded-xl bg-brand-soft" />
        <Skeleton className="h-6 w-16 rounded-full bg-[#fff7ed]" />
      </div>
      <Skeleton className="mt-4 h-5 w-4/5 bg-[#eef3ff]" />
      <Skeleton className="mt-2 h-3.5 w-1/3 bg-brand-soft" />
      <Skeleton className="mt-3 h-14 w-full bg-brand-soft/80" />
      <div className="mt-4 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20 bg-brand-soft" />
          <Skeleton className="h-3 w-8 bg-brand-soft" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full bg-[#edf2f8]" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[#edf2f8] pt-4">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-8 rounded-full bg-brand-soft" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24 bg-brand-soft" />
            <Skeleton className="h-2.5 w-16 bg-brand-soft" />
          </div>
        </div>
        <Skeleton className="h-4 w-12 bg-[#dbeafe]" />
      </div>
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
