"use client";

import { ChartColumn } from "lucide-react";

export function TrackingPageHeader() {
  return (
    <header className="min-w-0">
      <div className="flex min-w-0 items-start gap-3 sm:gap-3.5">
        <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8f2ff] text-[#1877f2] sm:size-11">
          <ChartColumn className="size-5" strokeWidth={2.25} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#1877f2]">
            Ads tracking
          </p>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight text-[#07111f] sm:text-2xl lg:text-[1.75rem]">
            Connect tracking pixels.
          </h1>
        </div>
      </div>
    </header>
  );
}
