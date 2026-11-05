"use client";

import {
  isReadyForOnboarding,
  needsMeetingFollowUp,
  type MeetingAlertInput,
} from "@/app/components/super-admin/meeting-request-alerts";
import styles from "@/app/components/SuperAdminDashboard.module.css";
import Link from "next/link";

type MeetingRequestAlertBadgesProps = {
  meeting: MeetingAlertInput;
  className?: string;
};

export function MeetingRequestAlertBadges({
  meeting,
  className,
}: MeetingRequestAlertBadgesProps) {
  const followUp = needsMeetingFollowUp(meeting);
  const ready = isReadyForOnboarding(meeting);
  if (!followUp && !ready) return null;

  return (
    <div
      className={`${styles.saHealthBadgeRow} ${className ?? ""}`.trim()}
      aria-label="Meeting alerts"
    >
      {followUp ? (
        <span
          className={`${styles.saHealthBadge} ${styles.saHealthBadgeWarn}`}
        >
          Needs follow-up
        </span>
      ) : null}
      {ready ? (
        <Link
          href="/admin/customer-onboarding"
          className={`${styles.saHealthBadge} ${styles.saHealthBadgeDanger}`}
          onClick={(event) => event.stopPropagation()}
          title="Open Customer Onboarding to create the account"
        >
          Ready for onboarding
        </Link>
      ) : null}
    </div>
  );
}
