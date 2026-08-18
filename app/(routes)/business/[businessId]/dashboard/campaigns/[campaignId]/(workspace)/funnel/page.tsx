"use client";

import { LazyCrmTemplateEditor } from "@/app/components/crm-template-editor/LazyCrmTemplateEditor";
import { useCampaignByIdQuery } from "@/app/hooks/use-campaigns-by-business-query";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export default function CampaignFunnelPage() {
  const params = useParams();
  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );
  const campaignId = useMemo(
    () => parseRoutePositiveInt(params.campaignId),
    [params.campaignId],
  );
  const { data: campaign } = useCampaignByIdQuery(campaignId ?? undefined);

  if (businessId == null || campaignId == null) {
    return <InvalidRouteMessage />;
  }

  return (
    <div className="funnel-editor-host flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <LazyCrmTemplateEditor
        embedded
        businessId={businessId}
        campaignId={campaignId}
        campaignName={campaign?.campaignName}
        campaignPrice={campaign?.price}
        campaignOffer={campaign?.offer}
        campaignType={campaign?.campaignType}
      />
    </div>
  );
}
