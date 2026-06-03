"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import CampaignGuestExperience from "@/app/components/CampaignGuestExperience";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";

export default function CampaignGuestExperiencePage() {
  const params = useParams();
  const restaurantId = useMemo(
    () => parseRoutePositiveInt(params.restaurantId),
    [params.restaurantId],
  );
  const campaignId = useMemo(
    () => parseRoutePositiveInt(params.campaignId),
    [params.campaignId],
  );

  const campaignsHref =
    restaurantId != null
      ? `/restaurant/${restaurantId}/dashboard/campaigns`
      : "/dashboard";

  const funnelEditorHref =
    restaurantId != null && campaignId != null
      ? `/restaurant/${restaurantId}/dashboard/campaigns/${campaignId}/funnel`
      : undefined;

  if (restaurantId == null || campaignId == null) {
    return <InvalidRouteMessage />;
  }

  return (
    <CampaignGuestExperience
      restaurantId={restaurantId}
      campaignsHref={campaignsHref}
      funnel={undefined}
      loadError={null}
      funnelEditorHref={funnelEditorHref}
    />
  );
}
