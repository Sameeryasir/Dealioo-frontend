"use client";

import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { BusinessHistoryPanel } from "@/app/components/business/BusinessHistoryPanel";
import { isAdminOrSuperAdminUser } from "@/app/lib/is-admin-or-super-admin-user";
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

  return <BusinessHistoryPanel businessId={businessId} />;
}
