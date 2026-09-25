"use client";

import dynamic from "next/dynamic";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { Skeleton } from "@/app/components/skeleton";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams } from "next/navigation";
import { useMemo } from "react";

const BusinessOrdersPanel = dynamic(
  () =>
    import("@/app/components/business/BusinessOrdersPanel").then(
      (mod) => mod.BusinessOrdersPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="p-6" aria-busy="true" aria-label="Loading orders">
        <Skeleton className="mb-4 h-10 w-48 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    ),
  },
);

export default function BusinessOrdersPage() {
  const params = useParams();
  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );

  if (businessId == null) {
    return <InvalidRouteMessage />;
  }

  return <BusinessOrdersPanel businessId={businessId} />;
}
