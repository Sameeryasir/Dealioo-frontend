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
import { Building2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export function SuperAdminBusinessesPanel() {
  const [query, setQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

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
      "all",
    ),
    queryFn: () =>
      getAdminBusinesses({
        page,
        limit: SA_TABLE_PAGE_SIZE,
        search: debouncedSearch,
        onboarding: "all",
      }),
    enabled: hasAuthSession(),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const items = businessesQuery.data?.items ?? [];
  const meta = businessesQuery.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const loading = businessesQuery.isLoading || businessesQuery.isFetching;
  const errorMessage = businessesQuery.error
    ? getApiErrorMessage(businessesQuery.error, "Could not load businesses.")
    : null;

  return (
    <SuperAdminSectionChrome
      title="Businesses"
      subtitle="Customer businesses registered on Dealioo."
      query={query}
      onQueryChange={handleQueryChange}
      searchPlaceholder="Search businesses"
      onRefresh={() => void businessesQuery.refetch()}
      refreshing={loading}
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
              <Building2 className="size-5" strokeWidth={2.25} />
            </span>
            <div>
              <h2 className={styles.cardTitle}>All businesses</h2>
              <p className={styles.cardSub}>
                {total.toLocaleString()} total
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
            <p className={styles.empty}>No businesses found.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Owner</th>
                  <th>Plan</th>
                  <th>Location</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {items.map((business) => (
                  <tr key={business.id}>
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
                      {[business.city, business.state, business.country]
                        .filter(Boolean)
                        .join(", ") || "—"}
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
                ))}
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
          itemLabel="businesses"
        />
      </div>
    </SuperAdminSectionChrome>
  );
}
