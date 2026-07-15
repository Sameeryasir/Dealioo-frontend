"use client";

import { BusinessProfileSetupPopover } from "@/app/components/business/BusinessProfileSetupPopover";
import { getBusinessProfileSetup } from "@/app/lib/business-profile-setup";
import { isScannerUser } from "@/app/lib/is-scanner-user";
import {
  resolveUploadImageUrl,
  spacesImageLoadProps,
} from "@/app/lib/resolve-upload-image-url";
import type { AdminBusiness } from "@/app/services/business/get-my-business";
import {
  ArrowUpRight,
  Building2,
  Check,
  Clock,
  ImageIcon,
  MapPin,
} from "lucide-react";
import Link from "next/link";

type Props = {
  business: AdminBusiness;
  layout?: "grid" | "list";
  accentIndex?: number;
};

export default function BusinessDashboardCard({
  business,
  layout = "grid",
}: Props) {
  const { name, branchCount, city, state, country, logoUrl } = business;

  const fullAddress = [city, state, country].filter(Boolean).join(", ");
  const cityLabel = city?.trim() || "Add location";
  const logoSrc = resolveUploadImageUrl(logoUrl);
  const dashboardHref =
    typeof business.id === "number" && business.id >= 1
      ? isScannerUser()
        ? `/business/${business.id}/dashboard/scanning`
        : `/business/${business.id}/dashboard`
      : "/dashboard";

  const branches = branchCount ?? 0;
  const branchLabel =
    branches === 1 ? "1 branch" : `${branches} branches`;

  const setup = getBusinessProfileSetup(business);
  const progress = setup.progressPercent;
  const remainingSteps = Math.max(0, setup.totalCount - setup.completedCount);
  const isReady = progress >= 100;
  const showSetupStatus = !isReady;

  // Thin circular progress geometry
  const circleRadius = 18;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const circleOffset =
    circleCircumference -
    (Math.min(100, Math.max(0, progress)) / 100) * circleCircumference;

  const setupStatusText = isReady
    ? "Complete"
    : remainingSteps === 1
      ? "1 step left"
      : `${remainingSteps} steps left`;

  const cardAriaLabel = `${name}${isReady ? ", ready" : ", in setup"}. Open dashboard.`;

  const logoMark = logoSrc ? (
    <img
      src={logoSrc}
      alt=""
      className="org-biz-card-avatar-img"
      {...spacesImageLoadProps}
    />
  ) : (
    <span className="org-biz-card-avatar-placeholder" aria-hidden>
      <ImageIcon className="size-6 sm:size-7" strokeWidth={1.75} />
    </span>
  );

  if (layout === "list") {
    return (
      <Link
        href={dashboardHref}
        className="org-biz-card org-biz-card--list group outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/35 focus-visible:ring-offset-2"
        aria-label={cardAriaLabel}
      >
        <span
          className={`org-biz-card-thumb${logoSrc ? "" : " org-biz-card-thumb--placeholder"}`}
        >
          {logoMark}
        </span>

        <span className="org-biz-card-list-main">
          <span className="org-biz-card-list-top">
            <span className="org-biz-card-title">{name}</span>
            {showSetupStatus ? (
              <span className="org-biz-card-status">
                <Clock className="size-3" strokeWidth={2.5} aria-hidden />
                In setup
              </span>
            ) : (
              <span className="org-biz-card-status org-biz-card-status--ready">
                <Check className="size-3" strokeWidth={2.75} aria-hidden />
                Ready
              </span>
            )}
          </span>
          <span className="org-biz-card-meta-inline">
            <MapPin className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
            <span title={fullAddress || undefined}>{cityLabel}</span>
            <span aria-hidden>·</span>
            <Building2 className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
            {branchLabel}
          </span>
        </span>

        <span className="org-biz-card-list-cta">
          Open dashboard
          <ArrowUpRight className="size-4" strokeWidth={2.25} aria-hidden />
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={dashboardHref}
      className="org-biz-card org-biz-card--grid group outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/35 focus-visible:ring-offset-2"
      aria-label={cardAriaLabel}
    >
      <div className="org-biz-card-inner">
        {/* --- Profile + name identity (fixed avatar, no hover motion) --- */}
        <div className="org-biz-card-head">
          <div className="org-biz-card-identity">
            <span
              className={`org-biz-card-avatar${logoSrc ? "" : " org-biz-card-avatar--placeholder"}`}
              aria-hidden={!logoSrc}
            >
              {logoMark}
            </span>
            <div className="org-biz-card-main">
              <span className="org-biz-card-name-label">Name</span>
              <h2 className="org-biz-card-title">{name}</h2>
            </div>
          </div>
          {isReady ? (
            <span className="org-biz-card-status org-biz-card-status--ready">
              <Check className="size-3" strokeWidth={2.75} aria-hidden />
              Ready
            </span>
          ) : (
            <span className="org-biz-card-status">
              <Clock className="size-3" strokeWidth={2.5} aria-hidden />
              In setup
            </span>
          )}
        </div>

        <div className="org-biz-card-content">
          {/* --- Equal info tiles: setup + location --- */}
          <div className="org-biz-card-bento">
            <BusinessProfileSetupPopover setup={setup}>
              <div className="org-biz-card-progress-row">
                <div className="org-biz-card-progress-copy">
                  <span className="org-biz-card-bento-eyebrow">Profile setup</span>
                  <p className="org-biz-card-setup-pct">{progress}%</p>
                  <p className="org-biz-card-setup-status">{setupStatusText}</p>
                </div>
                <div
                  className="org-biz-card-progress-ring"
                  aria-hidden
                  data-complete={isReady ? "true" : undefined}
                >
                  <svg viewBox="0 0 44 44" className="org-biz-card-progress-svg">
                    <circle
                      className="org-biz-card-progress-ring-track"
                      cx="22"
                      cy="22"
                      r={circleRadius}
                      fill="none"
                      strokeWidth="2.75"
                    />
                    <circle
                      className="org-biz-card-progress-ring-fill"
                      cx="22"
                      cy="22"
                      r={circleRadius}
                      fill="none"
                      strokeWidth="2.75"
                      strokeDasharray={circleCircumference}
                      strokeDashoffset={circleOffset}
                      strokeLinecap="round"
                      transform="rotate(-90 22 22)"
                    />
                  </svg>
                </div>
              </div>
            </BusinessProfileSetupPopover>

            <div
              className="org-biz-card-bento-cell org-biz-card-location-tile"
              title={fullAddress || undefined}
            >
              <div className="org-biz-card-location-copy">
                <span className="org-biz-card-bento-eyebrow">
                  <MapPin className="size-3" strokeWidth={2.5} aria-hidden />
                  Location
                </span>
                <p className="org-biz-card-location-value">
                  <span className="org-biz-card-location-city">{cityLabel}</span>
                </p>
              </div>
              <span className="org-biz-card-location-meta">
                <Building2 className="size-3 shrink-0" strokeWidth={2.25} aria-hidden />
                {branchLabel}
              </span>
            </div>
          </div>

          <div className="org-biz-card-footer org-biz-card-footer--bento">
            <span className="org-biz-card-cta">
              Open dashboard
              <ArrowUpRight className="size-4" strokeWidth={2.25} aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
