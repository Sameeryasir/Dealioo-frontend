"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Search, X, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { googleBuilderInputClass } from "@/app/components/google-ads/campaign-builder/google-builder-ui";
import { builderInputErrorClass } from "@/app/components/campaign/meta-builder/builder-ui";

export function StepShell({
  step,
  total,
  title,
  description,
  children,
}: {
  step: number;
  total: number;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      key={`${step}-${title}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="max-w-2xl">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#4285F4]">
          Step {step} of {total}
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#07111f]">
          {title}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-slate-500">
          {description}
        </p>
      </div>
      {children}
    </motion.div>
  );
}

export function SelectableCard({
  selected,
  title,
  description,
  icon,
  onClick,
  badge,
  selectionMode = "check",
}: {
  selected: boolean;
  title: string;
  description?: string;
  icon?: ReactNode;
  onClick: () => void;
  badge?: string;
  selectionMode?: "check" | "radio";
}) {
  return (
    <button
      type="button"
      role={selectionMode === "radio" ? "radio" : undefined}
      aria-checked={selectionMode === "radio" ? selected : undefined}
      onClick={onClick}
      className={`relative w-full rounded-2xl border px-5 py-5 text-left transition duration-200 ${
        selected
          ? "border-[#4285F4] bg-white shadow-[0_10px_28px_rgba(66,133,244,0.12)] ring-1 ring-[#4285F4]"
          : "border-[#e8edf5] bg-white hover:-translate-y-0.5 hover:border-[#4285F4]/50 hover:shadow-md"
      }`}
    >
      {selectionMode === "radio" ? (
        <span
          className={`absolute right-4 top-4 flex size-5 items-center justify-center rounded-full border-2 ${
            selected
              ? "border-[#4285F4] bg-white"
              : "border-slate-300 bg-white"
          }`}
          aria-hidden
        >
          {selected ? (
            <span className="size-2.5 rounded-full bg-[#4285F4]" />
          ) : null}
        </span>
      ) : selected ? (
        <span className="absolute right-4 top-4 flex size-6 items-center justify-center rounded-full bg-[#4285F4] text-white">
          <Check className="size-3.5" strokeWidth={3} aria-hidden />
        </span>
      ) : null}
      {icon ? (
        <span
          className={`mb-3 inline-flex size-11 items-center justify-center rounded-xl ${
            selected
              ? "bg-[#e8f0fe] text-[#4285F4]"
              : "bg-[#f4f8ff] text-slate-600"
          }`}
        >
          {icon}
        </span>
      ) : null}
      <p className="pr-8 text-base font-bold text-[#07111f]">
        {title}
        {badge ? (
          <span className="ml-2 inline-flex items-center rounded-md bg-[#e8f0fe] px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[#4285F4]">
            {badge}
          </span>
        ) : null}
      </p>
      {description ? (
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          {description}
        </p>
      ) : null}
    </button>
  );
}

export function SimpleSelect({
  value,
  options,
  onChange,
  placeholder = "Select…",
  error,
  "aria-label": ariaLabel,
}: {
  value: string;
  options: Array<{ id: string; label: string; group?: string }>;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  "aria-label"?: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.id === value) ?? null;
  const groupedOptions = useMemo(() => {
    const groups: Array<{
      label: string | null;
      options: Array<{ id: string; label: string; group?: string }>;
    }> = [];
    for (const option of options) {
      const label = option.group?.trim() || null;
      const last = groups[groups.length - 1];
      if (last && last.label === label) {
        last.options.push(option);
      } else {
        groups.push({ label, options: [option] });
      }
    }
    return groups;
  }, [options]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        className={`${googleBuilderInputClass} flex items-center justify-between gap-2 text-left ${
          error ? builderInputErrorClass : ""
        }`}
      >
        <span className={selected ? "text-[#07111f]" : "text-slate-400"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-slate-400 transition ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-[#e8edf5] bg-white py-1 shadow-[0_16px_40px_rgba(15,23,42,0.14)]"
        >
          {groupedOptions.map((group) => (
            <li key={group.label ?? "__ungrouped"}>
              {group.label ? (
                <p className="px-3.5 pb-1 pt-2 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#4285F4]">
                  {group.label}
                </p>
              ) : null}
              <ul>
                {group.options.map((option) => {
                  const isSelected = option.id === value;
                  return (
                    <li key={option.id} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm font-medium transition ${
                          isSelected
                            ? "bg-[#f4f8ff] text-[#4285F4]"
                            : "text-[#07111f] hover:bg-[#f8fafc]"
                        }`}
                        onClick={() => {
                          onChange(option.id);
                          setOpen(false);
                        }}
                      >
                        <span className="truncate">{option.label}</span>
                        {isSelected ? (
                          <Check className="size-4 shrink-0" aria-hidden />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function SearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Search…",
  error,
  required,
  hint,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  hint?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const locked: Array<{ node: HTMLElement; overflow: string }> = [];
    let node: HTMLElement | null = rootRef.current?.parentElement ?? null;
    while (node) {
      const { overflowY } = window.getComputedStyle(node);
      if (overflowY === "auto" || overflowY === "scroll") {
        locked.push({ node, overflow: node.style.overflow });
        node.style.overflow = "hidden";
      }
      node = node.parentElement;
    }

    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      for (const row of locked) {
        row.node.style.overflow = row.overflow;
      }
      document.body.style.overflow = bodyOverflow;
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative space-y-1.5">
      <div>
        <label htmlFor={id} className="block text-sm font-bold text-[#07111f]">
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </label>
        {hint ? (
          <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`${googleBuilderInputClass} flex items-center justify-between gap-2 text-left ${
          error ? builderInputErrorClass : ""
        }`}
      >
        <span className={value ? "text-[#07111f]" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-slate-400 transition ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-full z-40 mt-1.5 overflow-hidden rounded-xl border border-[#e8edf5] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.14)]">
          <div className="flex items-center gap-2 border-b border-[#e8edf5] px-3 py-2">
            <Search className="size-4 text-slate-400" aria-hidden />
            <input
              autoFocus
              className="w-full bg-transparent text-sm outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search"
            />
          </div>
          <ul className="max-h-44 overflow-y-auto overscroll-contain py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-400">No matches</li>
            ) : (
              filtered.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[#f4f8ff] ${
                      value === option
                        ? "font-semibold text-[#4285F4]"
                        : "text-[#07111f]"
                    }`}
                    onClick={() => {
                      onChange(option);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    {option}
                    {value === option ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
      {error ? <p className="text-xs font-medium text-red-500">{error}</p> : null}
    </div>
  );
}

export function SearchableMultiSelect({
  label,
  options,
  values,
  onChange,
  placeholder = "Search and select…",
  error,
  required,
  icon: Icon,
  description,
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  icon?: LucideIcon;
  description?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return options
      .filter(
        (o) => o.toLowerCase().includes(q) && !values.includes(o),
      )
      .slice(0, 8);
  }, [options, query, values]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const showResults = open && query.trim().length > 0;

  return (
    <div className="flex gap-3">
      {Icon ? (
        <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f8ff] text-[#4285F4]">
          <Icon className="size-5" aria-hidden />
        </span>
      ) : null}
      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <p className="text-sm font-bold text-[#07111f]">
            {label}
            {required ? <span className="text-red-500"> *</span> : null}
          </p>
          {description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              {description}
            </p>
          ) : null}
        </div>

        <div ref={rootRef} className="space-y-2">
          <div
            className={`rounded-xl border bg-white px-3 py-2.5 transition ${
              error
                ? builderInputErrorClass
                : open
                  ? "border-[#4285F4] ring-2 ring-[#4285F4]/15"
                  : "border-[#e8edf5]"
            }`}
            onClick={() => inputRef.current?.focus()}
          >
            {values.length > 0 ? (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {values.map((value) => (
                  <span
                    key={value}
                    className="inline-flex items-center gap-1 rounded-md bg-[#e8f0fe] px-2 py-1 text-xs font-semibold text-[#4285F4]"
                  >
                    {value}
                    <button
                      type="button"
                      aria-label={`Remove ${value}`}
                      className="rounded p-0.5 transition hover:bg-[#d2e3fc]"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(values.filter((v) => v !== value));
                      }}
                    >
                      <X className="size-3" aria-hidden />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <Search className="size-4 shrink-0 text-slate-400" aria-hidden />
              <input
                ref={inputRef}
                className="w-full bg-transparent text-sm text-[#07111f] outline-none placeholder:text-slate-400"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder={placeholder}
                aria-expanded={showResults}
                aria-autocomplete="list"
              />
            </div>
          </div>

          {showResults ? (
            <ul
              role="listbox"
              className="overflow-hidden rounded-xl border border-[#e8edf5] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
            >
              {filtered.length === 0 ? (
                <li className="px-3.5 py-3 text-sm text-slate-400">
                  No matching languages
                </li>
              ) : (
                filtered.map((option) => (
                  <li key={option} role="option">
                    <button
                      type="button"
                      className="flex w-full items-center px-3.5 py-2.5 text-left text-sm font-medium text-[#07111f] transition hover:bg-[#f4f8ff] hover:text-[#4285F4]"
                      onClick={() => {
                        onChange([...values, option]);
                        setQuery("");
                        setOpen(false);
                        inputRef.current?.focus();
                      }}
                    >
                      {option}
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : open && !query.trim() ? (
            <p className="px-1 text-xs text-slate-400">
              Start typing to find a language
            </p>
          ) : null}
        </div>

        {error ? (
          <p className="text-xs font-medium text-red-500">{error}</p>
        ) : null}
      </div>
    </div>
  );
}

export function ChipToggleGroup({
  options,
  values,
  onChange,
  multiple = true,
}: {
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
  multiple?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = values.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => {
              if (multiple) {
                onChange(
                  selected
                    ? values.filter((v) => v !== option)
                    : [...values, option],
                );
              } else {
                onChange([option]);
              }
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              selected
                ? "border-[#4285F4] bg-[#e8f0fe] text-[#4285F4]"
                : "border-[#e8edf5] bg-white text-[#07111f] hover:bg-[#f4f8ff]"
            }`}
          >
            {option}
            {selected ? (
              <Check className="size-3.5" strokeWidth={3} aria-hidden />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[#e8edf5] bg-white px-4 py-3 text-left transition hover:bg-[#f8fafc]"
    >
      <span>
        <span className="block text-sm font-bold text-[#07111f]">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-slate-500">
            {description}
          </span>
        ) : null}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-[#4285F4]" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${
            checked ? "left-5" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export function BudgetSlider({
  value,
  onChange,
  min = 5,
  max = 500,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  const pct = Math.max(
    0,
    Math.min(100, ((value - min) / Math.max(1, max - min)) * 100),
  );

  return (
    <div className="space-y-5 rounded-2xl border border-[#e8edf5] bg-white p-5 shadow-[0_8px_22px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#07111f]">Daily budget</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Drag the slider to set your comfort level
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-extrabold tracking-tight text-[#4285F4] sm:text-4xl">
            ${value}
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-400">per day</p>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Daily budget"
        className="google-budget-slider h-2 w-full cursor-pointer appearance-none rounded-full"
        style={{
          background: `linear-gradient(to right, #4285F4 0%, #4285F4 ${pct}%, #e8edf5 ${pct}%, #e8edf5 100%)`,
        }}
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>${min}</span>
        <span>${max}</span>
      </div>
    </div>
  );
}

export function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div>
        <p className="text-sm font-bold text-[#07111f]">
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </p>
        {hint ? (
          <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
        ) : null}
      </div>
      {children}
      {error ? <p className="text-xs font-medium text-red-500">{error}</p> : null}
    </div>
  );
}

export function inputClass(error?: string) {
  return `${googleBuilderInputClass} ${error ? builderInputErrorClass : ""}`;
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#e8edf5] bg-white p-5 shadow-[0_8px_22px_rgba(15,23,42,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}
