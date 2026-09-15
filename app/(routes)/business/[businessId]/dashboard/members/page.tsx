"use client";

import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { BusinessMembersPanel } from "@/app/components/business/BusinessMembersPanel";
import { useBusinessMembershipPermissions } from "@/app/hooks/use-business-membership-permissions";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";

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
