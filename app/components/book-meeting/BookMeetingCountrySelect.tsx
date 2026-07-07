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
const VIEWPORT_PADDING = 16;
const ACTIONS_GAP = 14;
const SEARCH_HEADER_HEIGHT = 50;
const LIST_BOTTOM_PAD = 6;
const COUNTRY_ROW_HEIGHT = 42;
const PREFERRED_LIST_HEIGHT = 294;
const DROPDOWN_MIN_WIDTH = 300;
const DROPDOWN_MAX_WIDTH = 345;

export function BookMeetingCountrySelect({
  value,
  onChange,
  options,
  disabled,
  readOnly,
}: BookMeetingCountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);
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

    return countryOptions.filter((option) => {
      const code = option.value as Country;
      const name = countryLabels[code] ?? option.label;
      const calling = getCountryCallingCode(code);
      return (
        name.toLowerCase().includes(query) ||
        code.toLowerCase().includes(query) ||
        calling.includes(query.replace("+", ""))
      );
    });
  }, [countryOptions, search]);

  const updateDropdownPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const phoneRow = trigger.closest("[data-phone-input-row]");
    const anchor = phoneRow ?? trigger;
    const rect = anchor.getBoundingClientRect();
    const phoneLabel = trigger.closest("label");
    const columnWidth = phoneLabel?.getBoundingClientRect().width ?? 0;
    const width = Math.min(
      Math.max(columnWidth, DROPDOWN_MIN_WIDTH),
      DROPDOWN_MAX_WIDTH,
      window.innerWidth - 32,
    );
    const top = rect.bottom + DROPDOWN_GAP;

    const sheet = anchor.closest("[data-book-meeting-sheet]");
    const actions = sheet?.querySelector("[data-book-meeting-actions]");
    const actionsTop = actions?.getBoundingClientRect().top;
    const sheetRect = sheet?.getBoundingClientRect();

    const bottomLimit =
      actionsTop ??
      (sheetRect ? sheetRect.bottom - 12 : window.innerHeight - VIEWPORT_PADDING);

    const spaceBelow = bottomLimit - ACTIONS_GAP - top;
    const rawListHeight = spaceBelow - SEARCH_HEADER_HEIGHT - LIST_BOTTOM_PAD;
    const rowCount = Math.max(3, Math.floor(rawListHeight / COUNTRY_ROW_HEIGHT));
    const listMaxHeight = Math.min(
      PREFERRED_LIST_HEIGHT,
      rowCount * COUNTRY_ROW_HEIGHT,
    );

    setDropdownPosition({
      top,
      left: Math.min(rect.left, window.innerWidth - width - 16),
      width,
      listMaxHeight,
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

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || dropdownRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
      setSearch("");
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const SelectedFlag = flags[country];

  const dropdown =
    open && dropdownPosition && mounted ? (
      <div
        ref={dropdownRef}
        className={styles.countryDropdownPortal}
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
          maxHeight: dropdownPosition.listMaxHeight + SEARCH_HEADER_HEIGHT + LIST_BOTTOM_PAD,
        }}
      >
        <div className={styles.countrySearchWrap}>
          <Search className={styles.countrySearchIcon} aria-hidden />
          <input
            type="search"
            className={styles.countrySearch}
            placeholder="Search countries"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            autoFocus
          />
        </div>

        <ul
          className={styles.countryList}
          role="listbox"
          style={{ maxHeight: dropdownPosition.listMaxHeight }}
        >
          {filteredOptions.map((option) => {
            const code = option.value as Country;
            const FlagIcon = flags[code];
            const name = countryLabels[code] ?? option.label;
            const calling = `+${getCountryCallingCode(code)}`;
            const selected = code === country;

            return (
              <li key={code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`${styles.countryOption}${selected ? ` ${styles.countryOptionSelected}` : ""}`}
                  onClick={() => {
                    onChange(code);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <span className={styles.countryOptionFlag}>
                    {FlagIcon ? <FlagIcon title={name} /> : null}
                  </span>
                  <span className={styles.countryOptionName}>{name}</span>
                  <span className={styles.countryOptionCode}>{calling}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    ) : null;

  return (
    <div ref={rootRef} className={styles.countrySelectRoot}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.countryTrigger}
        onClick={() => {
          if (disabled || readOnly) return;
          setOpen((current) => !current);
        }}
        disabled={disabled || readOnly}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select country code"
      >
        <span className={styles.countryFlag}>
          {SelectedFlag ? <SelectedFlag title={countryLabels[country] ?? country} /> : null}
        </span>
        <ChevronDown className={styles.countryChevron} aria-hidden />
      </button>

      {dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}
