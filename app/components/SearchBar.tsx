"use client";

import { Search } from "lucide-react";

export type SearchBarProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmitSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  variant?: "default" | "toolbar" | "landing" | "premium" | "dashboard";
};

export default function SearchBar({
  id = "search-bar",
  name = "q",
  value,
  onChange,
  onSubmitSearch,
  placeholder = "Search…",
  className = "",
  variant = "default",
}: SearchBarProps) {
  const inputClass =
    variant === "dashboard"
      ? "org-dashboard-search-input h-11 w-full rounded-full border py-2 pl-[3.25rem] pr-4 text-left text-sm outline-none placeholder:text-[#94a3b8] focus:ring-4 focus:ring-brand-primary/10"
      : variant === "premium"
      ? "h-11 w-full rounded-full border border-white/80 bg-white/90 py-2 pl-11 pr-4 text-left text-sm text-brand-navy shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_1px_2px_rgba(15,23,42,0.04)] outline-none backdrop-blur-md placeholder:text-brand-muted focus:border-brand-primary/35 focus:bg-white focus:ring-4 focus:ring-brand-primary/10"
      : variant === "landing"
      ? "h-11 w-full rounded-full border border-[#e8edf5] bg-white py-2 pl-11 pr-4 text-left text-sm text-brand-navy outline-none placeholder:text-brand-muted focus:border-brand-primary/35 focus:ring-4 focus:ring-brand-primary/10"
      : variant === "toolbar"
      ? "h-12 w-full rounded-xl border-0 bg-zinc-50 py-2 pl-11 pr-4 text-left text-sm text-zinc-900 outline-none ring-1 ring-zinc-200/90 ring-inset placeholder:text-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-900/15"
      : "h-11 w-full rounded-xl border border-zinc-300 bg-white py-2 pl-10 pr-4 text-left text-sm text-zinc-900 shadow-sm outline-none ring-zinc-900/10 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2";

  const iconClass =
    variant === "premium" || variant === "landing"
      ? "pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-brand-muted"
      : variant === "toolbar"
      ? "pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-zinc-400"
      : "pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400";

  return (
    <form
      className={className}
      role="search"
      aria-label="Search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmitSearch?.(value.trim());
      }}
    >
      <label htmlFor={id} className="sr-only">
        Search
      </label>
      <div className="relative w-full">
        {variant === "dashboard" ? (
          <span className="org-dashboard-search-icon" aria-hidden>
            <Search className="size-[1.05rem]" strokeWidth={2.35} />
          </span>
        ) : (
          <Search className={iconClass} aria-hidden strokeWidth={2.25} />
        )}
        <input
          id={id}
          name={name}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className={inputClass}
        />
      </div>
    </form>
  );
}
