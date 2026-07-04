"use client";
import { START_TIMELINE_OPTIONS } from "@/app/components/book-meeting/book-meeting-config";
import { CalendarDays, Check, Compass, Zap, type LucideIcon } from "lucide-react";
import styles from "./BookMeetingForm.module.css";

const TIMELINE_ICONS: Record<string, LucideIcon> = {
  immediately: Zap,
  one_to_three_months: CalendarDays,
  just_exploring: Compass,
};

const TIMELINE_ICON_TONES: Record<string, keyof typeof styles> = {
  immediately: "optionIconToneOrange",
  one_to_three_months: "optionIconToneBlue",
  just_exploring: "optionIconToneViolet",
};

export type BookMeetingTimelineStepProps = {
  value: string;
  onChange: (value: string) => void;
};

export function BookMeetingTimelineStep({ value, onChange }: BookMeetingTimelineStepProps) {
  return (
    <div className={styles.timelineGrid} role="listbox" aria-label="Start timeline">
      {START_TIMELINE_OPTIONS.map((option) => {
        const selected = value === option.value;
        const Icon = TIMELINE_ICONS[option.value] ?? Compass;

        return (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={selected}
            aria-label={option.label}
            title={option.label}
            className={`${styles.timelineTile}${selected ? ` ${styles.timelineTileSelected}` : ""}`}
            onClick={() => onChange(option.value)}
          >
            <span
              className={`${styles.timelineTileIcon} ${styles[TIMELINE_ICON_TONES[option.value] ?? "optionIconToneBlue"]}`}
            >
              <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </span>
            <span className={styles.timelineTileLabel}>{option.label}</span>
            <span
              className={`${styles.timelineTileCheck}${selected ? ` ${styles.timelineTileCheckVisible}` : ""}`}
              aria-hidden
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
