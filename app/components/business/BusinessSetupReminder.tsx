"use client";

import { BusinessSetupPopover } from "@/app/components/business/BusinessSetupPopover";
import { useBusinessByIdQuery } from "@/app/hooks/use-business-by-id-query";
import { useBusinessMembershipPermissions } from "@/app/hooks/use-business-membership-permissions";
import { useFacebookConnectionStatusQuery } from "@/app/hooks/use-facebook-connection-status-query";
import { hasAuthSession } from "@/app/lib/auth-session";
import { getBusinessSetup } from "@/app/lib/business-setup";
import { isSuperAdminUser } from "@/app/lib/is-super-admin-user";
import { ArrowRight, Settings, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function BusinessSetupReminder({
  businessId,
}: {
  businessId?: number | null;
}) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const resolvedBusinessId =
    businessId != null && businessId >= 1 ? businessId : null;
  const { data: business } = useBusinessByIdQuery(resolvedBusinessId);
  const { access } = useBusinessMembershipPermissions(resolvedBusinessId);
  const metaStatusQuery = useFacebookConnectionStatusQuery(resolvedBusinessId, {
    enabled: resolvedBusinessId != null && hasAuthSession(),
  });

  if (dismissed || isSuperAdminUser() || !business) return null;

  const setup = getBusinessSetup(business, {
    metaConnected:
      business.metaConnected === true ||
      Boolean(metaStatusQuery.data?.connected),
  });
  if (setup.isComplete) return null;

  const canManageSetup = business.isOwner === true || access === "owner";
  const displayProgress = Math.min(
    100,
    Math.max(0, Math.round(setup.progressPercent)),
  );
  const remainingLabel =
    setup.remainingCount === 1
      ? "1 step left to go live"
      : `${setup.remainingCount} steps left to go live`;
  const nextLabel = setup.nextRecommendedStep?.ctaLabel ?? "Continue setup";
  const ringView = 96;
  const ringCenter = ringView / 2;
  const circleRadius = 38;
  const circleStroke = 7;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const circleOffset =
    circleCircumference - (displayProgress / 100) * circleCircumference;
  const gradientId = `overview-setup-progress-${business.id ?? "x"}`;

  return (
    <aside
      className="org-biz-setup-reminder"
      role="status"
      aria-label="Business setup reminder"
    >
      <button
        type="button"
        className="org-biz-setup-reminder-dismiss"
        aria-label="Dismiss setup reminder"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDismissed(true);
        }}
      >
        <X className="size-3.5" strokeWidth={2.5} aria-hidden />
      </button>

      <BusinessSetupPopover
        setup={setup}
        canManageSetup={canManageSetup}
        variant="banner"
      >
        <div className="org-biz-setup-reminder-body">
          <div className="org-biz-setup-reminder-ring-wrap">
            <div
              className="org-biz-setup-reminder-ring"
              data-ready="true"
              aria-label={`${displayProgress}% complete`}
            >
              <svg
                viewBox={`0 0 ${ringView} ${ringView}`}
                className="org-biz-setup-reminder-ring-svg"
                aria-hidden
              >
                <defs>
                  <linearGradient
                    id={gradientId}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#1877f2" />
                    <stop offset="55%" stopColor="#833aba" />
                    <stop offset="100%" stopColor="#ea5a8f" />
                  </linearGradient>
                </defs>
                <circle
                  className="org-biz-setup-reminder-ring-track"
                  cx={ringCenter}
                  cy={ringCenter}
                  r={circleRadius}
                  fill="none"
                  strokeWidth={circleStroke}
                  strokeLinecap="round"
                />
                <circle
                  className="org-biz-setup-reminder-ring-fill"
                  cx={ringCenter}
                  cy={ringCenter}
                  r={circleRadius}
                  fill="none"
                  stroke={`url(#${gradientId})`}
                  strokeWidth={circleStroke}
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={circleOffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${ringCenter} ${ringCenter})`}
                />
              </svg>
              <span className="org-biz-setup-reminder-pct" aria-hidden>
                {displayProgress}%
              </span>
            </div>
          </div>

          <div className="org-biz-setup-reminder-copy">
            <span className="org-biz-setup-reminder-eyebrow">
              <Settings className="size-3" strokeWidth={2.5} aria-hidden />
              Business setup
            </span>
            <h3 className="org-biz-setup-reminder-title">
              Finish setting up your business
            </h3>
            <p className="org-biz-setup-reminder-sub">
              <span className="org-biz-setup-reminder-count">
                {setup.completedCount} of {setup.totalCount} complete
              </span>
              <span aria-hidden>·</span>
              <span>{remainingLabel}</span>
            </p>
            <div className="org-biz-setup-reminder-segments" aria-hidden>
              {Array.from({ length: setup.totalCount }).map((_, index) => (
                <span
                  key={index}
                  className="org-biz-setup-reminder-segment"
                  data-done={
                    index < setup.completedCount ? "true" : undefined
                  }
                />
              ))}
            </div>
          </div>

          {canManageSetup ? (
            <button
              type="button"
              data-setup-next
              className="org-biz-setup-reminder-cta"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (setup.nextRecommendedStep) {
                  router.push(setup.nextRecommendedStep.href);
                }
              }}
            >
              {nextLabel}
              <ArrowRight className="size-3.5" strokeWidth={2.5} aria-hidden />
            </button>
          ) : null}
        </div>
      </BusinessSetupPopover>
    </aside>
  );
}
