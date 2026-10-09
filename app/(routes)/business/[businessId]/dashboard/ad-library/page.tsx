"use client";

import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function BusinessAdLibraryPage() {
  const router = useRouter();
  const params = useParams();
  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );

  useEffect(() => {
    if (businessId == null) return;
    router.replace(`/business/${businessId}/dashboard`);
  }, [businessId, router]);

  if (businessId == null) {
    return <InvalidRouteMessage />;
  }

  return null;
}
