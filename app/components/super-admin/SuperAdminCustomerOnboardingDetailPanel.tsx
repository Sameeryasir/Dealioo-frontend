"use client";

import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { Skeleton } from "@/app/components/skeleton";
import styles from "@/app/components/SuperAdminDashboard.module.css";
import { hasAuthSession } from "@/app/lib/auth-session";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { adminQueryKeys } from "@/app/services/admin/admin-query-keys";
import { getAdminCustomerOnboarding } from "@/app/services/admin/customer-onboarding";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function SuperAdminCustomerOnboardingDetailPanel({
  onboardingId,
}: {
  onboardingId: number;
}) {
  const router = useRouter();

  const detailQuery = useQuery({
    queryKey: adminQueryKeys.customerOnboarding(onboardingId),
    queryFn: () => getAdminCustomerOnboarding(onboardingId),
    enabled: hasAuthSession() && onboardingId > 0,
    staleTime: 10_000,
  });

  const detail = detailQuery.data ?? null;

  useEffect(() => {
    if (!detail) return;
    if (detail.businessId) {
      router.replace(`/business/${detail.businessId}/dashboard`);
      return;
    }
    router.replace("/admin/customer-onboarding");
  }, [detail, router]);

  if (detailQuery.isError) {
    return (
      <section className={`${styles.page} ${styles.usersDir}`}>
        <div className={styles.inner}>
          <AsyncErrorRetry
            layout="inline"
            title="Could not load account"
            message={getApiErrorMessage(
              detailQuery.error,
              "Could not load customer account.",
            )}
            onRetry={() => void detailQuery.refetch()}
          />
          <Link
            href="/admin/customer-onboarding"
            className={`${styles.meetingTableLink} mt-4 inline-flex`}
          >
            Back to Customer Onboarding
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={`${styles.page} ${styles.usersDir}`} aria-busy="true">
      <div className={styles.inner}>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-4 h-24 w-full rounded-2xl" />
        <p className="mt-4 text-sm text-slate-500">Opening account…</p>
      </div>
    </section>
  );
}
