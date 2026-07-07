"use client";
import { MONTHLY_REVENUE_OPTIONS } from "@/app/components/book-meeting/book-meeting-config";
import { Check } from "lucide-react";
import styles from "./BookMeetingForm.module.css";

export type BookMeetingRevenueStepProps = {
  value: string;
  onChange: (value: string) => void;
};

export function BookMeetingRevenueStep({ value, onChange }: BookMeetingRevenueStepProps) {
  return (
    <div className={styles.revenueList} role="listbox" aria-label="Monthly revenue range">
      {MONTHLY_REVENUE_OPTIONS.map((option) => {
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={selected}
            aria-label={option.label}
            title={option.label}
            className={`${styles.revenueOption}${selected ? ` ${styles.revenueOptionSelected}` : ""}`}
            onClick={() => onChange(option.value)}
          >
            <span className={styles.revenueOptionAmount}>{option.amount}</span>
            <span className={styles.revenueOptionPeriod}>monthly</span>
            <span
              className={`${styles.revenueOptionCheck}${selected ? ` ${styles.revenueOptionCheckVisible}` : ""}`}
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
