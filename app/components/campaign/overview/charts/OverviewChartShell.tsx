"use client";

import type { ReactNode } from "react";

const overviewChartCardClass =
  "rounded-[1.1rem] border border-[#e8edf5] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.03)] ring-1 ring-black/[0.02]";

export function OverviewChartShell({
  title,
  subtitle,
  children,
  className = "",
  minHeightClass = "min-h-[220px]",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  minHeightClass?: string;
}) {
  return (
    <div
      className={`flex h-full min-h-0 flex-col ${overviewChartCardClass} px-4 py-4 sm:px-5 sm:py-5 ${className}`}
    >
      <div className="mb-3 shrink-0">
        <h3 className="m-0 text-[0.82rem] font-extrabold tracking-tight text-[#07111f]">
          {title}
        </h3>
        {subtitle ? (
          <p className="m-0 mt-1 text-[0.72rem] font-medium leading-snug text-slate-500">
            {subtitle}
          </p>
        ) : null}
      </div>
      <div className={`flex min-h-0 flex-1 flex-col ${minHeightClass}`}>
        {children}
      </div>
    </div>
  );
}
