"use client";

import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { BusinessBundleOpportunitiesPanel } from "@/app/components/business/BusinessBundleOpportunitiesPanel";
import { isAdminOrSuperAdminUser } from "@/app/lib/is-admin-or-super-admin-user";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";

function BundleOpportunitiesPageBody({ businessId }: { businessId: number }) {
  return <BusinessBundleOpportunitiesPanel businessId={businessId} />;
}

export default function BusinessBundleOpportunitiesPage() {
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

  return (
    <Suspense
      fallback={
        <div className="rd-premium w-full animate-pulse rounded-[1.35rem] border border-[#e8edf5] bg-white p-6">
          <div className="h-8 w-56 rounded-md bg-slate-100" />
          <div className="mt-3 h-4 w-80 rounded-md bg-slate-100" />
        </div>
      }
    >
      <BundleOpportunitiesPageBody businessId={businessId} />
    </Suspense>
  );
}
