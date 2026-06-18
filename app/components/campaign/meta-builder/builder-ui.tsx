"use client";

import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";

export const META_BLUE = "#1877F2";

export const builderInputClass =
  "mt-1.5 w-full rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm transition placeholder:text-zinc-400 focus:border-[#1877F2] focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20";

export function BuilderStepHeader({
  step,
  totalSteps = 4,
  title,
  description,
  badge,
}: {
  step: number;
  totalSteps?: number;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#1877F2]/15 bg-gradient-to-br from-[#1877F2]/10 via-white to-indigo-50/40 p-6 shadow-sm">
      <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-[#1877F2]/10 blur-2xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1877F2]">
            Step {step} of {totalSteps}
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">
            {title}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600">
            {description}
          </p>
        </div>
        {badge ? (
          <span className="rounded-full border border-[#1877F2]/20 bg-white/80 px-3 py-1 text-xs font-semibold text-[#1877F2] shadow-sm backdrop-blur">
            {badge}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function BuilderCard({
  title,
  description,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] ${className}`}
    >
      <div className="border-b border-zinc-100 bg-gradient-to-r from-zinc-50/80 to-white px-5 py-4">
        <div className="flex items-center gap-2.5">
          {Icon ? (
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#1877F2]/10 text-[#1877F2]">
              <Icon className="size-4" aria-hidden />
            </span>
          ) : null}
          <div>
            <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
            {description ? (
              <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

export function BuilderSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
      <span className="h-px flex-1 bg-gradient-to-r from-zinc-200 to-transparent" />
      {children}
      <span className="h-px flex-1 bg-gradient-to-l from-zinc-200 to-transparent" />
    </h3>
  );
}

export function BuilderRadioCard({
  selected,
  title,
  description,
  name,
  onSelect,
}: {
  selected: boolean;
  title: string;
  description: string;
  name: string;
  onSelect: () => void;
}) {
  return (
    <label
      className={`group block cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
        selected
          ? "border-[#1877F2] bg-gradient-to-br from-[#1877F2]/8 to-[#1877F2]/3 shadow-[0_0_0_1px_rgba(24,119,242,0.25),0_4px_12px_rgba(24,119,242,0.08)]"
          : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
            selected
              ? "border-[#1877F2] bg-[#1877F2]"
              : "border-zinc-300 bg-white group-hover:border-zinc-400"
          }`}
        >
          {selected ? (
            <span className="size-2 rounded-full bg-white" />
          ) : null}
        </span>
        <input
          type="radio"
          name={name}
          checked={selected}
          onChange={onSelect}
          className="sr-only"
        />
        <div>
          <p className="text-sm font-semibold text-zinc-900">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">
            {description}
          </p>
        </div>
      </div>
    </label>
  );
}

export function BuilderStatusToggle({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string; hint?: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-xl border px-4 py-3.5 text-left transition-all ${
              selected
                ? "border-[#1877F2] bg-[#1877F2]/5 shadow-[0_0_0_1px_rgba(24,119,242,0.2)]"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
          >
            <p
              className={`text-sm font-semibold ${selected ? "text-[#1877F2]" : "text-zinc-800"}`}
            >
              {opt.label}
            </p>
            {opt.hint ? (
              <p className="mt-0.5 text-xs text-zinc-500">{opt.hint}</p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function BuilderErrorAlert({ message }: { message: string }) {
  return (
    <div
      className="rounded-xl border border-red-200/80 bg-gradient-to-r from-red-50 to-red-50/50 px-4 py-3 text-sm text-red-800 shadow-sm"
      role="alert"
    >
      {message}
    </div>
  );
}

export function BuilderFooter({
  onBack,
  backLabel = "Cancel",
  primaryLabel,
  primaryDisabled,
  primaryLoading,
  onPrimary,
  primaryType = "submit",
  secondaryLabel,
  onSecondary,
}: {
  onBack: () => void;
  backLabel?: string;
  primaryLabel: string;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  onPrimary?: () => void;
  primaryType?: "button" | "submit";
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <div className="sticky bottom-0 -mx-1 mt-2 rounded-2xl border border-zinc-200 bg-white px-4 py-4 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
        >
          {backLabel}
        </button>
        <div className="flex gap-2">
          {secondaryLabel && onSecondary ? (
            <button
              type="button"
              onClick={onSecondary}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
            >
              {secondaryLabel}
            </button>
          ) : null}
          <button
            type={primaryType}
            onClick={onPrimary}
            disabled={primaryDisabled || primaryLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1877F2] to-[#0d65d9] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(24,119,242,0.35)] transition hover:from-[#166fe0] hover:to-[#0b5bc7] disabled:opacity-60"
          >
            {primaryLoading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function BuilderLoadingBanner({
  message,
}: {
  message: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#1877F2]/20 bg-[#1877F2]/5 px-4 py-3 text-sm font-medium text-[#1877F2]">
      <Loader2 className="size-4 animate-spin shrink-0" aria-hidden />
      {message}
    </div>
  );
}
