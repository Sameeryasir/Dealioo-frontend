"use client";

import dynamic from "next/dynamic";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { Skeleton } from "@/app/components/skeleton";
import { useBusinessMembershipPermissions } from "@/app/hooks/use-business-membership-permissions";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";

const BusinessMembersPanel = dynamic(
  () =>
    import("@/app/components/business/BusinessMembersPanel").then(
      (mod) => mod.BusinessMembersPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="p-6" aria-busy="true" aria-label="Loading members">
        <Skeleton className="mb-4 h-10 w-48 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    ),
  },
);

export default function BusinessMembersPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );

  const { can, isFetched, isOwnerLike } = useBusinessMembershipPermissions(
    businessId ?? null,
  );
  const viewingOwnAccess = searchParams.get("openSelfDetails") === "1";
  const canAccess = isOwnerLike || can("members") || viewingOwnAccess;

  useEffect(() => {
    if (!isFetched) return;
    if (!canAccess && businessId != null) {
      router.replace(`/business/${businessId}/dashboard`);
    }
  }, [businessId, canAccess, isFetched, router]);

  if (businessId == null) {
    return <InvalidRouteMessage />;
  }

  if (!isFetched || !canAccess) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <BusinessMembersPanel businessId={businessId} />
    </Suspense>
  );
}
