"use client";

import type { AdminRestaurant } from "@/app/services/restaurant/get-my-restaurant";
import { resolveUploadImageUrl, spacesImageLoadProps } from "@/app/lib/resolve-upload-image-url";
import { isScannerUser } from "@/app/lib/is-scanner-user";
import {
  ArrowUpRight,
  Building2,
  MapPin,
  Store,
} from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

type Props = {
  restaurant: AdminRestaurant;
  layout?: "grid" | "list";
  accentIndex?: number;
};

const ACCENT_VARS = [
  "var(--brand-primary)",
  "var(--brand-teal)",
  "var(--brand-coral)",
  "var(--brand-violet)",
] as const;

function setupProgress(restaurant: AdminRestaurant): number {
  let score = 0;
  if (restaurant.city?.trim()) score += 34;
  if ((restaurant.branchCount ?? 0) > 0) score += 33;
  if (restaurant.description?.trim()) score += 33;
  return Math.min(100, score);
}

export default function RestaurantDashboardCard({
  restaurant,
  layout = "grid",
  accentIndex = 0,
}: Props) {
  const {
    name,
    branchCount,
    city,
    state,
    country,
    logoUrl,
  } = restaurant;

  const location = [city, state, country].filter(Boolean).join(", ");
  const logoSrc = resolveUploadImageUrl(logoUrl);
  const dashboardHref =
    typeof restaurant.id === "number" && restaurant.id >= 1
      ? isScannerUser()
        ? `/restaurant/${restaurant.id}/dashboard/scanning`
        : `/restaurant/${restaurant.id}/dashboard`
      : "/dashboard";

  const branchLabel =
    branchCount != null
      ? `${branchCount} ${branchCount === 1 ? "branch" : "branches"}`
      : "No branches yet";

  const progress = setupProgress(restaurant);
  const accent = ACCENT_VARS[accentIndex % ACCENT_VARS.length];
  const statusLabel = progress >= 100 ? "Ready" : "In setup";

  if (layout === "list") {
    return (
      <Link
        href={dashboardHref}
        className="org-biz-card org-biz-card--list group outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
        style={{ "--org-card-accent": accent } as CSSProperties}
      >
        <span className="org-biz-card-thumb">
          {logoSrc ? (
            <img src={logoSrc} alt="" className="h-full w-full object-cover" {...spacesImageLoadProps} />
          ) : (
            <Store className="size-6 text-brand-primary/50" strokeWidth={1.5} aria-hidden />
          )}
        </span>

        <span className="org-biz-card-list-main">
          <span className="org-biz-card-list-top">
            <span className="org-biz-card-title">{name}</span>
            <span
              className={`org-biz-card-status ${
                progress >= 100 ? "org-biz-card-status--ready" : ""
              }`}
            >
              {statusLabel}
            </span>
          </span>
          <span className="org-biz-card-meta-inline">
            <MapPin className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
            {location || "Location not set"}
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
      className="org-biz-card org-biz-card--grid group outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
      style={{ "--org-card-accent": accent } as CSSProperties}
    >
      <div className="org-biz-card-inner">
        <div className="org-biz-card-hero">
          {logoSrc ? (
            <img src={logoSrc} alt="" className="org-biz-card-hero-img" {...spacesImageLoadProps} />
          ) : (
            <span className="org-biz-card-hero-fallback" aria-hidden>
              <Store className="size-8 text-[#93c5fd]" strokeWidth={1.75} />
            </span>
          )}
          <span className="org-biz-card-hero-overlay" aria-hidden />
          <span
            className={`org-biz-card-status org-biz-card-status--hero ${
              progress >= 100 ? "org-biz-card-status--ready" : ""
            }`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="org-biz-card-content">
          <div className="org-biz-card-main">
            <div className="org-biz-card-title-row">
              <h2 className="org-biz-card-title">{name}</h2>
            </div>
          </div>

          <div className="org-biz-card-bento">
            <div className="org-biz-card-bento-cell org-biz-card-progress-wrap">
              <div className="org-biz-card-progress-copy">
                <span className="org-biz-card-bento-eyebrow">Profile setup</span>
                <p className="org-biz-card-setup-status">
                  {progress >= 100 ? "Complete" : `${progress}% done`}
                </p>
              </div>
              <div className="org-biz-card-progress-track" aria-hidden>
                <span
                  className="org-biz-card-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="org-biz-card-bento-cell org-biz-card-location-tile">
              <div className="org-biz-card-location-copy">
                <span className="org-biz-card-bento-eyebrow">Location</span>
                <p className="org-biz-card-location-value">
                  {location || "Add location"}
                </p>
              </div>
              <span className="org-biz-card-location-meta">{branchLabel}</span>
            </div>
          </div>

          <div className="org-biz-card-footer org-biz-card-footer--bento">
            <span className="org-biz-card-cta">
              Open dashboard
              <ArrowUpRight
                className="size-4 transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={2.25}
                aria-hidden
              />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
