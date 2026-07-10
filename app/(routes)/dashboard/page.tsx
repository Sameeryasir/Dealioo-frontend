"use client";

import { OrgDashboardHeroIllustration } from "@/app/components/OrgDashboardHeroIllustration";
import BusinessDashboardCard from "@/app/components/BusinessDashboardCard";
import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import {
  BusinessCardSkeleton,
  SkeletonGrid,
} from "@/app/components/skeleton";
import { useMyBusinessesQuery } from "@/app/hooks/use-my-businesses-query";
import { getSetupUser } from "@/app/lib/setup-user";
import { MY_BUSINESSES_PAGE_SIZE } from "@/app/services/business/get-my-business";
import { Filter, Megaphone, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const WORKSPACE_FEATURES = [
  { label: "Campaigns", icon: Megaphone, tone: "blue" },
  { label: "Funnels", icon: Filter, tone: "pink" },
  { label: "Customers", icon: Users, tone: "green" },
] as const;

function firstName(fullName: string | null | undefined): string {
  const trimmed = fullName?.trim();
  if (!trimmed) return "There";
  const name = trimmed.split(/\s+/)[0] ?? "There";
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

export default function DashboardPage() {
  const [page, setPage] = useState(1);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setUserName(getSetupUser()?.name ?? null);
    });
  }, []);

  const {
    data: businesses,
    meta,
    isPending,
    isFetching,
    error: errorMessage,
    refetch: loadBusinesses,
  } = useMyBusinessesQuery({ page });

  const sortedBusinesses = useMemo(() => {
    const copy = [...businesses];
    copy.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
    return copy;
  }, [businesses]);

  const showSkeleton = isPending && businesses.length === 0;
  const hasAnyBusinesses = meta.total > 0;
  const showToolbar = !showSkeleton && !errorMessage;

  return (
    <section className="org-dashboard-section" aria-label="Your businesses">
      <div className="brand-landing-section">
        <div className="org-dashboard-workspace">
          <div className="org-dashboard-stats-banner">
            <div className="org-dashboard-stats-inner">
              <div className="org-dashboard-stats-layout">
                <div className="org-dashboard-stats-main">
                  <div className="org-dashboard-stats-copy">
                    <p className="org-dashboard-stats-pill">
                      <span className="org-dashboard-stats-pill-dot" aria-hidden />
                      <span>Your workspace</span>
                    </p>
                    <h1 className="org-dashboard-stats-title">
                      <span className="org-dashboard-stats-greeting">Welcome back, </span>
                      <span className="org-dashboard-stats-name">{firstName(userName)}</span>
                    </h1>

                    <p className="org-dashboard-stats-intro">
                      Every business and location you&apos;ve added lets you manage
                      campaigns, funnels and customers from one place.
                    </p>

                    <ul className="org-dashboard-stats-features" aria-label="Workspace tools">
                      {WORKSPACE_FEATURES.map((item) => {
                        const Icon = item.icon;
                        return (
                          <li key={item.label}>
                            <span
                              className={`org-dashboard-stats-feature org-dashboard-stats-feature--${item.tone}`}
                            >
                              <Icon className="org-dashboard-stats-feature-icon" strokeWidth={2.25} />
                              {item.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                <div className="org-dashboard-stats-art">
                  <OrgDashboardHeroIllustration />
                </div>
              </div>
            </div>
          </div>

          <div className="org-dashboard-panel">
            {showToolbar ? (
              <div className="org-dashboard-panel-toolbar">
                <div className="org-dashboard-panel-heading">
                  <div className="org-dashboard-panel-title-row">
                    <h2 className="org-dashboard-panel-title">My businesses</h2>
                  </div>
                </div>

                <div className="org-dashboard-panel-controls">
                  <Link
                    href="/business/register"
                    className="org-dashboard-add-btn"
                  >
                    <Plus className="size-4" strokeWidth={2.25} aria-hidden />
                    Add business
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="org-dashboard-panel-body">
              {showSkeleton ? (
                <SkeletonGrid
                  className="org-dashboard-grid org-dashboard-grid--cards grid"
                  Card={BusinessCardSkeleton}
                />
              ) : errorMessage ? (
                <AsyncErrorRetry
                  layout="inline"
                  title="Something went wrong"
                  message={errorMessage}
                  onRetry={() => loadBusinesses()}
                />
              ) : !hasAnyBusinesses ? (
                <div className="org-dashboard-first-run">
                  <div className="org-dashboard-first-run-copy org-dashboard-first-run-copy--solo">
                    <p className="org-dashboard-first-run-title">Start with your first business</p>
                    <p className="org-dashboard-first-run-text">
                      Use Add business above to register your first location and unlock
                      campaigns, deal funnels, QR tracking, and customer growth tools.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="org-dashboard-grid org-dashboard-grid--cards grid">
                    {sortedBusinesses.map((business, index) => (
                      <BusinessDashboardCard
                        key={business.id ?? `business-${index}`}
                        business={business}
                        layout="grid"
                        accentIndex={index}
                      />
                    ))}
                  </div>

                  {meta.totalPages > 1 ? (
                    <div className="org-dashboard-pagination">
                      <OffsetPagination
                        page={meta.page}
                        totalPages={meta.totalPages}
                        total={meta.total}
                        limit={MY_BUSINESSES_PAGE_SIZE}
                        loading={isFetching}
                        onPageChange={setPage}
                        itemLabel="businesses"
                      />
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
