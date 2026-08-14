"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { BusinessSetupPopover } from "@/app/components/business/BusinessSetupPopover";
import { DeleteConfirmationDialog } from "@/app/components/shared/DeleteConfirmationDialog";
import { getBusinessSetup } from "@/app/lib/business-setup";
import { isScannerUser } from "@/app/lib/is-scanner-user";
import { useBusinessMembershipPermissions } from "@/app/hooks/use-business-membership-permissions";
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
  UserCog,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { name, branchCount, city, state, country, logoUrl, id } = business;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isCountingProgress, setIsCountingProgress] = useState(true);

  const fullAddress = [city, state, country].filter(Boolean).join(", ");
  const cityState = [city, state]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" / ");
  const countryLabel = country?.trim() ?? "";
  const cityLabel = cityState
    ? countryLabel
      ? `${cityState}, ${countryLabel}`
      : cityState
    : countryLabel || "Add location";
  const logoSrc = resolveUploadImageUrl(logoUrl);
  const businessId =
    typeof id === "number" && id >= 1 ? id : null;
  const { access, isFetched } = useBusinessMembershipPermissions(businessId);
  const canDelete =
    businessId != null &&
    !isScannerUser() &&
    isFetched &&
    (access === "owner" || access === "super_admin");
  const dashboardHref =
    businessId != null
      ? isScannerUser()
        ? `/business/${businessId}/dashboard/scanning`
        : `/business/${businessId}/dashboard`
      : "/dashboard";

  const branches = branchCount ?? 0;
  const branchLabel =
    branches === 1 ? "1 branch" : `${branches} branches`;

  const setup = getBusinessSetup(business);
  const progress = setup.progressPercent;
  const isReady = setup.isComplete;

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
    : `${setup.completedCount} of ${setup.totalCount} complete`;

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
                <div className="org-biz-card-title-row">
                  <h2 className="org-biz-card-title">{name}</h2>
                  <span className="org-biz-card-status org-biz-card-status--active">
                    <span className="org-biz-card-status-dot" aria-hidden />
                    Active
                  </span>
                </div>
              </div>
            </Link>
            <div className="org-biz-card-head-actions">{deleteButton}</div>
          </div>

          <div className="org-biz-card-content">
            <div className="org-biz-card-bento">
              <BusinessSetupPopover setup={setup}>
                <span className="org-biz-card-bento-eyebrow">
                  <UserCog className="size-3" strokeWidth={2.5} aria-hidden />
                  Business setup
                </span>
                <div className="org-biz-card-progress-row">
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
                          <stop offset="0%" stopColor="#1877f2" />
                          <stop offset="55%" stopColor="#833aba" />
                          <stop offset="100%" stopColor="#ea5a8f" />
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
                  <div className="org-biz-card-progress-copy">
                    <p className="org-biz-card-setup-status">{setupStatusText}</p>
                    {!isCountingProgress && setup.nextRecommendedStep ? (
                      <button
                        type="button"
                        data-setup-next
                        className="org-biz-card-setup-next-btn"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          router.push(setup.nextRecommendedStep!.href);
                        }}
                      >
                        Next: {setup.nextRecommendedStep.ctaLabel}
                      </button>
                    ) : null}
                  </div>
                </div>
              </BusinessSetupPopover>

              <Link
                href={dashboardHref}
                className="org-biz-card-bento-cell org-biz-card-location-tile no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/35 focus-visible:ring-offset-2"
                title={fullAddress || undefined}
                aria-label={cardAriaLabel}
              >
                <div className="org-biz-card-location-copy">
                  <span className="org-biz-card-bento-eyebrow org-biz-card-location-eyebrow">
                    <MapPin className="size-3" strokeWidth={2.5} aria-hidden />
                    Location
                  </span>
                  <p className="org-biz-card-location-value">
                    <span className="org-biz-card-location-city">{cityLabel}</span>
                  </p>
                </div>
                <span className="org-biz-card-location-meta">
                  <Building2
                    className="size-3 shrink-0"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <span>{branchLabel}</span>
                </span>
              </Link>
            </div>

            <Link
              href={dashboardHref}
              className="org-biz-card-footer org-biz-card-footer--bento no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/35 focus-visible:ring-offset-2"
              aria-label={cardAriaLabel}
            >
              <span className="org-biz-card-cta">
                Open dashboard
                <ArrowUpRight className="size-4" strokeWidth={2.25} aria-hidden />
              </span>
            </Link>
          </div>
        </div>
      </div>
      {confirmDialog}
    </>
  );
}
