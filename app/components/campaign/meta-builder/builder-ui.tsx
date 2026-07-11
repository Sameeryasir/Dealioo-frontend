"use client";

import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Loader2,
} from "lucide-react";

export const META_BLUE = "#1877F2";
export const BRAND_BLUE = "#1877f2";
export const BRAND_BLUE_HOVER = "#166fe5";

export const builderInputClass =
  "w-full rounded-xl border border-[#e8edf5] bg-[#f8fafc] px-3.5 py-2.5 text-sm font-medium text-[#07111f] shadow-sm transition placeholder:text-slate-400 focus:border-[#1877f2]/45 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1877f2]/15";

export const builderInputErrorClass =
  "border-red-300 focus:border-red-400 focus:ring-red-500/20";

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
    <div className="overflow-hidden rounded-2xl border border-[#e8edf5] bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#1877f2]">
            Step {step} of {totalSteps}
          </p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#07111f]">
            {title}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
            {description}
          </p>
        </div>
        {badge ? (
          <span className="rounded-full border border-[#dbeafe] bg-[#f4f8ff] px-3 py-1 text-xs font-bold text-[#1877f2]">
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
      className={`overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02] ${className}`}
    >
      <div className="border-b border-[#e8edf5] px-5 py-4">
        <div className="flex items-start gap-3">
          {Icon ? (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#dbeafe] bg-[#f4f8ff] text-[#1877f2]">
              <Icon className="size-4" aria-hidden />
            </span>
          ) : null}
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#07111f]">{title}</h3>
            {description ? (
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

export function BuilderField({
  label,
  required,
  hint,
  error,
  children,
  id,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  id?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block">
        <span className="text-sm font-bold text-[#07111f]">
          {label}
          {required ? (
            <span className="text-red-500" aria-hidden> *</span>
          ) : null}
        </span>
        {hint ? (
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{hint}</p>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600" role="alert">{error}</p>
      ) : null}
    </div>
  );
}

export function BuilderCollapsible({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-[#e8edf5] bg-[#f8fafc]/80">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <div>
          <p className="text-sm font-bold text-[#07111f]">{title}</p>
          {description && !open ? (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          ) : null}
        </div>
        <ChevronDown
          className={`size-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="space-y-4 border-t border-[#e8edf5] px-4 pb-4 pt-3">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function BuilderSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#1877f2]">
      {children}
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
          ? "border-[#1877f2] bg-[#f4f8ff] shadow-sm ring-1 ring-[#1877f2]/15"
          : "border-[#e8edf5] bg-white hover:border-[#dbeafe] hover:bg-[#f8fbff]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
            selected
              ? "border-[#1877f2] bg-[#1877f2]"
              : "border-[#dbeafe] bg-white group-hover:border-[#1877f2]/50"
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
          <p className="text-sm font-bold text-[#07111f]">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
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
                ? "border-[#1877f2] bg-[#f4f8ff] ring-1 ring-[#1877f2]/15"
                : "border-[#e8edf5] bg-white hover:border-[#dbeafe] hover:bg-[#f8fbff]"
            }`}
          >
            <p
              className={`text-sm font-bold ${selected ? "text-[#1877f2]" : "text-[#07111f]"}`}
            >
              {opt.label}
            </p>
            {opt.hint ? (
              <p className="mt-0.5 text-xs text-slate-500">{opt.hint}</p>
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
      className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      role="alert"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}

export function BuilderWarningAlert({
  title,
  message,
  children,
}: {
  title: string;
  message?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5">
      <p className="font-semibold text-amber-950">{title}</p>
      {message ? (
        <p className="mt-1 text-sm leading-relaxed text-amber-900">{message}</p>
      ) : null}
      {children}
    </div>
  );
}

export function BuilderSuccessAlert({
  title,
  message,
  children,
}: {
  title: string;
  message?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
        <div className="min-w-0 space-y-2">
          <p className="font-semibold text-emerald-950">{title}</p>
          {message ? (
            <p className="text-sm leading-relaxed text-emerald-900">{message}</p>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}

export function BuilderSummaryCard({
  title,
  rows,
  accent,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
  accent?: "blue" | "zinc";
}) {
  const accentClass =
    accent === "blue"
      ? "border-l-[#1877f2]"
      : "border-l-[#e8edf5]";

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]">
      <div className={`border-b border-[#e8edf5] border-l-4 ${accentClass} px-5 py-3.5`}>
        <h3 className="text-sm font-bold text-[#07111f]">{title}</h3>
      </div>
      <dl className="divide-y divide-[#e8edf5]">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 px-5 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4"
          >
            <dt className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
              {row.label}
            </dt>
            <dd className="break-words text-sm font-medium text-[#07111f]">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function BuilderFooter({
  onBack,
  backLabel = "Cancel",
  primaryLabel,
  primaryDisabled,
  primaryLoading,
  primaryDisabledReason,
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
  primaryDisabledReason?: string;
  onPrimary?: () => void;
  primaryType?: "button" | "submit";
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  const disabled = primaryDisabled || primaryLoading;

  return (
    <div className="sticky bottom-0 -mx-1 mt-4 rounded-2xl border border-[#e8edf5] bg-white/95 px-4 py-4 shadow-[0_-8px_30px_rgba(24,119,242,0.08)] backdrop-blur-sm sm:px-5">
      {disabled && primaryDisabledReason ? (
        <p className="mb-3 text-xs text-slate-500">{primaryDisabledReason}</p>
      ) : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-[#e8edf5] px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-[#f4f8ff] hover:text-[#1877f2]"
        >
          {backLabel}
        </button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {secondaryLabel && onSecondary ? (
            <button
              type="button"
              onClick={onSecondary}
              className="rounded-xl border border-[#e8edf5] px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-[#f4f8ff] hover:text-[#1877f2]"
            >
              {secondaryLabel}
            </button>
          ) : null}
          <button
            type={primaryType}
            onClick={onPrimary}
            disabled={disabled}
            title={disabled && primaryDisabledReason ? primaryDisabledReason : undefined}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-5 py-2.5 text-sm font-bold text-white shadow-[0_6px_18px_rgba(24,119,242,0.3)] transition hover:bg-[#166fe5] focus:outline-none focus:ring-2 focus:ring-[#1877f2]/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

export function BuilderLoadingBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#dbeafe] bg-[#f4f8ff] px-4 py-3 text-sm text-[#07111f] shadow-sm">
      <Loader2 className="size-4 shrink-0 animate-spin text-[#1877f2]" aria-hidden />
      <span className="font-medium">{message}</span>
    </div>
  );
}
