"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import CampaignGuestExperience from "@/app/components/CampaignGuestExperience";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";

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
