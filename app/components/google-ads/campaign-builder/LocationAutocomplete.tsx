"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import {
  formatLocationOption,
  isSameLocation,
  searchGoogleAdsLocations,
  type GoogleAdsLocationRef,
} from "@/app/components/google-ads/campaign-builder/location-targeting";

type LocationAutocompleteProps = {
  label: string;
  values: GoogleAdsLocationRef[];
  onChange: (values: GoogleAdsLocationRef[]) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  description?: string;
  single?: boolean;
  activeId?: string | null;
  onActivate?: (location: GoogleAdsLocationRef) => void;
};

export function LocationAutocomplete({
  label,
  values,
  onChange,
  placeholder = "Search countries, states, cities, postal codes...",
  required,
  error,
  description,
  single = false,
  activeId = null,
  onActivate,
}: LocationAutocompleteProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GoogleAdsLocationRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      setSearched(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setLoading(true);
      void searchGoogleAdsLocations(query)
        .then((rows) => {
          const filtered = rows.filter(
            (row) => !values.some((selected) => isSameLocation(selected, row)),
          );
          setResults(filtered);
          setActiveIndex(0);
          setSearched(true);
          setOpen(true);
        })
        .catch(() => {
          setResults([]);
          setSearched(true);
        })
        .finally(() => setLoading(false));
    }, 280);

    return () => window.clearTimeout(timer);
  }, [query, values]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const selectLocation = (location: GoogleAdsLocationRef) => {
    if (single) {
      onChange([location]);
    } else {
      onChange([...values, location]);
    }
    onActivate?.(location);
    setQuery("");
    setResults([]);
    setOpen(false);
    setSearched(false);
  };

  const removeLocation = (location: GoogleAdsLocationRef) => {
    onChange(values.filter((row) => !isSameLocation(row, location)));
  };

  return (
    <div ref={rootRef} className="space-y-2">
      <div>
        <p className="text-sm font-bold text-[#07111f]">
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </p>
        {description ? (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        ) : null}
      </div>

      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {values.map((location) => {
            const isActive = activeId === location.id;
            return (
              <span
                key={`${location.type}-${location.id}-${location.name}`}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                  isActive
                    ? "border-[#1877f2] bg-[#1877f2] text-white"
                    : "border-[#dbeafe] bg-[#f4f8ff] text-[#1877f2]"
                }`}
              >
                <button
                  type="button"
                  className="text-left"
                  onClick={() => onActivate?.(location)}
                >
                  <span className="block">
                    {location.name}
                    <span
                      className={`ml-1 font-medium ${
                        isActive ? "text-white/80" : "text-slate-400"
                      }`}
                    >
                      {location.type === "postal_code"
                        ? "ZIP"
                        : location.type === "state"
                          ? "Region"
                          : location.type.charAt(0).toUpperCase() +
                            location.type.slice(1)}
                    </span>
                  </span>
                  {location.type === "country" ? (
                    <span
                      className={`mt-0.5 block text-[11px] font-medium ${
                        isActive ? "text-white/75" : "text-slate-400"
                      }`}
                    >
                      Entire country
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${location.name}`}
                  onClick={() => removeLocation(location)}
                  className={`rounded-full p-0.5 transition ${
                    isActive ? "hover:bg-white/20" : "hover:bg-[#dbeafe]"
                  }`}
                >
                  <X className="size-3" aria-hidden />
                </button>
              </span>
            );
          })}
        </div>
      ) : null}

      <div className="relative">
        <div
          className={`flex items-center gap-2 rounded-xl border bg-[#f8fafc] px-3 py-2.5 ${
            error ? "border-red-300" : "border-[#e8edf5]"
          }`}
        >
          <Search className="size-4 shrink-0 text-slate-400" aria-hidden />
          <input
            className="w-full bg-transparent text-sm text-[#07111f] outline-none placeholder:text-slate-400"
            value={query}
            placeholder={placeholder}
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            onFocus={() => {
              if (results.length || searched) setOpen(true);
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onKeyDown={(e) => {
              if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
                setOpen(true);
                return;
              }
              if (e.key === "Escape") {
                setOpen(false);
                return;
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((index) =>
                  results.length ? (index + 1) % results.length : 0,
                );
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((index) =>
                  results.length
                    ? (index - 1 + results.length) % results.length
                    : 0,
                );
                return;
              }
              if (e.key === "Enter" && open && results[activeIndex]) {
                e.preventDefault();
                selectLocation(results[activeIndex]);
              }
            }}
          />
          {loading ? (
            <Loader2
              className="size-4 shrink-0 animate-spin text-[#1877f2]"
              aria-hidden
            />
          ) : null}
        </div>

        {open && query.trim() ? (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[#e8edf5] bg-white py-1 shadow-lg"
          >
            {loading ? (
              <li className="px-3 py-2.5 text-sm text-slate-500">
                Searching locations…
              </li>
            ) : null}
            {!loading && searched && results.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-slate-500">
                No locations found. Try another search.
              </li>
            ) : null}
            {!loading
              ? results.map((location, index) => (
                  <li key={`${location.type}-${location.id}-${location.name}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition ${
                        index === activeIndex
                          ? "bg-[#f4f8ff] text-[#1877f2]"
                          : "text-[#07111f] hover:bg-[#f8fafc]"
                      }`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => selectLocation(location)}
                    >
                      <span className="font-semibold">{location.name}</span>
                      <span className="text-xs font-medium text-slate-400">
                        {formatLocationOption(location).split(" · ")[1]}
                      </span>
                    </button>
                  </li>
                ))
              : null}
          </ul>
        ) : null}
      </div>

      {error ? <p className="text-xs font-medium text-red-500">{error}</p> : null}
    </div>
  );
}
