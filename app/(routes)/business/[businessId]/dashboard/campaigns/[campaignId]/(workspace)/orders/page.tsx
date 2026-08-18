"use client";

import { FunnelOrdersPanel } from "@/app/components/campaign/FunnelOrdersPanel";
import { useCampaignFunnelId } from "@/app/hooks/use-campaign-funnel-id";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export default function CampaignOrdersPage() {
  const params = useParams();
  const campaignId = useMemo(
    () => parseRoutePositiveInt(params.campaignId),
    [params.campaignId],
  );
  const { funnelId, isLoading: isFunnelIdLoading } =
    useCampaignFunnelId(campaignId);

  if (campaignId == null) {
    return <InvalidRouteMessage />;
  }

  return (
    <div className="campaign-immersive-overview">
      <FunnelOrdersPanel
        embedded
        funnelId={funnelId}
        isFunnelIdLoading={isFunnelIdLoading}
      />
    </div>
  );
}
