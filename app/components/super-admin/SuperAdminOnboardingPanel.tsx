"use client";

import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import { SuperAdminSectionChrome } from "@/app/components/super-admin/SuperAdminSectionChrome";
import {
  formatAbsoluteDate,
  formatRelative,
  SA_TABLE_PAGE_SIZE,
} from "@/app/components/super-admin/super-admin-list-helpers";
import styles from "@/app/components/SuperAdminDashboard.module.css";
import { hasAuthSession } from "@/app/lib/auth-session";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { adminQueryKeys } from "@/app/services/admin/admin-query-keys";
import { getAdminBusinesses } from "@/app/services/admin/get-admin-businesses";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  CircleOff,
  Crown,
  Hash,
  Loader2,
  ScanLine,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

type OnboardingFilter = "all" | "onboarded" | "not_onboarded";

export function SuperAdminOnboardingPanel() {
  const [query, setQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<OnboardingFilter>("all");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(query.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const businessesQuery = useQuery({
    queryKey: adminQueryKeys.businesses(
      page,
      debouncedSearch,
      SA_TABLE_PAGE_SIZE,
      filter,
    ),
    queryFn: () =>
      getAdminBusinesses({
        page,
        limit: SA_TABLE_PAGE_SIZE,
        search: debouncedSearch,
        onboarding: filter,
      }),
    enabled: hasAuthSession(),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const items = businessesQuery.data?.items ?? [];
  const meta = businessesQuery.data?.meta;
  const counts = businessesQuery.data?.counts ?? {
    all: 0,
    onboarded: 0,
    notOnboarded: 0,
  };
  const total = meta?.total ?? 0;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const showingStart = total === 0 ? 0 : (page - 1) * SA_TABLE_PAGE_SIZE + 1;
  const loading = businessesQuery.isLoading || businessesQuery.isFetching;
  const errorMessage = businessesQuery.error
    ? getApiErrorMessage(
        businessesQuery.error,
        "Could not load onboarding list.",
      )
    : null;

  const filterTools = (
    <div className="inline-flex rounded-full border border-[#e8edf5] bg-white p-0.5 shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
      {(
        [
          { id: "all" as const, label: `All (${counts.all})` },
          { id: "onboarded" as const, label: `Onboarded (${counts.onboarded})` },
          {
            id: "not_onboarded" as const,
            label: `Not onboarded (${counts.notOnboarded})`,
          },
        ]
      ).map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            setFilter(item.id);
            setPage(1);
          }}
          className={`cursor-pointer rounded-full px-3 py-1 text-[0.72rem] font-bold ${
            filter === item.id
              ? "bg-[#1877f2] text-white"
              : "text-slate-600"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );

  return (
    <SuperAdminSectionChrome
      title="Onboarding"
      subtitle="Which customers finished setup, and which still need help."
      query={query}
      onQueryChange={handleQueryChange}
      searchPlaceholder="Search customers"
      onRefresh={() => void businessesQuery.refetch()}
      refreshing={loading}
      tools={filterTools}
    >
      {errorMessage ? (
        <div className="mb-4">
          <AsyncErrorRetry
            layout="inline"
            title="Something went wrong"
            message={errorMessage}
            onRetry={() => void businessesQuery.refetch()}
          />
        </div>
      ) : null}

      <div className={`${styles.card} ${styles.tableCard}`}>
        <div className={styles.cardHead}>
          <div className={styles.tableHeadLeft}>
            <span className={styles.tableHeadIcon} aria-hidden>
              <ScanLine className="size-5" strokeWidth={2.25} />
            </span>
            <div>
              <h2 className={styles.cardTitle}>Setup status</h2>
              <p className={styles.cardSub}>
                {total.toLocaleString()} business
                {total === 1 ? "" : "es"} in this view
              </p>
            </div>
          </div>
        </div>

        <div className={styles.tableWrap}>
          {loading && items.length === 0 ? (
            <div className={styles.loadingBox}>
              <Loader2 className="size-6 animate-spin" style={{ color: "#1877f2" }} />
            </div>
          ) : items.length === 0 ? (
            <p className={styles.empty}>No customers in this filter.</p>
          ) : (
            <table className={styles.table}>
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
                      <Building2
                        className="size-3.5"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                      Customer
                    </span>
                  </th>
                  <th>
                    <span className={styles.meetingsThWithIcon}>
                      <UserRound
                        className="size-3.5"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                      Owner
                    </span>
                  </th>
                  <th>
                    <span className={styles.meetingsThWithIcon}>
                      <Crown
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
                      Created
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((business, index) => {
                  const rowNumber = showingStart + index;
                  return (
                    <tr key={business.id}>
                      <td>
                        <span className={styles.usersDirDateMain}>
                          {rowNumber}.
                        </span>
                      </td>
                      <td>
                        <div className={styles.bizName}>{business.name}</div>
                        <div className={styles.bizMeta}>{business.slug}</div>
                      </td>
                      <td>
                        <div className={styles.bizName}>
                          {business.ownerName || "—"}
                        </div>
                        <div className={styles.bizMeta}>
                          {business.ownerEmail || "—"}
                        </div>
                      </td>
                      <td>{business.planName || "No plan"}</td>
                      <td>
                        {business.onboardingCompleted ? (
                          <span
                            className={`${styles.statusPill} ${styles.statusActive}`}
                          >
                            <CheckCircle2 className="size-3.5" aria-hidden />
                            Onboarded
                          </span>
                        ) : (
                          <span
                            className={`${styles.statusPill} ${styles.statusWarn}`}
                          >
                            <CircleOff className="size-3.5" aria-hidden />
                            Not onboarded
                          </span>
                        )}
                      </td>
                      <td>
                        <div className={styles.createdStack}>
                          <span>{formatRelative(business.createdAt)}</span>
                          <span className={styles.createdSub}>
                            {formatAbsoluteDate(business.createdAt)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <OffsetPagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={SA_TABLE_PAGE_SIZE}
          loading={loading}
          onPageChange={setPage}
          itemLabel="customers"
        />
      </div>
    </SuperAdminSectionChrome>
  );
}
