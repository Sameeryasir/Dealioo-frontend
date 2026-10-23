"use client";

import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import { Skeleton } from "@/app/components/skeleton";
import {
  formatAbsoluteDate,
  humanizeLabel,
  initialsFromName,
} from "@/app/components/super-admin/super-admin-list-helpers";
import planStyles from "@/app/components/super-admin/SuperAdminPlansPanel.module.css";
import subStyles from "@/app/components/super-admin/SuperAdminSubscriptionsPanel.module.css";
import styles from "@/app/components/SuperAdminDashboard.module.css";
import { hasAuthSession } from "@/app/lib/auth-session";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { adminQueryKeys } from "@/app/services/admin/admin-query-keys";
import {
  getAdminSubscriptions,
  type AdminSubscription,
} from "@/app/services/admin/get-admin-subscriptions";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  CreditCard,
  Hash,
  Info,
  RefreshCw,
  Search,
  Tag,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

const PAGE_SIZE = 10;

type SubTab = "all" | "active" | "trialing" | "past_due" | "cancelled";

const TAB_OPTIONS: Array<{ id: SubTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "trialing", label: "Trialing" },
  { id: "past_due", label: "Past due" },
  { id: "cancelled", label: "Cancelled" },
];

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
  if (key === "active") return subStyles.statusActive;
  if (key === "trialing") return subStyles.statusTrialing;
  if (key === "past_due") return subStyles.statusPastDue;
  return subStyles.statusCancelled;
}

function cycleLabel(billingCycle: string): string {
  return billingCycle === "annual" ? "Yearly" : "Monthly";
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
          {Array.from({ length: 6 }).map((_, index) => (
            <th key={index}>
              <Skeleton className="h-3 w-14" />
            </th>
          ))}
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
              <Skeleton className="h-4 w-16" />
            </td>
            <td>
              <Skeleton className="h-6 w-20 rounded-full" />
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
    <span className={planStyles.initialsAvatar} aria-hidden>
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
  const amountLabel = formatMoney(subscription.amount, subscription.currency);
  const billing = cycleLabel(subscription.billingCycle);

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
        <div className={subStyles.priceCell}>
          <span className={subStyles.priceMain}>{subscription.plan.name}</span>
          <span className={subStyles.priceSub}>
            {amountLabel}
            {subscription.plan.slug ? ` · ${subscription.plan.slug}` : ""}
          </span>
          {subscription.cancelAtPeriodEnd &&
          subscription.status.toLowerCase() !== "cancelled" ? (
            <span className={subStyles.cancelHint}>Cancels at period end</span>
          ) : null}
        </div>
      </td>
      <td>
        <div className={subStyles.priceCell}>
          <span className={subStyles.priceMain}>{billing}</span>
          <span className={subStyles.priceSub}>
            {(subscription.currency || "USD").toUpperCase()}
          </span>
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
        <div className={subStyles.priceCell}>
          <span className={subStyles.priceMain}>
            {formatAbsoluteDate(
              subscription.startedAt ?? subscription.createdAt,
            )}
          </span>
          <span className={subStyles.priceSub}>Started</span>
        </div>
      </td>
    </tr>
  );
}

export function SuperAdminSubscriptionsPanel() {
  const [query, setQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<SubTab>("all");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(query.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const subscriptionsQuery = useQuery({
    queryKey: adminQueryKeys.subscriptions(
      page,
      debouncedSearch,
      PAGE_SIZE,
      tab,
    ),
    queryFn: () =>
      getAdminSubscriptions({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        status: tab,
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

  const tabCounts: Record<SubTab, number> = {
    all: counts?.all ?? 0,
    active: counts?.active ?? 0,
    trialing: counts?.trialing ?? 0,
    past_due: counts?.pastDue ?? 0,
    cancelled: counts?.cancelled ?? 0,
  };

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
      label: "Past due",
      value: counts?.pastDue ?? 0,
      hint: "Payment needs attention",
      hintMuted: true,
      icon: AlertTriangle,
      iconBg: "#fff7ed",
      iconColor: "#c2410c",
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
      className={`${styles.page} ${styles.usersDir} ${styles.usersDirBlackActions} ${subStyles.subsShell}`}
      aria-label="Subscriptions"
    >
      <div className={styles.inner}>
        <div className={styles.usersDirHero}>
          <div className={styles.heroCopy}>
            <h1 className={styles.title}>Subscriptions</h1>
            <p className={styles.subtitle}>
              Customer purchases on Dealioo — who is paying, past due, or
              cancelled. Plan catalog lives under Plans.
            </p>
          </div>

          <div className={styles.usersDirHeroActions}>
            <label className={styles.usersDirSearch}>
              <Search className={styles.usersDirSearchIcon} aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by customer, email, or plan…"
                className={styles.usersDirSearchInput}
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

        <div className={subStyles.notice} role="note">
          <span className={subStyles.noticeIcon} aria-hidden>
            <Info className="size-3.5" strokeWidth={2.25} />
          </span>
          <p className="m-0">
            Past due means Stripe billing failed and needs attention. Cancelling
            at period end keeps access until the current period ends.
          </p>
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
          <div
            className={subStyles.segmentTabs}
            role="tablist"
            aria-label="Subscription status"
          >
            {TAB_OPTIONS.map((option) => {
              const selected = tab === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={`${subStyles.segmentTab} ${
                    selected ? subStyles.segmentTabActive : ""
                  }`}
                  onClick={() => {
                    setTab(option.id);
                    setPage(1);
                  }}
                >
                  {option.label}
                  <span className={subStyles.segmentCount}>
                    {tabCounts[option.id]}
                  </span>
                </button>
              );
            })}
          </div>
          <p className={subStyles.tableHint}>
            {total === 0
              ? "No subscriptions in this view"
              : `Showing ${showingStart}–${Math.min(showingStart + items.length - 1, total)} of ${total}`}
          </p>
        </div>

        <div className={styles.usersDirTableCard}>
          <div className={styles.usersDirTableWrap}>
            {loading && items.length === 0 ? (
              <SubscriptionsTableSkeleton />
            ) : items.length === 0 ? (
              <div className={subStyles.emptyState}>
                <p className={subStyles.emptyTitle}>
                  {debouncedSearch || tab !== "all"
                    ? "No subscriptions match this view"
                    : "No subscriptions yet"}
                </p>
                <p className={subStyles.emptyCopy}>
                  {debouncedSearch || tab !== "all"
                    ? "Try another search or status filter."
                    : "Customer checkouts will show up here once someone subscribes."}
                </p>
              </div>
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
                        <Tag
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Billing
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
