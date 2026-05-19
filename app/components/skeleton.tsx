"use client";

import type { ComponentType } from "react";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-zinc-200/80 ${className ?? ""}`}
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
  "flex h-full w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm";

export function RestaurantCardSkeleton() {
  return (
    <article className={restaurantCardShell} aria-hidden>
      <Skeleton className="h-44 w-full rounded-none bg-zinc-200" />
      <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
        <Skeleton className="h-6 w-3/4 bg-zinc-200" />
        <Skeleton className="h-4 w-full bg-zinc-100" />
        <Skeleton className="h-4 w-11/12 bg-zinc-100" />
        <div className="mt-2 space-y-2.5">
          <Skeleton className="h-4 w-2/3 bg-zinc-100" />
          <Skeleton className="h-4 w-1/2 bg-zinc-100" />
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
