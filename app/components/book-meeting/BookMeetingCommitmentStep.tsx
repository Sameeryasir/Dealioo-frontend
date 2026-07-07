"use client";
import { MEETING_COMMITMENT_OPTIONS } from "@/app/components/book-meeting/book-meeting-config";
import { Check, CircleHelp, ShieldCheck, type LucideIcon } from "lucide-react";
import styles from "./BookMeetingForm.module.css";

const COMMITMENT_ICONS: Record<string, LucideIcon> = {
  yes: ShieldCheck,
  not_sure: CircleHelp,
};

const COMMITMENT_ICON_TONES: Record<string, keyof typeof styles> = {
  yes: "optionIconToneGreen",
  not_sure: "optionIconTonePink",
};

const COMMITMENT_LABELS: Record<string, string> = {
  yes: "Yes",
  not_sure: "No",
};

export type BookMeetingCommitmentStepProps = {
  value: string;
  onChange: (value: string) => void;
};

export function BookMeetingCommitmentStep({ value, onChange }: BookMeetingCommitmentStepProps) {
  return (
    <div className={styles.commitmentGrid} role="listbox" aria-label="Meeting commitment">
      {MEETING_COMMITMENT_OPTIONS.map((option) => {
        const selected = value === option.value;
        const Icon = COMMITMENT_ICONS[option.value] ?? CircleHelp;

        return (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={selected}
            aria-label={option.label}
            title={option.label}
            className={`${styles.commitmentTile}${selected ? ` ${styles.commitmentTileSelected}` : ""}`}
            onClick={() => onChange(option.value)}
          >
            <span
              className={`${styles.commitmentTileIcon} ${styles[COMMITMENT_ICON_TONES[option.value] ?? "optionIconToneBlue"]}`}
            >
              <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </span>
            <span className={styles.commitmentTileLabel}>
              {COMMITMENT_LABELS[option.value] ?? option.label}
            </span>
            <span
              className={`${styles.commitmentTileCheck}${selected ? ` ${styles.commitmentTileCheckVisible}` : ""}`}
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
