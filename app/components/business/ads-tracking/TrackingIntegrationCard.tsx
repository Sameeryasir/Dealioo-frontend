"use client";

import type { ReactNode } from "react";

export function ConnectionBadge({ connected }: { connected: boolean }) {
  return connected ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.7rem] font-semibold text-emerald-700 ring-1 ring-emerald-200">
      <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
      Connected
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[0.7rem] font-semibold text-amber-700 ring-1 ring-amber-200">
      <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
      Not connected
    </span>
  );
}

type TrackingIntegrationCardProps = {
  accent: "meta" | "google";
  logo: ReactNode;
  title: string;
  connected: boolean;
  description: string;
  refreshButton: ReactNode;
  form: ReactNode;
  visual?: ReactNode;
};

export function TrackingIntegrationCard({
  accent,
  logo,
  title,
  connected,
  description,
  refreshButton,
  form,
  visual,
}: TrackingIntegrationCardProps) {
  const isMeta = accent === "meta";
  const showVisual = Boolean(visual);

  return (
    <section className="h-full min-w-0 overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
      <div className="flex min-h-full min-w-0">
        <div
          className={`w-[5px] shrink-0 self-stretch ${
            isMeta ? "bg-[#1877f2]" : "bg-amber-400"
          }`}
          aria-hidden
        />
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:gap-5 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              {logo}
              <h2 className="text-lg font-bold text-[#07111f]">{title}</h2>
              <ConnectionBadge connected={connected} />
            </div>
            {refreshButton}
          </div>

          <p className="truncate whitespace-nowrap text-sm leading-relaxed text-slate-500">
            {description}
          </p>

          <div
            className={`grid min-w-0 flex-1 grid-cols-1 items-stretch gap-4 ${
              showVisual
                ? "xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] xl:gap-5"
                : ""
            }`}
          >
            <div className="min-w-0 rounded-xl border border-[#e8edf5] bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.03)] sm:p-5">
              {form}
            </div>
            {showVisual ? (
              <div className="hidden min-w-0 xl:block">{visual}</div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
