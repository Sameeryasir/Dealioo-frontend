"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { Skeleton } from "@/app/components/skeleton";
import { parseRoutePositiveInt } from "@/app/lib/numbers";

const CampaignGuestExperience = dynamic(
  () => import("@/app/components/CampaignGuestExperience"),
  {
    ssr: false,
    loading: () => (
      <div className="p-6" aria-busy="true" aria-label="Loading guest experience">
        <Skeleton className="mb-4 h-10 w-56 rounded-xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    ),
  },
);

export default function CampaignGuestExperiencePage() {
  const params = useParams();
  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );
  const campaignId = useMemo(
    () => parseRoutePositiveInt(params.campaignId),
    [params.campaignId],
  );

  const campaignsHref =
    businessId != null
      ? `/business/${businessId}/dashboard/campaigns`
      : "/dashboard";

  const funnelEditorHref =
    businessId != null && campaignId != null
      ? `/business/${businessId}/dashboard/campaigns/${campaignId}/funnel`
      : undefined;

  if (businessId == null || campaignId == null) {
    return <InvalidRouteMessage />;
  }

  return (
    <CampaignGuestExperience
      businessId={businessId}
      campaignsHref={campaignsHref}
      funnel={undefined}
      loadError={null}
      funnelEditorHref={funnelEditorHref}
    />
  );
}
