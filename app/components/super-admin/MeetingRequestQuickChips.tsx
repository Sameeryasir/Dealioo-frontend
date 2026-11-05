"use client";

import styles from "@/app/components/SuperAdminDashboard.module.css";

export type MeetingQuickScope =
  | "all"
  | "upcoming"
  | "past"
  | "deal_won"
  | "today"
  | "this_week"
  | "no_show"
  | "cancelled";

const QUICK_CHIPS: Array<{ id: MeetingQuickScope; label: string }> = [
  { id: "today", label: "Today" },
  { id: "this_week", label: "This week" },
  { id: "no_show", label: "No-show" },
  { id: "cancelled", label: "Cancelled" },
];

type MeetingRequestQuickChipsProps = {
  scope: MeetingQuickScope;
  counts: Partial<Record<MeetingQuickScope, number>>;
  onChange: (scope: MeetingQuickScope) => void;
};

export function MeetingRequestQuickChips({
  scope,
  counts,
  onChange,
}: MeetingRequestQuickChipsProps) {
  return (
    <div className={styles.saQuickChipRow} role="group" aria-label="Quick filters">
      {QUICK_CHIPS.map((chip) => {
        const selected = scope === chip.id;
        const count = counts[chip.id];
        return (
          <button
            key={chip.id}
            type="button"
            className={`${styles.saQuickChip} ${
              selected ? styles.saQuickChipSelected : ""
            }`}
            aria-pressed={selected}
            onClick={() => onChange(selected ? "all" : chip.id)}
          >
            {chip.label}
            {typeof count === "number" ? (
              <span className={styles.saQuickChipCount}>{count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
