"use client";
import { Check } from "lucide-react";
import styles from "./BookMeetingForm.module.css";

export type BookMeetingChoiceOption = {
  value: string;
  label: string;
  shortLabel?: string;
};

export type BookMeetingChoiceGridProps = {
  options: readonly BookMeetingChoiceOption[];
  ariaLabel: string;
  layout?: "list" | "stack";
  multi?: boolean;
  value?: string;
  values?: string[];
  onSelect: (value: string) => void;
};

export function BookMeetingChoiceGrid({
  options,
  ariaLabel,
  layout = "list",
  multi = false,
  value,
  values = [],
  onSelect,
}: BookMeetingChoiceGridProps) {
  if (layout === "list") {
    return (
      <div className={styles.choiceList} role={multi ? "group" : "listbox"} aria-label={ariaLabel}>
        {options.map((option) => {
          const selected = multi ? values.includes(option.value) : value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role={multi ? "checkbox" : "option"}
              aria-selected={selected}
              aria-checked={multi ? selected : undefined}
              className={`${styles.choiceListItem}${selected ? ` ${styles.choiceListItemSelected}` : ""}`}
              onClick={() => onSelect(option.value)}
            >
              <span className={styles.choiceListLabel}>{option.label}</span>
              {selected ? (
                <span className={styles.choiceListMark} aria-hidden>
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={styles.choiceStack} role={multi ? "group" : "listbox"} aria-label={ariaLabel}>
      {options.map((option) => {
        const selected = multi ? values.includes(option.value) : value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role={multi ? "checkbox" : "option"}
            aria-selected={selected}
            aria-checked={multi ? selected : undefined}
            className={`${styles.choiceTile} ${styles.choiceTileStack}${selected ? ` ${styles.choiceTileSelected}` : ""}`}
            onClick={() => onSelect(option.value)}
          >
            <span className={styles.choiceTileLabel}>{option.label}</span>
            <span
              className={`${styles.choiceTileCheck}${selected ? ` ${styles.choiceTileCheckVisible}` : ""}`}
              aria-hidden
            >
              <Check className="h-4 w-4" strokeWidth={3} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
