"use client";

import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import { Skeleton } from "@/app/components/skeleton";
import {
  formatAbsoluteDate,
  humanizeLabel,
  initialsFromName,
} from "@/app/components/super-admin/super-admin-list-helpers";
import styles from "@/app/components/SuperAdminDashboard.module.css";
import { hasAuthSession } from "@/app/lib/auth-session";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { adminQueryKeys } from "@/app/services/admin/admin-query-keys";
import {
  getAdminSubscriptions,
  type AdminSubscription,
} from "@/app/services/admin/get-admin-subscriptions";
import {
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  CircleDot,
  CreditCard,
  Hash,
  RefreshCw,
  Search,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

const PAGE_SIZE = 10;

function formatMoney(amount: number | null, currency: string): string {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency || "USD"}`;
  }
}

function statusPillClass(status: string): string {
  const key = status.trim().toLowerCase();
  if (key === "active" || key === "trialing") return "";
  if (key === "past_due") return styles.usersDirStatusPillProgress;
  return styles.usersDirStatusPillInactive;
}

function SubscriptionsStatsSkeleton() {
  return (
    <div className={styles.usersDirStats} aria-busy="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <article key={index} className={styles.usersDirStatCard}>
          <div className="w-full space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="size-9 shrink-0 rounded-full" />
        </article>
      ))}
    </div>
  );
}

function SubscriptionsTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <table
      className={styles.usersDirTable}
      aria-busy="true"
      aria-label="Loading subscriptions"
    >
      <thead>
        <tr>
          <th style={{ width: "3rem" }}>
            <Skeleton className="h-3 w-4" />
          </th>
          <th>
            <Skeleton className="h-3 w-16" />
          </th>
          <th>
            <Skeleton className="h-3 w-14" />
          </th>
          <th>
            <Skeleton className="h-3 w-16" />
          </th>
          <th>
            <Skeleton className="h-3 w-14" />
          </th>
          <th>
            <Skeleton className="h-3 w-16" />
          </th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, index) => (
          <tr key={index}>
            <td>
              <Skeleton className="h-4 w-5" />
            </td>
            <td>
              <div className={styles.userCell}>
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className={styles.userCellText}>
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="mt-1.5 h-3 w-28" />
                </div>
              </div>
            </td>
            <td>
              <Skeleton className="h-4 w-24" />
            </td>
            <td>
              <Skeleton className="h-6 w-20 rounded-full" />
            </td>
            <td>
              <Skeleton className="h-4 w-20" />
            </td>
            <td>
              <Skeleton className="h-4 w-20" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function UserAvatar({ name }: { name: string }) {
  return (
    <span className={styles.userAvatar} aria-hidden>
      {initialsFromName(name || "?")}
    </span>
  );
}

function SubscriptionRow({
  subscription,
  rowNumber,
}: {
  subscription: AdminSubscription;
  rowNumber: number;
}) {
  const cycleLabel =
    subscription.billingCycle === "annual" ? "Annual" : "Monthly";
  const amountLabel = formatMoney(
    subscription.amount,
    subscription.currency,
  );

  return (
    <tr>
      <td>
        <span className={styles.usersDirDateMain}>{rowNumber}.</span>
      </td>
      <td>
        <div className={styles.userCell}>
          <UserAvatar name={subscription.user.name} />
          <div className={styles.userCellText}>
            <div className={styles.bizName}>{subscription.user.name}</div>
            <div className={styles.bizMeta}>{subscription.user.email}</div>
          </div>
        </div>
      </td>
      <td>
        <div className={styles.userCellText}>
          <div className={styles.bizName}>{subscription.plan.name}</div>
          <div className={styles.bizMeta}>
            {amountLabel}
            {subscription.amount != null ? ` · ${cycleLabel}` : ""}
            {subscription.cancelAtPeriodEnd ? " · Cancels at period end" : ""}
          </div>
        </div>
      </td>
      <td>
        <span
          className={`${styles.usersDirStatusPill} ${statusPillClass(
            subscription.status,
          )}`}
        >
          <span className={styles.usersDirStatusDot} aria-hidden />
          {humanizeLabel(subscription.status) || "—"}
        </span>
      </td>
      <td>
        <span className={styles.usersDirDateMain}>
          {formatAbsoluteDate(
            subscription.startedAt ?? subscription.createdAt,
          )}
        </span>
      </td>
      <td>
        <span className={styles.usersDirDateMain}>
          {formatAbsoluteDate(subscription.createdAt)}
        </span>
      </td>
    </tr>
  );
}

export function SuperAdminSubscriptionsPanel() {
  const [query, setQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(query.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const subscriptionsQuery = useQuery({
    queryKey: adminQueryKeys.subscriptions(page, debouncedSearch, PAGE_SIZE),
    queryFn: () =>
      getAdminSubscriptions({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
      }),
    enabled: hasAuthSession(),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const items = subscriptionsQuery.data?.items ?? [];
  const meta = subscriptionsQuery.data?.meta;
  const counts = subscriptionsQuery.data?.counts;
  const total = meta?.total ?? 0;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const loading =
    subscriptionsQuery.isLoading || subscriptionsQuery.isFetching;
  const errorMessage = subscriptionsQuery.error
    ? getApiErrorMessage(
        subscriptionsQuery.error,
        "Could not load subscriptions.",
      )
    : null;
  const showingStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const stats = [
    {
      label: "All subscriptions",
      value: counts?.all ?? 0,
      hint: "Every recorded subscription",
      hintMuted: true,
      icon: CreditCard,
      iconBg: "#eff6ff",
      iconColor: "#2563eb",
    },
    {
      label: "Active",
      value: counts?.active ?? 0,
      hint: "Currently paying",
      hintMuted: false,
      icon: CheckCircle2,
      iconBg: "#ecfdf5",
      iconColor: "#059669",
    },
    {
      label: "Trialing",
      value: counts?.trialing ?? 0,
      hint: "On a trial period",
      hintMuted: true,
      icon: CircleDot,
      iconBg: "#f5f3ff",
      iconColor: "#7c3aed",
    },
    {
      label: "Cancelled",
      value: counts?.cancelled ?? 0,
      hint: "Ended subscriptions",
      hintMuted: true,
      icon: XCircle,
      iconBg: "#fef2f2",
      iconColor: "#dc2626",
    },
  ];

  return (
    <section
      className={`${styles.page} ${styles.usersDir} ${styles.usersDirBlackActions}`}
      aria-label="Subscriptions"
    >
      <div className={styles.inner}>
        <div className={styles.usersDirHero}>
          <div className={styles.heroCopy}>
            <h1 className={styles.title}>Subscriptions</h1>
            <p className={styles.subtitle}>
              All customer subscriptions on Dealioo. Search by user, email, or
              plan.
            </p>
          </div>

          <div className={styles.usersDirHeroActions}>
            <label className={styles.searchWrap}>
              <Search className={styles.searchIcon} aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search subscriptions…"
                className={styles.searchInput}
                aria-label="Search subscriptions"
              />
            </label>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => void subscriptionsQuery.refetch()}
              disabled={loading}
              aria-label="Refresh subscriptions"
            >
              <RefreshCw
                className={`size-4 ${loading ? "animate-spin" : ""}`}
                aria-hidden
              />
            </button>
          </div>
        </div>

        {errorMessage ? (
          <div className="mb-4">
            <AsyncErrorRetry
              layout="inline"
              title="Something went wrong"
              message={errorMessage}
              onRetry={() => void subscriptionsQuery.refetch()}
            />
          </div>
        ) : null}

        {loading && !counts ? (
          <SubscriptionsStatsSkeleton />
        ) : (
          <div className={styles.usersDirStats}>
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <article key={stat.label} className={styles.usersDirStatCard}>
                  <div>
                    <p className={styles.usersDirStatLabel}>{stat.label}</p>
                    <p className={styles.usersDirStatValue}>
                      {stat.value.toLocaleString()}
                    </p>
                    <p
                      className={`${styles.usersDirStatHint} ${
                        stat.hintMuted ? styles.usersDirStatHintMuted : ""
                      }`}
                    >
                      {stat.hint}
                    </p>
                  </div>
                  <span
                    className={styles.usersDirStatIcon}
                    style={{ background: stat.iconBg, color: stat.iconColor }}
                    aria-hidden
                  >
                    <Icon className="size-4" strokeWidth={2.25} />
                  </span>
                </article>
              );
            })}
          </div>
        )}

        <div className={styles.usersDirToolbar}>
          <p className={styles.usersDirFooterMeta}>
            Showing all subscriptions
            {debouncedSearch ? ` matching “${debouncedSearch}”` : ""}
          </p>
        </div>

        <div className={styles.usersDirTableCard}>
          <div className={styles.usersDirTableWrap}>
            {loading && items.length === 0 ? (
              <SubscriptionsTableSkeleton />
            ) : items.length === 0 ? (
              <p className={styles.empty}>No subscriptions found.</p>
            ) : (
              <table className={styles.usersDirTable}>
                <thead>
                  <tr>
                    <th style={{ width: "3rem" }}>
                      <span className={styles.meetingsThWithIcon}>
                        <Hash
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        <span className="sr-only">Row number</span>
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <User
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Customer
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <CreditCard
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Plan
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <CircleDot
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Status
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <CalendarDays
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Started
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <CalendarDays
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Created
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((subscription, index) => (
                    <SubscriptionRow
                      key={subscription.id}
                      subscription={subscription}
                      rowNumber={showingStart + index}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <OffsetPagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={PAGE_SIZE}
            loading={loading}
            onPageChange={setPage}
            itemLabel="subscriptions"
          />
        </div>
      </div>
    </section>
  );
}
