"use client";

import { ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  getCountries,
  getCountryCallingCode,
  type Country,
} from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import en from "react-phone-number-input/locale/en.json";

const labels = en as Record<string, string>;

const PRIORITY_COUNTRIES: Country[] = [
  "US",
  "CA",
  "GB",
  "AU",
  "IE",
  "NZ",
  "DE",
  "FR",
  "ES",
  "IT",
  "NL",
  "MX",
  "BR",
  "IN",
  "SG",
  "JP",
];

type TwilioBuyCountryPickerProps = {
  value: Country;
  disabled?: boolean;
  onChange: (country: Country) => void;
};

export function TwilioBuyCountryPicker({
  value,
  disabled = false,
  onChange,
}: TwilioBuyCountryPickerProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const allCountries = useMemo(() => {
    const priority = new Set(PRIORITY_COUNTRIES);
    const rest = (getCountries() as Country[])
      .filter((code) => !priority.has(code))
      .sort((a, b) =>
        (labels[a] || a).localeCompare(labels[b] || b, "en", {
          sensitivity: "base",
        }),
      );
    return [...PRIORITY_COUNTRIES.filter((c) => getCountries().includes(c)), ...rest];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCountries;

    const digits = q.replace(/^\+/, "");

    const scored = allCountries
      .map((code) => {
        const name = (labels[code] || code).toLowerCase();
        const iso = code.toLowerCase();
        const calling = getCountryCallingCode(code);

        let score = -1;
        if (name.startsWith(q)) score = 0;
        else if (iso.startsWith(q)) score = 1;
        else if (calling.startsWith(digits)) score = 2;
        else if (name.includes(q)) score = 3;
        else if (iso.includes(q)) score = 4;
        else if (calling.includes(digits)) score = 5;

        return score >= 0 ? { code, score, name } : null;
      })
      .filter((row): row is NonNullable<typeof row> => row != null);

    scored.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name));
    return scored.map((row) => row.code);
  }, [allCountries, query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      searchRef.current?.focus();
    }
  }, [open]);

  const SelectedFlag = flags[value];
  const selectedName = labels[value] || value;
  const selectedCalling = `+${getCountryCallingCode(value)}`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
          setQuery("");
        }}
        className="mt-1.5 flex h-10 w-full items-center gap-2 rounded-xl border border-[#e4e4e4] bg-[#fafafa] px-3 text-left text-[0.88rem] outline-none hover:bg-white focus:border-[#ccc] focus:bg-white disabled:opacity-60"
      >
        <span className="flex size-5 shrink-0 items-center overflow-hidden rounded-sm">
          {SelectedFlag ? <SelectedFlag title={selectedName} /> : null}
        </span>
        <span className="min-w-0 flex-1 truncate font-medium text-[#222]">
          {selectedName}
        </span>
        <span className="shrink-0 text-[0.75rem] text-[#888]">
          {value} · {selectedCalling}
        </span>
        <ChevronDown className="size-4 shrink-0 text-[#888]" aria-hidden />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[80] overflow-hidden rounded-xl border border-[#e4e4e4] bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-[#f0f0f0] px-3 py-2">
            <Search className="size-3.5 shrink-0 text-[#999]" aria-hidden />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country name or code"
              className="h-8 w-full bg-transparent text-[0.85rem] outline-none placeholder:text-[#aaa]"
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            className="max-h-56 overflow-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-[0.8rem] text-[#888]">
                No countries match that search.
              </li>
            ) : (
              filtered.map((code) => {
                const FlagIcon = flags[code];
                const name = labels[code] || code;
                const calling = `+${getCountryCallingCode(code)}`;
                const selected = code === value;
                return (
                  <li key={code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[0.85rem] hover:bg-[#f7f7f7] ${
                        selected ? "bg-[#fafafa] font-semibold" : ""
                      }`}
                      onClick={() => {
                        onChange(code);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <span className="flex size-5 shrink-0 items-center overflow-hidden rounded-sm">
                        {FlagIcon ? <FlagIcon title={name} /> : null}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[#222]">
                        {name}
                      </span>
                      <span className="shrink-0 text-[0.72rem] text-[#888]">
                        {code} · {calling}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function supportsTwilioAreaCodeFilter(country: Country): boolean {
  return country === "US" || country === "CA";
}
