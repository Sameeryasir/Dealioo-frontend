"use client";

import AddBusinessCard from "@/app/components/AddBusinessCard";
import { OrgDashboardHeroIllustration } from "@/app/components/OrgDashboardHeroIllustration";
import RestaurantDashboardCard from "@/app/components/RestaurantDashboardCard";
import SearchBar from "@/app/components/SearchBar";
import SearchNoMatchFound from "@/app/components/SearchNoMatchFound";
import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import {
  RestaurantCardSkeleton,
  SkeletonGrid,
} from "@/app/components/skeleton";
import { useMyRestaurantsQuery } from "@/app/hooks/use-my-restaurants-query";
import { getSetupUser } from "@/app/lib/setup-user";
import { MY_RESTAURANTS_PAGE_SIZE } from "@/app/services/restaurant/get-my-restaurant";
import { Filter, Megaphone, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const WORKSPACE_FEATURES = [
  { label: "Campaigns", icon: Megaphone, tone: "blue" },
  { label: "Funnels", icon: Filter, tone: "pink" },
  { label: "Customers", icon: Users, tone: "green" },
] as const;

function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

function firstName(fullName: string | null | undefined): string {
  const trimmed = fullName?.trim();
  if (!trimmed) return "There";
  const name = trimmed.split(/\s+/)[0] ?? "There";
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [page, setPage] = useState(1);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setUserName(getSetupUser()?.name ?? null);
    });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const {
    data: restaurants,
    meta,
    isPending,
    isFetching,
    error: errorMessage,
    refetch: loadRestaurants,
  } = useMyRestaurantsQuery({ page, search: debouncedSearch });

  const sortedRestaurants = useMemo(() => {
    const copy = [...restaurants];
    copy.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
    return copy;
  }, [restaurants]);

  const showSkeleton = isPending && restaurants.length === 0;
  const hasAnyRestaurants = meta.total > 0 || debouncedSearch.length > 0;
  const showToolbar = !showSkeleton && !errorMessage;

  const businessCountLabel =
    meta.total === 1 ? "1 business" : `${meta.total} businesses`;

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
                    <span className="org-dashboard-panel-count">
                      <span className="org-dashboard-panel-count-dot" aria-hidden />
                      {businessCountLabel}
                    </span>
                  </div>
                </div>

                <div className="org-dashboard-panel-controls">
                  <SearchBar
                    id="dashboard-search"
                    variant="dashboard"
                    className="org-dashboard-search"
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search businesses…"
                  />
                </div>
              </div>
            ) : null}

            <div className="org-dashboard-panel-body">
              {showSkeleton ? (
                <SkeletonGrid
                  className="org-dashboard-grid org-dashboard-grid--cards grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
                  Card={RestaurantCardSkeleton}
                />
              ) : errorMessage ? (
                <AsyncErrorRetry
                  layout="inline"
                  title="Something went wrong"
                  message={errorMessage}
                  onRetry={() => loadRestaurants()}
                />
              ) : !hasAnyRestaurants && !debouncedSearch.trim() ? (
                <div className="org-dashboard-first-run">
                  <AddBusinessCard layout="grid" />
                  <div className="org-dashboard-first-run-copy">
                    <p className="org-dashboard-first-run-title">Start with your first business</p>
                    <p className="org-dashboard-first-run-text">
                      Add your first business or location to unlock campaigns,
                      deal funnels, QR tracking, and customer growth tools.
                    </p>
                  </div>
                </div>
              ) : restaurants.length === 0 ? (
                <div className="org-dashboard-empty org-dashboard-empty--compact">
                  <SearchNoMatchFound className="py-6" />
                </div>
              ) : (
                <>
                  <div className="org-dashboard-grid org-dashboard-grid--cards grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {sortedRestaurants.map((r, index) => (
                      <RestaurantDashboardCard
                        key={r.id ?? `restaurant-${index}`}
                        restaurant={r}
                        layout="grid"
                        accentIndex={index}
                      />
                    ))}
                    <AddBusinessCard layout="grid" />
                  </div>

                  {meta.totalPages > 1 ? (
                    <div className="org-dashboard-pagination">
                      <OffsetPagination
                        page={meta.page}
                        totalPages={meta.totalPages}
                        total={meta.total}
                        limit={MY_RESTAURANTS_PAGE_SIZE}
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
