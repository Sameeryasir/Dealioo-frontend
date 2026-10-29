"use client";

import { Check } from "lucide-react";
import { MetaLogo } from "@/app/components/landing/LandingIntegrationLogos";

const META_EVENTS = ["PageView", "AddToCart", "Purchase"] as const;

export function MetaTrackingVisual() {
  return (
    <div className="relative flex h-full min-h-[11rem] flex-col items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#eff6ff] to-white p-4 ring-1 ring-[#dbeafe]/70">
      <div className="absolute left-1/2 top-8 size-28 -translate-x-1/2 rounded-full bg-[#1877f2]/15 blur-2xl" aria-hidden />

      <div className="relative z-[1] flex size-16 items-center justify-center rounded-2xl border border-white bg-white shadow-[0_12px_28px_rgba(24,119,242,0.2)]">
        <MetaLogo className="size-9" />
      </div>

      <div className="relative z-[1] mt-4 w-full max-w-[11.5rem] rounded-xl border border-[#e8edf5] bg-white/95 p-3 shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
        <p className="mb-2 inline-flex rounded-full bg-[#eff6ff] px-2 py-0.5 text-[0.65rem] font-semibold text-[#1877f2] ring-1 ring-[#bfdbfe]">
          Conversion tracking
        </p>
        <ul className="space-y-1.5">
          {META_EVENTS.map((event) => (
            <li
              key={event}
              className="flex items-center gap-2 text-xs font-medium text-[#07111f]"
            >
              <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check className="size-2.5" strokeWidth={3} aria-hidden />
              </span>
              {event}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
