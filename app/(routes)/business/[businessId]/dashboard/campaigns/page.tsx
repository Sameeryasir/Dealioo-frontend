"use client";

import dynamic from "next/dynamic";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { Skeleton } from "@/app/components/skeleton";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams } from "next/navigation";
import { useMemo } from "react";

const BusinessCampaignsPanel = dynamic(
  () =>
    import("@/app/components/business/BusinessCampaignsPanel").then(
      (mod) => mod.BusinessCampaignsPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="p-6" aria-busy="true" aria-label="Loading campaigns">
        <Skeleton className="mb-4 h-10 w-56 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    ),
  },
);

export default function BusinessCampaignsPage() {
  const params = useParams();
  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );

  if (businessId == null) {
    return (
      <InvalidRouteMessage
        message="Invalid business link."
        backLabel="Back to your businesses"
      />
    );
  }

  return <BusinessCampaignsPanel businessId={businessId} />;
}
