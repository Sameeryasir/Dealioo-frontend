"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { BusinessProfileSetupPopover } from "@/app/components/business/BusinessProfileSetupPopover";
import { DeleteConfirmationDialog } from "@/app/components/shared/DeleteConfirmationDialog";
import { getBusinessProfileSetup } from "@/app/lib/business-profile-setup";
import { isScannerUser } from "@/app/lib/is-scanner-user";
import {
  resolveUploadImageUrl,
  spacesImageLoadProps,
} from "@/app/lib/resolve-upload-image-url";
import { businessQueryKeys } from "@/app/services/business/business-query-keys";
import { deleteBusiness } from "@/app/services/business/delete-business";
import type { AdminBusiness } from "@/app/services/business/get-my-business";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Building2,
  ImageIcon,
  Loader2,
  MapPin,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type Props = {
  business: AdminBusiness;
  layout?: "grid" | "list";
  accentIndex?: number;
};

export default function BusinessDashboardCard({
  business,
  layout = "grid",
}: Props) {
  const queryClient = useQueryClient();
  const { name, branchCount, city, state, country, logoUrl, id } = business;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // --- Progress count-up (animate % + ring when the card loads) ---
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isCountingProgress, setIsCountingProgress] = useState(true);

  const fullAddress = [city, state, country].filter(Boolean).join(", ");
  const cityLabel =
    [city, state]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(" / ") || "Add location";
  const logoSrc = resolveUploadImageUrl(logoUrl);
  const businessId =
    typeof id === "number" && id >= 1 ? id : null;
  const canDelete = businessId != null && !isScannerUser();
  const dashboardHref =
    businessId != null
      ? isScannerUser()
        ? `/business/${businessId}/dashboard/scanning`
        : `/business/${businessId}/dashboard`
      : "/dashboard";

  const branches = branchCount ?? 0;
  const branchLabel =
    branches === 1 ? "1 branch" : `${branches} branches`;

  const setup = getBusinessProfileSetup(business);
  const progress = setup.progressPercent;
  const remainingSteps = Math.max(0, setup.totalCount - setup.completedCount);
  const isReady = progress >= 100;

  // Count the % from 0 → target so users see progress being calculated on load
  useEffect(() => {
    const target = Math.min(100, Math.max(0, Math.round(progress)));
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setDisplayProgress(target);
      setIsCountingProgress(false);
      return;
    }

    setDisplayProgress(0);
    setIsCountingProgress(true);

    const durationMs = 750 + target * 5;
    const startMs = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startMs) / durationMs);
      // Ease-out so the last numbers settle smoothly
      const eased = 1 - (1 - t) ** 3;
      setDisplayProgress(Math.round(eased * target));
      if (t < 1) {
        frameId = requestAnimationFrame(tick);
        return;
      }
      setDisplayProgress(target);
      setIsCountingProgress(false);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [progress]);

  /* Higher SVG resolution = smoother anti-aliased ring when scaled down */
  const ringView = 96;
  const ringCenter = ringView / 2;
  const circleRadius = 38;
  const circleStroke = 7;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const circleOffset =
    circleCircumference -
    (Math.min(100, Math.max(0, displayProgress)) / 100) * circleCircumference;
  const ringComplete = displayProgress >= 100;

  const setupStatusText = isCountingProgress
    ? "Calculating…"
    : isReady
      ? `${setup.completedCount} steps completed`
      : remainingSteps === 1
        ? "1 step left"
        : `${remainingSteps} steps left`;

  const cardAriaLabel = `${name}${isReady ? ", ready" : ", in setup"}. Open dashboard.`;

  const logoMark = logoSrc ? (
    // eslint-disable-next-line @next/next/no-img-element
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

  const openDeleteConfirm = useCallback((event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setConfirmOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (businessId == null) return;
    setDeleting(true);
    try {
      await deleteBusiness(businessId);
      setConfirmOpen(false);
      toast.success(`“${name}” was deleted.`);
      await queryClient.invalidateQueries({
        queryKey: businessQueryKeys.myLists(),
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not delete this business.",
      );
    } finally {
      setDeleting(false);
    }
  }, [businessId, name, queryClient]);

  const deleteButton = canDelete ? (
    <button
      type="button"
      className="org-biz-card-delete"
      aria-label={`Delete ${name}`}
      title="Delete business"
      onClick={openDeleteConfirm}
      disabled={deleting}
    >
      {deleting ? (
        <Loader2 className="size-4 animate-spin" strokeWidth={2.5} />
      ) : (
        <Trash2 className="size-4" strokeWidth={2.5} />
      )}
    </button>
  ) : null;

  const confirmDialog = (
    <DeleteConfirmationDialog
      open={confirmOpen}
      itemName={name}
      title="Delete this business?"
      description={
        <>
          This permanently deletes{" "}
          <span className="font-semibold text-[#1877f2]">{name}</span>, including
          its locations, campaigns, funnels, and customer data. This cannot be
          undone.
        </>
      }
      confirmText="Delete business"
      checkboxLabel={`Are you sure you want to delete ${name}?`}
      isLoading={deleting}
      onConfirm={() => {
        void handleDelete();
      }}
      onCancel={() => {
        if (!deleting) setConfirmOpen(false);
      }}
    />
  );

  if (layout === "list") {
    return (
      <>
        <div className="org-biz-card org-biz-card--list org-biz-card--with-delete group relative">
          <Link
            href={dashboardHref}
            className="org-biz-card-link-fill outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/35 focus-visible:ring-offset-2"
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
          {deleteButton ? (
            <span className="org-biz-card-head-actions org-biz-card-list-delete">
              {deleteButton}
            </span>
          ) : null}
        </div>
        {confirmDialog}
      </>
    );
  }

  return (
    <>
      <div className="org-biz-card org-biz-card--grid org-biz-card--with-delete group relative outline-none">
        <div className="org-biz-card-inner">
          <div className="org-biz-card-head">
            <Link
              href={dashboardHref}
              className="org-biz-card-identity min-w-0 flex-1 no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/35 focus-visible:ring-offset-2"
              aria-label={cardAriaLabel}
            >
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
            </Link>
            <div className="org-biz-card-head-actions">{deleteButton}</div>
          </div>

          <Link
            href={dashboardHref}
            className="org-biz-card-content no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/35 focus-visible:ring-offset-2"
            aria-label={cardAriaLabel}
          >
            <div className="org-biz-card-bento">
              <BusinessProfileSetupPopover setup={setup}>
                <div className="org-biz-card-progress-row">
                  <div className="org-biz-card-progress-copy">
                    <span className="org-biz-card-bento-eyebrow">
                      Profile setup
                    </span>
                    <p className="org-biz-card-setup-status">{setupStatusText}</p>
                  </div>
                  <div
                    className="org-biz-card-progress-ring"
                    data-complete={ringComplete ? "true" : undefined}
                    data-counting={isCountingProgress ? "true" : undefined}
                    aria-label={`${displayProgress}% complete`}
                  >
                    <svg
                      viewBox={`0 0 ${ringView} ${ringView}`}
                      className="org-biz-card-progress-svg"
                      aria-hidden
                    >
                      <defs>
                        <linearGradient
                          id={`org-biz-progress-grad-${businessId ?? "x"}`}
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#1777f2" />
                          <stop offset="100%" stopColor="#1777f2" />
                        </linearGradient>
                      </defs>
                      <circle
                        className="org-biz-card-progress-ring-track"
                        cx={ringCenter}
                        cy={ringCenter}
                        r={circleRadius}
                        fill="none"
                        strokeWidth={circleStroke}
                        strokeLinecap="round"
                      />
                      <circle
                        className="org-biz-card-progress-ring-fill"
                        cx={ringCenter}
                        cy={ringCenter}
                        r={circleRadius}
                        fill="none"
                        stroke={`url(#org-biz-progress-grad-${businessId ?? "x"})`}
                        strokeWidth={circleStroke}
                        strokeDasharray={circleCircumference}
                        strokeDashoffset={circleOffset}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${ringCenter} ${ringCenter})`}
                      />
                    </svg>
                    <span className="org-biz-card-setup-pct" aria-hidden>
                      {displayProgress}%
                    </span>
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
                <span className="org-biz-card-location-meta text-white">
                  <Building2
                    className="size-3 shrink-0 text-white"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <span className="text-white">{branchLabel}</span>
                </span>
              </div>
            </div>

            <div className="org-biz-card-footer org-biz-card-footer--bento">
              <span className="org-biz-card-cta">
                Open dashboard
                <ArrowUpRight className="size-4" strokeWidth={2.25} aria-hidden />
              </span>
            </div>
          </Link>
        </div>
      </div>
      {confirmDialog}
    </>
  );
}
