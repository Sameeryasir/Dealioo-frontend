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
  "relative flex h-[23.75rem] flex-col overflow-hidden rounded-[1.25rem] bg-zinc-100 shadow-sm ring-1 ring-zinc-950/[0.06]";

export function RestaurantCardSkeleton() {
  return (
    <article className={restaurantCardShell} aria-hidden>
      <Skeleton className="h-36 w-full shrink-0 rounded-none bg-zinc-300 sm:h-40" />
      <div className="relative z-10 -mt-5 flex min-h-0 flex-1 flex-col px-3 pb-3">
        <div className="flex h-full min-h-0 flex-1 flex-col rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-sm">
          <div className="h-[4.25rem] shrink-0 space-y-2">
            <Skeleton className="h-5 w-4/5 bg-zinc-200" />
            <Skeleton className="h-3 w-full bg-zinc-100" />
          </div>
          <div className="mt-3 grid h-[3.75rem] shrink-0 grid-cols-2 gap-2">
            <Skeleton className="h-full rounded-xl bg-zinc-100" />
            <Skeleton className="h-full rounded-xl bg-zinc-100" />
          </div>
          <Skeleton className="mt-auto h-10 w-full shrink-0 rounded-xl bg-zinc-200" />
        </div>
      </div>
    </article>
  );
}

const campaignCardShell =
  "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm";

export function CampaignFunnelCardSkeleton() {
  return (
    <article className={campaignCardShell} aria-hidden>
      <Skeleton className="h-44 w-full shrink-0 rounded-none bg-zinc-200" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-2/3 bg-zinc-100" />
        <Skeleton className="h-3 w-1/2 bg-zinc-100" />
      </div>
    </article>
  );
}
