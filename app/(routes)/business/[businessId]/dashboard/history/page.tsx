"use client";

import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { BusinessHistoryPanel } from "@/app/components/business/BusinessHistoryPanel";
import { isAdminOrSuperAdminUser } from "@/app/lib/is-admin-or-super-admin-user";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function BusinessHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );

  useEffect(() => {
    const canAccess = isAdminOrSuperAdminUser();
    setAllowed(canAccess);
    if (!canAccess && businessId != null) {
      router.replace(`/business/${businessId}/dashboard`);
    }
  }, [businessId, router]);

  if (businessId == null) {
    return <InvalidRouteMessage />;
  }

  if (allowed !== true) {
    return null;
  }

  return <BusinessHistoryPanel businessId={businessId} />;
}
