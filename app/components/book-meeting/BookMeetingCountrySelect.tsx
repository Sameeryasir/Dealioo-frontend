"use client";

import { getCountryCallingCode } from "react-phone-number-input";
import type { Country } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import en from "react-phone-number-input/locale/en.json";
import { ChevronDown, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./BookMeetingPhoneInput.module.css";

type CountryOption = {
  value?: Country;
  label: string;
  divider?: boolean;
};

export type BookMeetingCountrySelectProps = {
  value?: Country;
  onChange: (country?: Country) => void;
  options: CountryOption[];
  disabled?: boolean;
  readOnly?: boolean;
};

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
  listMaxHeight: number;
};

const countryLabels = en as Record<string, string>;
const DROPDOWN_GAP = 6;
const VIEWPORT_PADDING = 12;
const ACTIONS_GAP = 10;
const SEARCH_HEADER_HEIGHT = 50;
const LIST_BOTTOM_PAD = 6;
const COUNTRY_ROW_HEIGHT = 42;
const PREFERRED_LIST_HEIGHT = 280;
const DROPDOWN_MIN_WIDTH = 300;
const DROPDOWN_MAX_WIDTH = 345;
const MIN_USABLE_BELOW = 160;

export function BookMeetingCountrySelect({
  value,
  onChange,
  options,
  disabled,
  readOnly,
}: BookMeetingCountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownPosition, setDropdownPosition] =
    useState<DropdownPosition | null>(null);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const country = value ?? "CA";

  const countryOptions = useMemo(
    () => options.filter((option) => !option.divider && option.value),
    [options],
  );

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return countryOptions;

    const digits = query.replace(/^\+/, "");

    const scored = countryOptions
      .map((option) => {
        const code = option.value as Country;
        const name = (countryLabels[code] ?? option.label).toLowerCase();
        const calling = getCountryCallingCode(code);
        const codeLower = code.toLowerCase();

        let score = -1;
        if (name.startsWith(query)) score = 0;
        else if (codeLower.startsWith(query)) score = 1;
        else if (calling.startsWith(digits)) score = 2;
        else if (name.includes(query)) score = 3;
        else if (codeLower.includes(query)) score = 4;
        else if (calling.includes(digits)) score = 5;

        return score >= 0 ? { option, score, name } : null;
      })
      .filter((row): row is NonNullable<typeof row> => row != null);

    scored.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name));
    return scored.map((row) => row.option);
  }, [countryOptions, search]);

  const updateDropdownPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const phoneRow = trigger.closest("[data-phone-input-row]");
    const phoneField = trigger.closest("[data-phone-field]");
    const phoneLabel = trigger.closest("label");
    const anchor = phoneRow ?? trigger;
    const rect = anchor.getBoundingClientRect();
    const columnWidth =
      phoneField?.getBoundingClientRect().width ??
      phoneLabel?.getBoundingClientRect().width ??
      phoneRow?.getBoundingClientRect().width ??
      0;
    const width = Math.min(
      Math.max(columnWidth, DROPDOWN_MIN_WIDTH),
      DROPDOWN_MAX_WIDTH,
      window.innerWidth - 32,
    );

    const sheet = anchor.closest("[data-book-meeting-sheet]");
    const actions = sheet?.querySelector("[data-book-meeting-actions]");
    const actionsTop = actions?.getBoundingClientRect().top;
    const sheetRect = sheet?.getBoundingClientRect();

    const bottomLimit =
      actionsTop != null
        ? actionsTop - ACTIONS_GAP
        : sheetRect
          ? sheetRect.bottom - 12
          : window.innerHeight - VIEWPORT_PADDING;

    const topLimit = Math.max(
      VIEWPORT_PADDING,
      sheetRect ? sheetRect.top + 8 : VIEWPORT_PADDING,
    );

    const chrome = SEARCH_HEADER_HEIGHT + LIST_BOTTOM_PAD;
    const spaceBelow = bottomLimit - (rect.bottom + DROPDOWN_GAP);
    const spaceAbove = rect.top - DROPDOWN_GAP - topLimit;

    const openUp =
      spaceBelow < MIN_USABLE_BELOW && spaceAbove > spaceBelow;

    const available = Math.max(0, openUp ? spaceAbove : spaceBelow);
    const listMaxHeight = Math.max(
      0,
      Math.min(PREFERRED_LIST_HEIGHT, available - chrome),
    );

    const finalListHeight =
      listMaxHeight >= COUNTRY_ROW_HEIGHT
        ? listMaxHeight
        : Math.min(
            PREFERRED_LIST_HEIGHT,
            Math.max(COUNTRY_ROW_HEIGHT * 2, spaceAbove - chrome),
          );

    const dropdownHeight = finalListHeight + chrome;
    const top =
      openUp || listMaxHeight < COUNTRY_ROW_HEIGHT
        ? Math.max(topLimit, rect.top - DROPDOWN_GAP - dropdownHeight)
        : rect.bottom + DROPDOWN_GAP;

    setDropdownPosition({
      top,
      left: Math.min(
        Math.max(16, rect.left),
        window.innerWidth - width - 16,
      ),
      width,
      listMaxHeight: Math.max(COUNTRY_ROW_HEIGHT, finalListHeight),
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setDropdownPosition(null);
      return;
    }

    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [open, updateDropdownPosition]);

  useEffect(() => {
    if (!open) return;
    updateDropdownPosition();
  }, [open, filteredOptions.length, updateDropdownPosition]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
      setSearch("");
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      setSearch("");
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const SelectedFlag = flags[country];

  const dropdown =
    open && dropdownPosition && mounted ? (
      <div
        ref={dropdownRef}
        className={`${styles.countryDropdownPortal} flex flex-col overflow-hidden rounded-[0.65rem] border border-[#e8eaed] bg-white shadow-[0_10px_32px_rgba(0,0,0,0.16)]`}
        style={{
          position: "fixed",
          zIndex: 200,
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
          maxHeight:
            dropdownPosition.listMaxHeight +
            SEARCH_HEADER_HEIGHT +
            LIST_BOTTOM_PAD,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "#ffffff",
        }}
      >
        <div
          className={`${styles.countrySearchWrap} flex shrink-0 items-center gap-2 border-b border-[#f1f3f4] px-3 py-2.5`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "0.6rem 0.75rem",
            borderBottom: "1px solid #f1f3f4",
          }}
        >
          <Search
            className={`${styles.countrySearchIcon} size-4 shrink-0 text-slate-500`}
            aria-hidden
          />
          <input
            type="search"
            className={`${styles.countrySearch} w-full border-0 bg-transparent text-sm text-[#202124] outline-none`}
            placeholder="Search countries"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            autoFocus
          />
        </div>

        <ul
          className={`${styles.countryList} m-0 min-h-0 list-none overflow-y-auto p-1.5`}
          role="listbox"
          style={{
            maxHeight: dropdownPosition.listMaxHeight,
            margin: 0,
            padding: "0.3rem 0.35rem 0.65rem",
            listStyle: "none",
            overflowY: "auto",
          }}
        >
          {filteredOptions.length === 0 ? (
            <li
              className={`${styles.countryEmpty} px-3 py-3 text-center text-[0.8125rem] font-medium text-slate-500`}
            >
              No countries found
            </li>
          ) : (
            filteredOptions.map((option) => {
              const code = option.value as Country;
              const FlagIcon = flags[code];
              const name = countryLabels[code] ?? option.label;
              const calling = `+${getCountryCallingCode(code)}`;
              const selected = code === country;

              return (
                <li key={code} className="list-none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`${styles.countryOption}${selected ? ` ${styles.countryOptionSelected}` : ""} flex w-full flex-row flex-nowrap items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-left hover:bg-[#f8f9fa]`}
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      flexWrap: "nowrap",
                      alignItems: "center",
                      gap: "0.65rem",
                      width: "100%",
                      minHeight: "2.5rem",
                      padding: "0.45rem 0.65rem",
                      border: selected
                        ? "1px solid var(--brand-primary, #1877f2)"
                        : "1px solid transparent",
                      borderRadius: "0.45rem",
                      background: selected
                        ? "color-mix(in srgb, var(--brand-primary, #1877f2) 8%, #ffffff)"
                        : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onClick={() => {
                      onChange(code);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <span
                      className={`${styles.countryOptionFlag} inline-flex h-[0.9rem] w-[1.35rem] shrink-0 overflow-hidden rounded-[0.15rem] [&>svg]:block [&>svg]:h-full [&>svg]:w-full`}
                      style={{
                        display: "inline-flex",
                        width: "1.35rem",
                        height: "0.9rem",
                        flexShrink: 0,
                        overflow: "hidden",
                        borderRadius: "0.15rem",
                      }}
                    >
                      {FlagIcon ? <FlagIcon title={name} /> : null}
                    </span>
                    <span
                      className={`${styles.countryOptionName} min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-[#3c4043]`}
                      style={{
                        flex: "1 1 auto",
                        minWidth: 0,
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        color: "#3c4043",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {name}
                    </span>
                    <span
                      className={`${styles.countryOptionCode} shrink-0 text-[0.8125rem] font-semibold text-[#5f6368]`}
                      style={{
                        flexShrink: 0,
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "#5f6368",
                        marginLeft: "0.25rem",
                      }}
                    >
                      {calling}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    ) : null;

  return (
    <div
      ref={rootRef}
      className={`${styles.countrySelectRoot} inline-flex shrink-0 flex-row flex-nowrap items-center`}
      style={{ display: "inline-flex", flexDirection: "row", alignItems: "center" }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.countryTrigger} inline-flex flex-row flex-nowrap items-center gap-1`}
        style={{
          display: "inline-flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          alignItems: "center",
          gap: "0.35rem",
          whiteSpace: "nowrap",
        }}
        onClick={() => {
          if (disabled || readOnly) return;
          setOpen((current) => !current);
        }}
        disabled={disabled || readOnly}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select country code"
      >
        <span
          className={`${styles.countryFlag} inline-flex h-[1.05rem] w-[1.55rem] shrink-0 overflow-hidden`}
          style={{
            display: "inline-flex",
            width: "1.55rem",
            height: "1.05rem",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {SelectedFlag ? (
            <SelectedFlag title={countryLabels[country] ?? country} />
          ) : null}
        </span>
        <ChevronDown
          className={`${styles.countryChevron} size-3.5 shrink-0 text-slate-500`}
          aria-hidden
        />
      </button>

      {dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}
