"use client";

import { BusinessCampaignsPanel } from "@/app/components/business/BusinessCampaignsPanel";

import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams } from "next/navigation";
import { useMemo } from "react";

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
