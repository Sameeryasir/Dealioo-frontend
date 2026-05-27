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
  variant?: "default" | "toolbar";
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
    variant === "toolbar"
      ? "h-12 w-full rounded-xl border-0 bg-zinc-50 py-2 pl-11 pr-4 text-left text-sm text-zinc-900 outline-none ring-1 ring-zinc-200/90 ring-inset placeholder:text-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-900/15"
      : "h-11 w-full rounded-xl border border-zinc-300 bg-white py-2 pl-10 pr-4 text-left text-sm text-zinc-900 shadow-sm outline-none ring-zinc-900/10 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2";

  const iconClass =
    variant === "toolbar"
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
      <div className="relative">
        <Search className={iconClass} aria-hidden strokeWidth={2} />
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
