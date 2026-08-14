"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { LazyCrmTemplateEditor } from "@/app/components/crm-template-editor/LazyCrmTemplateEditor";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { useCampaignByIdQuery } from "@/app/hooks/use-campaigns-by-business-query";
import { parseRoutePositiveInt } from "@/app/lib/numbers";

export default function CampaignCrmTemplateEditorPage() {
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
    <div className="h-[100dvh] min-h-0 w-full overflow-hidden">
      <LazyCrmTemplateEditor
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
