"use client";

import {
  businessNeedsAttention,
  getBusinessHealthIssues,
  type BusinessHealthInput,
} from "@/app/components/super-admin/business-health";
import styles from "@/app/components/SuperAdminDashboard.module.css";

type BusinessHealthBadgesProps = {
  business: BusinessHealthInput;
  showHealthy?: boolean;
  className?: string;
};

export function BusinessHealthBadges({
  business,
  showHealthy = false,
  className,
}: BusinessHealthBadgesProps) {
  const issues = getBusinessHealthIssues(business);
  const needsAttention = businessNeedsAttention(business);

  if (!needsAttention) {
    if (!showHealthy) return null;
    return (
      <div
        className={`${styles.saHealthBadgeRow} ${className ?? ""}`.trim()}
        aria-label="Business health: healthy"
      >
        <span
          className={`${styles.saHealthBadge} ${styles.saHealthBadgeHealthy}`}
        >
          Healthy
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${styles.saHealthBadgeRow} ${className ?? ""}`.trim()}
      aria-label="Business needs attention"
    >
      {issues.map((issue) => (
        <span
          key={issue.key}
          className={`${styles.saHealthBadge} ${styles.saHealthBadgeWarn}`}
        >
          {issue.label}
        </span>
      ))}
    </div>
  );
}
