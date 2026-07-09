"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { BusinessCampaignsPanel } from "@/app/components/business/BusinessCampaignsPanel";
import { parseRoutePositiveInt } from "@/app/lib/numbers";

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
