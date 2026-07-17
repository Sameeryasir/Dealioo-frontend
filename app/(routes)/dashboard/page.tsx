"use client";

import BusinessDashboardCard from "@/app/components/BusinessDashboardCard";
import { OrgDashboardHeroIllustration } from "@/app/components/OrgDashboardHeroIllustration";
import { StarterPlanLimitDialog } from "@/app/components/StarterPlanLimitDialog";
import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import {
  BusinessCardSkeleton,
  SkeletonGrid,
} from "@/app/components/skeleton";
import { useMyBusinessesQuery } from "@/app/hooks/use-my-businesses-query";
import { useMyUserSubscription } from "@/app/hooks/use-my-user-subscription";
import { isInvitedTeamUser } from "@/app/lib/is-invited-team-user";
import { isStarterBusinessLimitReachedForSubscription } from "@/app/lib/plan-limits";
import { getSetupUser } from "@/app/lib/setup-user";
import { getUserRoleLabel } from "@/app/lib/user-role-label";
import { MY_BUSINESSES_PAGE_SIZE } from "@/app/services/business/get-my-business";
import { AlertCircle, Filter, Megaphone, Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [starterLimitOpen, setStarterLimitOpen] = useState(false);
  const [planCheckError, setPlanCheckError] = useState<string | null>(null);

  const [canAddBusiness, setCanAddBusiness] = useState(true);

  useEffect(() => {
    setIsClient(true);
    setUserName(getSetupUser()?.name ?? null);
    setUserRole(getUserRoleLabel());
    // Invited Manager/Staff join an existing business — they must not start owner onboarding.
    setCanAddBusiness(!isInvitedTeamUser());
  }, []);

  const {
    data: businesses,
    meta,
    isLoading,
    isFetching,
    error: errorMessage,
    refetch: loadBusinesses,
  } = useMyBusinessesQuery({ page });

  // If a business was deleted and fewer pages remain, snap back to a valid page.
  useEffect(() => {
    if (meta.totalPages > 0 && page > meta.totalPages) {
      setPage(meta.totalPages);
    }
  }, [meta.totalPages, page]);

  const {
    subscription,
    isLoading: subscriptionLoading,
    isFetching: subscriptionFetching,
    isFetched: subscriptionFetched,
    isSuccess: subscriptionSuccess,
    isError: subscriptionIsError,
    error: subscriptionError,
    refetch: refetchSubscription,
  } = useMyUserSubscription();

  const sortedBusinesses = useMemo(() => {
    const copy = [...businesses];
    copy.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
    return copy;
  }, [businesses]);

  const isBusinessListLoading =
    businesses.length === 0 && (isLoading || isFetching) && !errorMessage;
  const showSkeleton = !isClient || isBusinessListLoading;
  const hasAnyBusinesses = meta.total > 0;
  const showToolbar = !errorMessage;
  const checkingPlan = subscriptionLoading || subscriptionFetching;

  const handleAddBusiness = useCallback(async () => {
    setPlanCheckError(null);

    if (subscriptionIsError && !subscriptionSuccess) {
      setPlanCheckError(
        subscriptionError ??
          "Could not verify your plan. Try again before adding a business.",
      );
      return;
    }

    let currentSubscription = subscription;
    if (!subscriptionFetched) {
      const result = await refetchSubscription();
      if (result.error || result.isError) {
        setPlanCheckError(
          result.error instanceof Error
            ? result.error.message
            : "Could not verify your plan. Try again before adding a business.",
        );
        return;
      }
      currentSubscription = result.data ?? null;
    }

    if (
      isStarterBusinessLimitReachedForSubscription(
        currentSubscription,
        meta.total,
      )
    ) {
      setStarterLimitOpen(true);
      return;
    }

    router.push("/business/register");
  }, [
    meta.total,
    refetchSubscription,
    router,
    subscription,
    subscriptionError,
    subscriptionFetched,
    subscriptionIsError,
    subscriptionSuccess,
  ]);

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
                      <span>{userRole ?? "Your workspace"}</span>
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

                {canAddBusiness ? (
                  <div className="org-dashboard-panel-controls">
                    <button
                      type="button"
                      onClick={() => void handleAddBusiness()}
                      disabled={checkingPlan && subscription == null}
                      aria-busy={checkingPlan && subscription == null}
                      className="org-dashboard-add-btn cursor-pointer disabled:cursor-wait disabled:opacity-70"
                    >
                      <Plus className="size-4" strokeWidth={2.25} aria-hidden />
                      {checkingPlan && subscription == null
                        ? "Checking plan…"
                        : "Add business"}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {planCheckError ? (
              <div
                className="mx-4 mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6"
                role="alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p>{planCheckError}</p>
                  <button
                    type="button"
                    className="mt-2 text-sm font-semibold text-red-800 underline"
                    onClick={() => {
                      setPlanCheckError(null);
                      void refetchSubscription();
                    }}
                  >
                    Retry plan check
                  </button>
                </div>
              </div>
            ) : null}

            <div className="org-dashboard-panel-body">
              {showSkeleton ? (
                <SkeletonGrid
                  count={3}
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
              ) : isClient && !hasAnyBusinesses ? (
                <div className="org-dashboard-first-run">
                  <div className="org-dashboard-first-run-copy org-dashboard-first-run-copy--solo">
                    {canAddBusiness ? (
                      <>
                        <p className="org-dashboard-first-run-title">
                          Start with your first business
                        </p>
                        <p className="org-dashboard-first-run-text">
                          Use Add business above to register your first location and unlock
                          campaigns, deal funnels, QR tracking, and customer growth tools.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="org-dashboard-first-run-title">
                          Waiting for business access
                        </p>
                        <p className="org-dashboard-first-run-text">
                          Accept your invitation link, then refresh this page to open the
                          business you were invited to.
                        </p>
                      </>
                    )}
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
                        limit={meta.limit || MY_BUSINESSES_PAGE_SIZE}
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

      <StarterPlanLimitDialog
        open={starterLimitOpen}
        onClose={() => setStarterLimitOpen(false)}
        onViewPlans={() => {
          setStarterLimitOpen(false);
          window.location.assign("/dashboard/upgrade-plan");
        }}
      />
    </section>
  );
}
