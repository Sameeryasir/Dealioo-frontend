"use client";

import { Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  getCountries,
  getCountryCallingCode,
  type Country,
} from "react-phone-number-input";
import en from "react-phone-number-input/locale/en.json";

const labels = en as Record<string, string>;

type TwilioBuyCountryPickerProps = {
  value: Country;
  disabled?: boolean;
  onChange: (country: Country) => void;
};

function countryFlagEmoji(iso: string): string {
  const code = iso.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return String.fromCodePoint(
    ...[...code].map((char) => 127397 + char.charCodeAt(0)),
  );
}

function formatCountryOption(code: Country): string {
  const name = labels[code] || code;
  const calling = getCountryCallingCode(code);
  const flag = countryFlagEmoji(code);
  return `${flag} (+${calling}) ${name} - ${code}`;
}

export function TwilioBuyCountryPicker({
  value,
  disabled = false,
  onChange,
}: TwilioBuyCountryPickerProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);

  const allCountries = useMemo(() => {
    return (getCountries() as Country[]).sort((a, b) =>
      (labels[a] || a).localeCompare(labels[b] || b, "en", {
        sensitivity: "base",
      }),
    );
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !open) return allCountries;

    const digits = q.replace(/^\+/, "").replace(/[^\d]/g, "");

    const scored = allCountries
      .map((code) => {
        const name = (labels[code] || code).toLowerCase();
        const iso = code.toLowerCase();
        const calling = getCountryCallingCode(code);
        const display = formatCountryOption(code).toLowerCase();

        let score = -1;
        if (name.startsWith(q)) score = 0;
        else if (iso.startsWith(q)) score = 1;
        else if (digits && calling.startsWith(digits)) score = 2;
        else if (name.includes(q)) score = 3;
        else if (iso.includes(q)) score = 4;
        else if (digits && calling.includes(digits)) score = 5;
        else if (display.includes(q)) score = 6;

        return score >= 0 ? { code, score, name } : null;
      })
      .filter((row): row is NonNullable<typeof row> => row != null);

    scored.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name));
    return scored.map((row) => row.code);
  }, [allCountries, open, query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const selectedIndex = filtered.indexOf(value);
    setHighlightIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [query, open, filtered, value]);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[highlightIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [highlightIndex, open]);

  const selectedLabel = formatCountryOption(value);
  const inputValue = open && query.length > 0 ? query : selectedLabel;

  function selectCountry(code: Country) {
    onChange(code);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setQuery("");
        return;
      }
      setHighlightIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const choice = filtered[highlightIndex];
      if (open && choice) selectCountry(choice);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div ref={rootRef} className="relative mt-1.5">
      <div
        className={`flex h-11 items-stretch overflow-hidden rounded-lg border bg-white transition-[box-shadow,border-color] ${
          open
            ? "border-[#60a5fa] shadow-[0_0_0_3px_rgba(59,130,246,0.25)]"
            : "border-[#d0d7e2] hover:border-[#b8c2d1]"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          value={inputValue}
          placeholder="Search countries"
          onFocus={() => {
            if (disabled) return;
            setOpen(true);
            setQuery("");
            requestAnimationFrame(() => {
              inputRef.current?.select();
            });
          }}
          onChange={(e) => {
            setOpen(true);
            setQuery(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-[0.9rem] text-[#1e293b] outline-none placeholder:text-[#94a3b8]"
        />
        <span
          className="flex w-10 shrink-0 items-center justify-center border-l border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]"
          aria-hidden
        >
          <Search className="size-4" />
        </span>
      </div>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-[80] max-h-56 overflow-auto rounded-lg border border-[#d0d7e2] bg-white py-1 shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2.5 text-[0.85rem] text-[#64748b]">
              No countries found
            </li>
          ) : (
            filtered.map((code, index) => {
              const label = formatCountryOption(code);
              const selected = code === value;
              const highlighted = index === highlightIndex;
              return (
                <li key={code} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    ref={(el) => {
                      optionRefs.current[index] = el;
                    }}
                    className={`flex w-full items-center px-3 py-2 text-left text-[0.9rem] ${
                      highlighted || selected
                        ? "bg-[#e8f3fc] text-[#1d4ed8]"
                        : "text-[#1e293b] hover:bg-[#e8f3fc] hover:text-[#1d4ed8]"
                    }`}
                    onMouseEnter={() => setHighlightIndex(index)}
                    onClick={() => selectCountry(code)}
                  >
                    <span className="truncate">{label}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}

export function supportsTwilioAreaCodeFilter(country: Country): boolean {
  return country === "US" || country === "CA";
}
