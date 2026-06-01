"use client";

import type { LucideIcon } from "lucide-react";
import { panelCardClass, panelCardPaddingClass } from "@/app/lib/panel-styles";

const ICON_STROKE = 2.25;

type AccentTone = "zinc" | "emerald" | "blue" | "violet";

const accentToneStyles: Record<
  AccentTone,
  { card: string; accent: string; ring: string }
> = {
  zinc: {
    card: "border-zinc-200/90 bg-white",
    accent: "bg-zinc-800",
    ring: "ring-zinc-200/60",
  },
  emerald: {
    card: "border-emerald-200/70 bg-white",
    accent: "bg-emerald-600",
    ring: "ring-emerald-200/50",
  },
  blue: {
    card: "border-blue-200/70 bg-white",
    accent: "bg-blue-600",
    ring: "ring-blue-200/50",
  },
  violet: {
    card: "border-violet-200/70 bg-white",
    accent: "bg-violet-600",
    ring: "ring-violet-200/50",
  },
};

export function MetricStatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <div className={`${panelCardClass} ${panelCardPaddingClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            {value}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{hint}</p>
        </div>
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${accent}`}
        >
          <Icon className="size-5 text-white" strokeWidth={2} aria-hidden />
        </div>
      </div>
    </div>
  );
}

export function MetricStatCardAccent({
  label,
  value,
  icon: Icon,
  tone,
  highlight,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone: AccentTone;
  highlight?: boolean;
}) {
  const s = accentToneStyles[tone];

  return (
    <div
      className={`relative flex h-full min-h-[5.5rem] flex-col overflow-hidden rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${s.card} ${
        highlight ? "ring-2 ring-blue-400/30" : "ring-1 ring-zinc-950/[0.03]"
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 ${s.accent} opacity-80`}
        aria-hidden
      />
      <div className="flex items-center gap-3 pt-0.5">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ring-4 ${s.accent} ${s.ring}`}
        >
          <Icon className="size-5" aria-hidden strokeWidth={ICON_STROKE} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            {label}
          </p>
          <p className="mt-0.5 text-2xl font-bold tracking-tight tabular-nums text-zinc-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
