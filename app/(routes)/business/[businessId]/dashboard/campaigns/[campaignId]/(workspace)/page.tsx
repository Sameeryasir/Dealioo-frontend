"use client";

import { FunnelOverviewPanel } from "@/app/components/campaign/FunnelOverviewPanel";
import { useCampaignByIdQuery } from "@/app/hooks/use-campaigns-by-business-query";
import { useCampaignFunnelId } from "@/app/hooks/use-campaign-funnel-id";
import { campaignDashboardHref } from "@/app/lib/campaign-dashboard-tab";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";

export default function CampaignOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );
  const campaignId = useMemo(
    () => parseRoutePositiveInt(params.campaignId),
    [params.campaignId],
  );
  const { data: campaign } = useCampaignByIdQuery(campaignId);
  const { funnelId, isLoading: isFunnelIdLoading } =
    useCampaignFunnelId(campaignId);

  if (businessId == null || campaignId == null) {
    return <InvalidRouteMessage />;
  }

  return (
    <div className="campaign-immersive-overview">
      <FunnelOverviewPanel
        embedded
        campaignName={campaign?.campaignName}
        price={campaign?.price}
        funnelId={funnelId}
        isFunnelIdLoading={isFunnelIdLoading}
        onCreateFunnel={() =>
          router.push(campaignDashboardHref(businessId, campaignId, "funnel"))
        }
      />
    </div>
  );
}
