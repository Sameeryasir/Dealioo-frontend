"use client";

import dynamic from "next/dynamic";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { Skeleton } from "@/app/components/skeleton";
import { isAdminOrSuperAdminUser } from "@/app/lib/is-admin-or-super-admin-user";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

const BusinessPerformancePanel = dynamic(
  () =>
    import("@/app/components/business/BusinessPerformancePanel").then(
      (mod) => mod.BusinessPerformancePanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="p-6" aria-busy="true" aria-label="Loading performance">
        <Skeleton className="mb-4 h-10 w-64 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    ),
  },
);

export default function BusinessPerformancePage() {
  const params = useParams();
  const router = useRouter();

  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );

  const canAccess = isAdminOrSuperAdminUser();

  useEffect(() => {
    if (!canAccess && businessId != null) {
      router.replace(`/business/${businessId}/dashboard`);
    }
  }, [businessId, canAccess, router]);

  if (businessId == null) {
    return <InvalidRouteMessage />;
  }

  if (!canAccess) {
    return null;
  }

  return <BusinessPerformancePanel businessId={businessId} />;
}
