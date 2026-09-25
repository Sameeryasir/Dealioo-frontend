"use client";

import dynamic from "next/dynamic";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { Skeleton } from "@/app/components/skeleton";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams } from "next/navigation";
import { useMemo } from "react";

const BusinessActivityPanel = dynamic(
  () =>
    import("@/app/components/business/BusinessActivityPanel").then(
      (mod) => mod.BusinessActivityPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="p-6" aria-busy="true" aria-label="Loading activity">
        <Skeleton className="mb-4 h-10 w-48 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    ),
  },
);

export default function BusinessActivityPage() {
  const params = useParams();
  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );

  if (businessId == null) {
    return <InvalidRouteMessage />;
  }

  return <BusinessActivityPanel businessId={businessId} />;
}
