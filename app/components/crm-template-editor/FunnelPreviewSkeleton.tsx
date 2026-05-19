"use client";

import { Skeleton } from "@/app/components/skeleton";

export function FunnelPreviewSkeleton() {
  return (
    <div
      className="mx-auto w-full min-w-0 overflow-hidden bg-[#F8F7FF]"
      aria-busy="true"
      aria-label="Loading funnel preview"
    >
      <Skeleton className="aspect-[4/3] w-full rounded-none bg-violet-100/90 sm:aspect-[3/2]" />

      <div className="space-y-4 px-5 pb-8 pt-6 text-center">
        <Skeleton className="mx-auto h-5 w-28 rounded-full" />
        <Skeleton className="mx-auto h-8 w-[88%] max-w-[16rem]" />
        <Skeleton className="mx-auto h-4 w-[70%] max-w-xs" />
        <Skeleton className="mx-auto mt-2 h-px w-12" />

        <div className="space-y-2.5 pt-1">
          <Skeleton className="mx-auto h-3 w-full max-w-sm" />
          <Skeleton className="mx-auto h-3 w-full max-w-sm" />
          <Skeleton className="mx-auto h-3 w-[90%] max-w-sm" />
        </div>

        <Skeleton className="mx-auto mt-4 h-12 w-full max-w-sm rounded-2xl bg-violet-200/90" />
        <Skeleton className="mx-auto h-3 w-40" />
      </div>
    </div>
  );
}
