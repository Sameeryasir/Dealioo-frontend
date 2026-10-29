"use client";

import { Check } from "lucide-react";
import { GoogleAdsLogo } from "@/app/components/landing/LandingIntegrationLogos";

const GOOGLE_ITEMS = [
  "Track Conversions",
  "Optimize Campaigns",
  "Measure ROI",
] as const;

export function GoogleTrackingVisual() {
  return (
    <div className="relative flex h-full min-h-[11rem] flex-col items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-amber-50 to-white p-4 ring-1 ring-amber-100/80">
      <div className="absolute left-1/2 top-8 size-28 -translate-x-1/2 rounded-full bg-amber-300/30 blur-2xl" aria-hidden />

      <div className="relative z-[1] flex size-16 items-center justify-center rounded-2xl border border-white bg-white shadow-[0_12px_28px_rgba(251,188,4,0.28)]">
        <GoogleAdsLogo className="size-9" />
      </div>

      <div className="relative z-[1] mt-4 w-full max-w-[11.5rem] rounded-xl border border-[#e8edf5] bg-white/95 p-3 shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
        <p className="mb-2 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-700 ring-1 ring-amber-200">
          Ads measurement
        </p>
        <ul className="space-y-1.5">
          {GOOGLE_ITEMS.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 text-xs font-medium text-[#07111f]"
            >
              <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check className="size-2.5" strokeWidth={3} aria-hidden />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
