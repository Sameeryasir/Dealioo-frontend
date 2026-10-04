"use client";

import { useCallback, useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import { BusinessSetupPopover } from "@/app/components/business/BusinessSetupPopover";
import { DeleteConfirmationDialog } from "@/app/components/shared/DeleteConfirmationDialog";
import { getBusinessSetup } from "@/app/lib/business-setup";
import { isScannerUser } from "@/app/lib/is-scanner-user";
import { useBusinessMembershipPermissions } from "@/app/hooks/use-business-membership-permissions";
import { BusinessProfileImage } from "@/app/components/business/BusinessProfileImage";
import { businessQueryKeys } from "@/app/services/business/business-query-keys";
import { deleteBusiness } from "@/app/services/business/delete-business";
import type { AdminBusiness } from "@/app/services/business/get-my-business";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Building2,
  Loader2,
  MapPin,
  Settings,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Props = {
  business: AdminBusiness;
  layout?: "grid" | "list";
  accentIndex?: number;
};

function normalizeHexColor(
  value: string | null | undefined,
  fallback: string,
): string {
  const raw = value?.trim() ?? "";
  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) return raw.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(raw)) {
    const [r, g, b] = raw.slice(1);
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return fallback;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function BusinessDashboardCard({
  business,
  layout = "grid",
  accentIndex = 0,
}: Props) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { name, branchCount, city, state, country, logoUrl, id } = business;

  const logoPrimary = normalizeHexColor(
    business.logoPrimaryColor,
    "#1877F2",
  );
  const locationPinShadow = hexToRgba(logoPrimary, 0.35);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [ringReady, setRingReady] = useState(false);

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
  const locationDisplayLabel =
    cityLabel.length > 10 ? `${cityLabel.slice(0, 10)}…` : cityLabel;
  const businessId =
    typeof id === "number" && id >= 1 ? id : null;
  const { access, role: membershipRole, isFetched } =
    useBusinessMembershipPermissions(businessId);
  const setup = getBusinessSetup(business);
  const progress = setup.progressPercent;
  const isReady = setup.isComplete;
  const statusLabel = isReady
    ? "Ready"
    : progress >= 50
      ? "In progress"
      : "Needs setup";
  const statusClass = isReady
    ? "org-biz-card-status--ready"
    : progress >= 50
      ? "org-biz-card-status--active"
      : "org-biz-card-status--needs-setup";

  const isBusinessOwner =
    business.isOwner === true ||
    access === "owner" ||
    access === "super_admin";
  const invitedRoleLabel = (() => {
    if (!isFetched || isBusinessOwner || access !== "member") return null;
    const role = membershipRole?.trim();
    if (!role) return null;
    const normalized = role.toLowerCase();
    if (
      normalized !== "manager" &&
      normalized !== "staff" &&
      normalized !== "scanner"
    ) {
      return null;
    }
    return role;
  })();

  const canDelete =
    businessId != null &&
    !isScannerUser() &&
    (business.isOwner === true ||
      (isFetched && (access === "owner" || access === "super_admin")));

  const dashboardHref =
    businessId != null
      ? isScannerUser()
        ? `/business/${businessId}/dashboard/scanning`
        : `/business/${businessId}/dashboard`
      : "/dashboard";

  const branches = branchCount ?? 0;
  const branchLabel =
    branches === 1 ? "1 branch" : `${branches} branches`;

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setRingReady(true);
      return;
    }

    let innerFrame = 0;
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => setRingReady(true));
    });
    return () => {
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
    };
  }, []);

  const displayProgress = Math.min(100, Math.max(0, Math.round(progress)));
  const ringView = 96;
  const ringCenter = ringView / 2;
  const circleRadius = 38;
  const circleStroke = 7;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const circleOffset = ringReady
    ? circleCircumference - (displayProgress / 100) * circleCircumference
    : circleCircumference;
  const ringComplete = displayProgress >= 100;

  const setupStatusText = `${setup.completedCount} of ${setup.totalCount} complete`;
  const enterDelayMs = Math.min(accentIndex, 8) * 45;

  const cardAriaLabel = `${name}${isReady ? ", ready" : ", in setup"}. Open dashboard.`;

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
        <div
          className="org-biz-card org-biz-card--list org-biz-card--with-delete group relative"
        >
          <Link
            href={dashboardHref}
            className="org-biz-card-link-fill outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/35 focus-visible:ring-offset-2"
            aria-label={cardAriaLabel}
          >
            <BusinessProfileImage src={logoUrl} variant="list" />

            <span className="org-biz-card-list-main">
              <span className="org-biz-card-list-top">
                <span className="org-biz-card-title">{name}</span>
                {invitedRoleLabel ? (
                  <span className="org-biz-card-role" title="Your role">
                    {invitedRoleLabel}
                  </span>
                ) : null}
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
      <div
        className="org-biz-card org-biz-card--grid org-biz-card--with-delete group relative outline-none"
        style={{ animationDelay: `${enterDelayMs}ms` }}
      >
        <div className="org-biz-card-inner">
          <div className="org-biz-card-head">
            <Link
              href={dashboardHref}
              className="org-biz-card-identity min-w-0 flex-1 no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/35 focus-visible:ring-offset-2"
              aria-label={cardAriaLabel}
            >
              <BusinessProfileImage
                src={logoUrl}
                variant="grid"
                aria-hidden={Boolean(logoUrl?.trim())}
              />
              <div className="org-biz-card-main">
                <div className="org-biz-card-title-row">
                  <h2 className="org-biz-card-title">{name}</h2>
                  <span className={`org-biz-card-status ${statusClass}`}>
                    <span className="org-biz-card-status-dot" aria-hidden />
                    {statusLabel}
                  </span>
                  {invitedRoleLabel ? (
                    <span className="org-biz-card-role" title="Your role">
                      {invitedRoleLabel}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
            <div className="org-biz-card-head-actions">{deleteButton}</div>
          </div>

          <div className="org-biz-card-content">
            <div className="org-biz-card-bento">
              <BusinessSetupPopover
                setup={setup}
                canManageSetup={isBusinessOwner}
              >
                <span className="org-biz-card-bento-eyebrow">
                  <Settings className="size-3" strokeWidth={2.5} aria-hidden />
                  Business setup
                </span>
                <div className="org-biz-card-progress-row">
                  <div
                    className="org-biz-card-progress-ring"
                    data-complete={ringComplete ? "true" : undefined}
                    data-ready={ringReady ? "true" : undefined}
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
                    {isBusinessOwner && setup.nextRecommendedStep ? (
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
                    <div
                      className="org-biz-card-setup-segments"
                      aria-hidden
                    >
                      {Array.from({ length: setup.totalCount }).map(
                        (_, index) => (
                          <span
                            key={index}
                            className="org-biz-card-setup-segment"
                            data-done={
                              index < setup.completedCount
                                ? "true"
                                : undefined
                            }
                          />
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </BusinessSetupPopover>

              <Link
                href={dashboardHref}
                className="org-biz-card-bento-cell org-biz-card-location-tile no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/35 focus-visible:ring-offset-2"
                title={fullAddress || undefined}
                aria-label={cardAriaLabel}
                style={
                  {
                    ["--biz-loc-primary"]: logoPrimary,
                    ["--biz-loc-pin"]: logoPrimary,
                    ["--biz-loc-pin-shadow"]: locationPinShadow,
                  } as CSSProperties
                }
              >
                <div className="org-biz-card-location-body">
                  <div className="org-biz-card-location-copy">
                    <span className="org-biz-card-bento-eyebrow org-biz-card-location-eyebrow">
                      <MapPin className="size-3" strokeWidth={2.5} aria-hidden />
                      Location
                    </span>
                    <p className="org-biz-card-location-value">
                      <span className="org-biz-card-location-city">
                        {locationDisplayLabel}
                      </span>
                    </p>
                    <span className="org-biz-card-location-meta">
                      <Building2
                        className="size-3 shrink-0"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                      <span>{branchLabel}</span>
                    </span>
                  </div>
                  <div className="org-biz-card-location-map" aria-hidden>
                    <svg
                      viewBox="0 0 96 80"
                      className="org-biz-card-location-map-svg"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <linearGradient
                          id={`org-biz-map-base-${businessId ?? "x"}`}
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#E8EEE6" />
                          <stop offset="45%" stopColor="#F0EDE6" />
                          <stop offset="100%" stopColor="#E6EAF0" />
                        </linearGradient>
                        <filter
                          id={`org-biz-map-soft-${businessId ?? "x"}`}
                          x="-20%"
                          y="-20%"
                          width="140%"
                          height="140%"
                        >
                          <feGaussianBlur stdDeviation="0.6" />
                        </filter>
                      </defs>
                      <rect
                        width="96"
                        height="80"
                        rx="12"
                        fill={`url(#org-biz-map-base-${businessId ?? "x"})`}
                      />
                      <path
                        d="M-4 18 C18 10, 34 28, 52 22 S86 8, 100 16 L100 -4 L-4 -4 Z"
                        fill="#C8DDB8"
                        opacity="0.85"
                      />
                      <path
                        d="M-4 72 C22 60, 40 78, 62 68 S90 74, 100 66 L100 84 L-4 84 Z"
                        fill="#BFD4AE"
                        opacity="0.75"
                      />
                      <rect x="8" y="10" width="14" height="11" rx="1.5" fill="#D9D2C5" />
                      <rect x="24" y="8" width="10" height="14" rx="1.5" fill="#CFC7B8" />
                      <rect x="52" y="6" width="16" height="12" rx="1.5" fill="#D6CFC0" />
                      <rect x="70" y="9" width="12" height="10" rx="1.5" fill="#CBC3B4" />
                      <rect x="6" y="40" width="12" height="14" rx="1.5" fill="#D2CBBC" />
                      <rect x="20" y="44" width="14" height="10" rx="1.5" fill="#C8C0B1" />
                      <rect x="58" y="42" width="11" height="13" rx="1.5" fill="#D4CDBE" />
                      <rect x="72" y="46" width="16" height="12" rx="1.5" fill="#CFC7B8" />
                      <rect x="48" y="58" width="13" height="10" rx="1.5" fill="#D9D2C5" />
                      <ellipse
                        cx="78"
                        cy="28"
                        rx="9"
                        ry="6"
                        fill="#A8C9E8"
                        opacity="0.7"
                        filter={`url(#org-biz-map-soft-${businessId ?? "x"})`}
                      />
                      <path d="M-6 30 H102" stroke="#C5C0B5" strokeWidth="9" />
                      <path d="M-6 30 H102" stroke="#FFFFFF" strokeWidth="6.5" />
                      <path
                        d="M-6 30 H102"
                        stroke="#E8E4DC"
                        strokeWidth="1.2"
                        strokeDasharray="3.5 3"
                        strokeLinecap="round"
                        opacity="0.9"
                      />
                      <path d="M34 -6 V86" stroke="#C5C0B5" strokeWidth="8" />
                      <path d="M34 -6 V86" stroke="#FFFFFF" strokeWidth="5.5" />
                      <path
                        d="M34 -6 V86"
                        stroke="#E8E4DC"
                        strokeWidth="1.1"
                        strokeDasharray="3 2.8"
                        strokeLinecap="round"
                        opacity="0.85"
                      />
                      <path d="M-6 54 H102" stroke="#C9C4B9" strokeWidth="6" />
                      <path d="M-6 54 H102" stroke="#FAFAF8" strokeWidth="4" />
                      <path d="M62 -4 V86" stroke="#CAC5BA" strokeWidth="5" />
                      <path d="M62 -4 V86" stroke="#FAFAF8" strokeWidth="3.2" />
                      <path d="M-4 16 H28" stroke="#BDB8AD" strokeWidth="3.5" />
                      <path d="M-4 16 H28" stroke="#FFFFFF" strokeWidth="2" />
                      <path d="M68 18 H100" stroke="#BDB8AD" strokeWidth="3.5" />
                      <path d="M68 18 H100" stroke="#FFFFFF" strokeWidth="2" />
                      <path d="M4 66 H46" stroke="#BDB8AD" strokeWidth="3.2" />
                      <path d="M4 66 H46" stroke="#FFFFFF" strokeWidth="1.8" />
                      <circle cx="34" cy="30" r="7" fill="#F97316" opacity="0.18" />
                    </svg>
                    <span className="org-biz-card-location-map-pin">
                      <MapPin
                        className="size-5"
                        strokeWidth={2.5}
                        fill="currentColor"
                      />
                      <span
                        className="org-biz-card-location-map-pin-dot"
                        aria-hidden
                      />
                    </span>
                  </div>
                </div>
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
