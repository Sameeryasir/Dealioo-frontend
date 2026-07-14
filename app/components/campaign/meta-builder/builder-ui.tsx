"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
} from "lucide-react";

export const META_BLUE = "#1877F2";
export const BRAND_BLUE = "#1877f2";
export const BRAND_BLUE_HOVER = "#166fe5";

/* Shared Meta Ads Manager theme tokens — use across all meta-builder steps */
export const metaBuilderShellClass = "meta-builder-theme bg-[#f0f2f5]";
export const metaBuilderBorderClass = "border-[#e8edf5]";
export const metaBuilderSurfaceClass = "bg-white";
export const metaBuilderMutedSurfaceClass = "bg-[#f4f8ff]";
export const metaBuilderInputSurfaceClass = "bg-[#f8fafc]";
export const metaBuilderTextClass = "text-[#07111f]";
export const metaBuilderTextMutedClass = "text-slate-500";
export const metaBuilderSecondaryButtonClass =
  "rounded-xl border border-[#e8edf5] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#dbeafe] hover:bg-[#f4f8ff] hover:text-[#1877f2]";
export const metaBuilderChipButtonClass =
  "rounded-lg border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-semibold text-[#07111f] transition hover:border-[#dbeafe] hover:bg-[#f4f8ff] hover:text-[#1877f2]";
export const metaBuilderPanelClass = `overflow-hidden rounded-xl border ${metaBuilderBorderClass} ${metaBuilderSurfaceClass}`;
export const metaBuilderMutedPanelClass = `rounded-xl border ${metaBuilderBorderClass} ${metaBuilderMutedSurfaceClass}`;

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
      className={`overflow-visible rounded-2xl border border-[#e8edf5] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02] ${className}`}
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

export function BuilderSelect<T extends string>({
  id,
  value,
  options,
  onChange,
  disabled,
  "aria-label": ariaLabel,
}: {
  id?: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const [menuBox, setMenuBox] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const selected = options.find((opt) => opt.value === value) ?? options[0];

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setMenuBox(null);
      return;
    }
    const update = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuBox({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const menu =
    open && menuBox && typeof document !== "undefined"
      ? createPortal(
          <ul
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-activedescendant={
              selected ? `${listId}-${selected.value}` : undefined
            }
            style={{
              position: "fixed",
              top: menuBox.top,
              left: menuBox.left,
              width: menuBox.width,
            }}
            className="z-[80] max-h-64 overflow-auto rounded-xl border border-[#e8edf5] bg-white py-1 shadow-[0_16px_40px_rgba(15,23,42,0.16)] ring-1 ring-black/[0.04]"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <li key={opt.value} role="option" aria-selected={isSelected}>
                  <button
                    id={`${listId}-${opt.value}`}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm font-medium transition ${
                      isSelected
                        ? "bg-[#f4f8ff] text-[#1877f2]"
                        : "text-[#07111f] hover:bg-[#f8fafc]"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected ? (
                      <Check
                        className="size-4 shrink-0 text-[#1877f2]"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        className={`${builderInputClass} flex items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60 ${
          open ? "border-[#1877f2]/45 bg-white ring-2 ring-[#1877f2]/15" : ""
        }`}
      >
        <span className="truncate">{selected?.label ?? "Select"}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {menu}
    </div>
  );
}

export function BuilderPerformanceGoalSelect<T extends string>({
  id,
  value,
  options,
  onChange,
  disabled,
  "aria-label": ariaLabel,
}: {
  id?: string;
  value: T;
  options: Array<{
    value: T;
    label: string;
    description?: string;
    group?: "primary" | "other" | "video";
  }>;
  onChange: (value: T) => void;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const [menuBox, setMenuBox] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((opt) => opt.value === value) ?? options[0];
  const primaryOptions = options.filter(
    (opt) => !opt.group || opt.group === "primary",
  );
  const otherOptions = options.filter((opt) => opt.group === "other");
  const videoOptions = options.filter((opt) => opt.group === "video");

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setMenuBox(null);
      return;
    }
    const update = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.max(rect.width, 320);
      const left = Math.min(rect.left, window.innerWidth - width - 8);
      setMenuBox({
        top: rect.bottom + 4,
        left: Math.max(8, left),
        width,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const renderOption = (opt: (typeof options)[number]) => {
    const isSelected = opt.value === value;
    return (
      <button
        key={opt.value}
        id={`${listId}-${opt.value}`}
        type="button"
        role="option"
        aria-selected={isSelected}
        onClick={() => {
          onChange(opt.value);
          setOpen(false);
        }}
        className={`flex w-full items-start gap-3 px-3.5 py-3 text-left transition ${
          isSelected ? "bg-[#f4f8ff]" : "hover:bg-[#f8fafc]"
        }`}
      >
        <span
          className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
            isSelected
              ? "border-[#1877f2] bg-[#1877f2]"
              : "border-slate-300 bg-white"
          }`}
          aria-hidden
        >
          {isSelected ? (
            <span className="size-1.5 rounded-full bg-white" />
          ) : null}
        </span>
        <span className="min-w-0">
          <span
            className={`block text-sm font-semibold ${
              isSelected ? "text-[#1877f2]" : "text-[#07111f]"
            }`}
          >
            {opt.label}
          </span>
          {opt.description ? (
            <span className="mt-1 block text-xs leading-relaxed text-slate-500">
              {opt.description}
            </span>
          ) : null}
        </span>
      </button>
    );
  };

  const menu =
    open && menuBox && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-activedescendant={
              selected ? `${listId}-${selected.value}` : undefined
            }
            style={{
              position: "fixed",
              top: menuBox.top,
              left: menuBox.left,
              width: menuBox.width,
            }}
            className="z-[80] max-h-[28rem] overflow-auto rounded-xl border border-[#e8edf5] bg-white py-1 shadow-[0_16px_40px_rgba(15,23,42,0.16)] ring-1 ring-black/[0.04]"
          >
            {primaryOptions.map(renderOption)}
            {otherOptions.length ? (
              <>
                <div className="px-3.5 pb-1 pt-2 text-xs font-bold text-slate-700">
                  Other goals
                </div>
                {otherOptions.map(renderOption)}
              </>
            ) : null}
            {videoOptions.length ? (
              <>
                <div className="px-3.5 pb-1 pt-2 text-xs font-bold text-slate-700">
                  Video view goals
                </div>
                {videoOptions.map(renderOption)}
              </>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        className={`${builderInputClass} flex items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60 ${
          open ? "border-[#1877f2]/45 bg-white ring-2 ring-[#1877f2]/15" : ""
        }`}
      >
        <span className="truncate">{selected?.label ?? "Select"}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {menu}
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
  accent?: "blue" | "muted";
}) {
  const accentClass =
    accent === "muted"
      ? "border-l-[#e8edf5]"
      : "border-l-[#1877f2]";

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
