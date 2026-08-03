"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
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
}: {
  selected: boolean;
  title: string;
  description?: string;
  icon?: ReactNode;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full rounded-2xl border px-5 py-5 text-left transition duration-200 ${
        selected
          ? "border-[#4285F4] bg-white shadow-[0_10px_28px_rgba(66,133,244,0.12)] ring-1 ring-[#4285F4]"
          : "border-[#e8edf5] bg-white hover:-translate-y-0.5 hover:border-[#4285F4]/50 hover:shadow-md"
      }`}
    >
      {selected ? (
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
          <span className="ml-2 text-xs font-semibold text-slate-400">
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

export function SearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Search…",
  error,
  required,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
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

  return (
    <div ref={rootRef} className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-bold text-[#07111f]">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${googleBuilderInputClass} flex items-center justify-between gap-2 text-left ${
          error ? builderInputErrorClass : ""
        }`}
      >
        <span className={value ? "text-[#07111f]" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 text-slate-400" aria-hidden />
      </button>
      {open ? (
        <div className="overflow-hidden rounded-xl border border-[#e8edf5] bg-white shadow-lg">
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
          <ul className="max-h-56 overflow-y-auto py-1">
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
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter(
      (o) =>
        (!q || o.toLowerCase().includes(q)) && !values.includes(o),
    );
  }, [options, query, values]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-[#07111f]">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </p>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#dbeafe] bg-[#f4f8ff] px-3 py-1 text-xs font-semibold text-[#4285F4]"
            >
              {value}
              <button
                type="button"
                aria-label={`Remove ${value}`}
                onClick={() => onChange(values.filter((v) => v !== value))}
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="rounded-xl border border-[#e8edf5] bg-[#f8fafc]">
        <div className="flex items-center gap-2 border-b border-[#e8edf5] px-3 py-2">
          <Search className="size-4 text-slate-400" aria-hidden />
          <input
            className="w-full bg-transparent text-sm outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
          />
        </div>
        <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto p-3">
          {filtered.slice(0, 40).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange([...values, option]);
                setQuery("");
              }}
              className="rounded-full border border-[#e8edf5] bg-white px-3 py-1 text-xs font-semibold text-[#07111f] transition hover:border-[#4285F4] hover:text-[#4285F4]"
            >
              + {option}
            </button>
          ))}
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-400">No more options</p>
          ) : null}
        </div>
      </div>
      {error ? <p className="text-xs font-medium text-red-500">{error}</p> : null}
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
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              selected
                ? "border-[#4285F4] bg-[#e8f0fe] text-[#4285F4]"
                : "border-[#e8edf5] bg-white text-[#07111f] hover:bg-[#f4f8ff]"
            }`}
          >
            {option}
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
  return (
    <div className="space-y-4 rounded-2xl border border-[#e8edf5] bg-white p-5 shadow-sm">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#07111f]">Daily budget</p>
          <p className="text-xs text-slate-500">Drag to set your comfort level</p>
        </div>
        <p className="text-3xl font-extrabold tracking-tight text-[#4285F4]">
          ${value}
        </p>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#e8edf5] accent-[#4285F4]"
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
