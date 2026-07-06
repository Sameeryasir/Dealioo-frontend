"use client";

import { Skeleton } from "@/app/components/skeleton";

export function FunnelPreviewSkeleton() {
  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white"
      aria-busy="true"
      aria-label="Loading funnel preview"
    >
      <Skeleton
        funnel
        className="aspect-[4/3] w-full rounded-none"
      />

      <div className="space-y-4 px-5 pb-8 pt-6 text-center">
        <Skeleton funnel className="mx-auto h-5 w-28 rounded-full" />
        <Skeleton funnel className="mx-auto h-8 w-[88%] max-w-[16rem]" />
        <Skeleton funnel className="mx-auto h-4 w-[70%] max-w-xs" />
        <Skeleton funnel className="mx-auto mt-2 h-px w-12" />

        <div className="space-y-2.5 pt-1">
          <Skeleton funnel className="mx-auto h-3 w-full max-w-sm" />
          <Skeleton funnel className="mx-auto h-3 w-full max-w-sm" />
          <Skeleton funnel className="mx-auto h-3 w-[90%] max-w-sm" />
        </div>

        <Skeleton funnel className="mx-auto mt-4 h-12 w-full max-w-sm rounded-2xl" />
        <Skeleton funnel className="mx-auto h-3 w-40" />
      </div>
    </div>
  );
}
