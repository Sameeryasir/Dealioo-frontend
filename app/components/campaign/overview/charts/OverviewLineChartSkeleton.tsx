"use client";

import { OverviewChartShell } from "@/app/components/campaign/overview/charts/OverviewChartShell";
import { Skeleton } from "@/app/components/skeleton";

export function OverviewLineChartSkeleton({
  title,
  subtitle = "Meta vs Google",
  accent = "blue",
}: {
  title: string;
  subtitle?: string;
  accent?: "blue" | "green" | "orange" | "pink";
}) {
  return (
    <OverviewChartShell
      title={title}
      subtitle={subtitle}
      minHeightClass="min-h-[300px]"
      className="h-full"
      accent={accent}
    >
      <div
        className="flex h-full min-h-0 flex-col justify-between gap-3 px-1 py-1"
        aria-busy="true"
        aria-label={`Loading ${title}`}
      >
        <div className="min-h-0 flex-1">
          <Skeleton funnel className="h-full min-h-[220px] w-full rounded-xl" />
        </div>
        <ul className="m-0 flex list-none flex-wrap items-center justify-center gap-2 p-0">
          <li>
            <Skeleton funnel className="h-7 w-20 rounded-full" />
          </li>
          <li>
            <Skeleton funnel className="h-7 w-24 rounded-full" />
          </li>
        </ul>
      </div>
    </OverviewChartShell>
  );
}
