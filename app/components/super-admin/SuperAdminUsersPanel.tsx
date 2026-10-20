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
import { getAdminUsers } from "@/app/services/admin/get-admin-users";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Loader2, Users } from "lucide-react";
import { useEffect, useState } from "react";

export function SuperAdminUsersPanel() {
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

  const usersQuery = useQuery({
    queryKey: adminQueryKeys.users(page, debouncedSearch, SA_TABLE_PAGE_SIZE),
    queryFn: () =>
      getAdminUsers({
        page,
        limit: SA_TABLE_PAGE_SIZE,
        search: debouncedSearch,
      }),
    enabled: hasAuthSession(),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const items = usersQuery.data?.items ?? [];
  const meta = usersQuery.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const loading = usersQuery.isLoading || usersQuery.isFetching;
  const errorMessage = usersQuery.error
    ? getApiErrorMessage(usersQuery.error, "Could not load users.")
    : null;

  return (
    <SuperAdminSectionChrome
      title="Users"
      subtitle="Everyone with a Dealioo account."
      query={query}
      onQueryChange={handleQueryChange}
      searchPlaceholder="Search users"
      onRefresh={() => void usersQuery.refetch()}
      refreshing={loading}
    >
      {errorMessage ? (
        <div className="mb-4">
          <AsyncErrorRetry
            layout="inline"
            title="Something went wrong"
            message={errorMessage}
            onRetry={() => void usersQuery.refetch()}
          />
        </div>
      ) : null}

      <div className={`${styles.card} ${styles.tableCard}`}>
        <div className={styles.cardHead}>
          <div className={styles.tableHeadLeft}>
            <span className={styles.tableHeadIcon} aria-hidden>
              <Users className="size-5" strokeWidth={2.25} />
            </span>
            <div>
              <h2 className={styles.cardTitle}>All users</h2>
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
            <p className={styles.empty}>No users found.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {items.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.bizName}>{user.name || "—"}</div>
                      <div className={styles.bizMeta}>{user.email}</div>
                    </td>
                    <td>{user.roleName || "—"}</td>
                    <td>{user.planName || "No plan"}</td>
                    <td>
                      <span
                        className={`${styles.statusPill} ${
                          user.isActive ? styles.statusActive : styles.statusMuted
                        }`}
                      >
                        <span className={styles.statusDot} aria-hidden />
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.createdStack}>
                        <span>{formatRelative(user.createdAt)}</span>
                        <span className={styles.createdSub}>
                          {formatAbsoluteDate(user.createdAt)}
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
          itemLabel="users"
        />
      </div>
    </SuperAdminSectionChrome>
  );
}
