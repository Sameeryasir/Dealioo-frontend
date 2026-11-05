"use client";

import {
  getStuckOnboardingDays,
  type StuckOnboardingInput,
} from "@/app/components/super-admin/stuck-onboarding";
import styles from "@/app/components/SuperAdminDashboard.module.css";

type StuckOnboardingBadgeProps = {
  meeting: StuckOnboardingInput;
  className?: string;
};

export function StuckOnboardingBadge({
  meeting,
  className,
}: StuckOnboardingBadgeProps) {
  const daysStuck = getStuckOnboardingDays(meeting);
  if (daysStuck === null) return null;

  return (
    <span
      className={`${styles.saHealthBadge} ${styles.saHealthBadgeDanger} ${className ?? ""}`.trim()}
      title={`No account created for ${daysStuck} day${daysStuck === 1 ? "" : "s"}`}
    >
      Stuck {daysStuck}d
    </span>
  );
}
