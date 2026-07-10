"use client";

import type { ReactNode } from "react";

const accentTopBar: Record<string, string> = {
  green: "from-[#34a853]/80 via-[#34a853]/40 to-transparent",
  blue: "from-[#1877f2]/80 via-[#1877f2]/40 to-transparent",
  pink: "from-[#e1306c]/80 via-[#e1306c]/40 to-transparent",
  orange: "from-[#f77737]/80 via-[#f77737]/40 to-transparent",
  multi: "from-[#34a853]/70 via-[#1877f2]/50 to-[#e1306c]/40",
};

const accentGlow: Record<string, string> = {
  green: "bg-[#34a853]/10",
  blue: "bg-[#1877f2]/10",
  pink: "bg-[#e1306c]/10",
  orange: "bg-[#f77737]/10",
  multi: "bg-[#1877f2]/8",
};

export function OverviewChartShell({
  title,
  subtitle,
  children,
  className = "",
  minHeightClass = "min-h-[220px]",
  accent = "blue",
  stat,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  minHeightClass?: string;
  accent?: keyof typeof accentTopBar;
  stat?: string;
}) {
  return (
    <div
      className={`group/chart relative flex h-full min-h-0 flex-col overflow-hidden rounded-[1.2rem] border border-[#e8edf5] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02] transition duration-300 hover:border-[#1877f2]/25 hover:shadow-[0_14px_36px_rgba(24,119,242,0.1)] ${className}`}
    >
      <span
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentTopBar[accent]}`}
        aria-hidden
      />
      <span
        className={`pointer-events-none absolute -right-8 -top-10 size-28 rounded-full blur-3xl ${accentGlow[accent]} opacity-80 transition duration-300 group-hover/chart:opacity-100`}
        aria-hidden
      />

      <div className="relative shrink-0 px-4 pb-2 pt-4 sm:px-5 sm:pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="m-0 text-[0.84rem] font-extrabold tracking-tight text-[#07111f] sm:text-[0.88rem]">
              {title}
            </h3>
            {subtitle ? (
              <p className="m-0 mt-0.5 text-[0.7rem] font-medium leading-snug text-slate-500">
                {subtitle}
              </p>
            ) : null}
          </div>
          {stat ? (
            <p className="m-0 shrink-0 text-right text-[1.35rem] font-extrabold tabular-nums leading-none tracking-tight text-[#07111f] sm:text-[1.5rem]">
              {stat}
            </p>
          ) : null}
        </div>
      </div>

      <div
        className={`relative mx-3 mb-3 flex min-h-0 flex-1 flex-col rounded-[1rem] bg-gradient-to-b from-[#f8fafc]/90 via-white to-white px-2 py-2 ring-1 ring-[#e8edf5]/80 sm:mx-4 sm:mb-4 sm:px-3 sm:py-3 ${minHeightClass}`}
      >
        {children}
      </div>
    </div>
  );
}
