"use client";

import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { BusinessMembersPanel } from "@/app/components/business/BusinessMembersPanel";
import { useBusinessMembershipPermissions } from "@/app/hooks/use-business-membership-permissions";
import { canViewBusinessMembers } from "@/app/lib/can-view-business-members";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";

export default function BusinessMembersPage() {
  const params = useParams();
  const router = useRouter();

  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );

  const { access, isFetched } = useBusinessMembershipPermissions(
    businessId ?? null,
  );
  const canAccess = canViewBusinessMembers({
    membershipAccess: access,
    membershipLoaded: isFetched,
  });

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
