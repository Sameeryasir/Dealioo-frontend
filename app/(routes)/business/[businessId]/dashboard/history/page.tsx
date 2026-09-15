"use client";

import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { BusinessHistoryPanel } from "@/app/components/business/BusinessHistoryPanel";
import { useBusinessMembershipPermissions } from "@/app/hooks/use-business-membership-permissions";
import { canViewBusinessHistory } from "@/app/lib/can-view-business-history";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function BusinessHistoryPage() {
  const params = useParams();
  const router = useRouter();

  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );

  const { can, isFetched } = useBusinessMembershipPermissions(
    businessId ?? null,
  );
  const canAccess = canViewBusinessHistory({
    canHistory: can("history"),
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

  return <BusinessHistoryPanel businessId={businessId} />;
}
