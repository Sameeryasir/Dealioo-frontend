"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { CrmTemplateEditor } from "@/app/components/crm-template-editor/CrmTemplateEditor";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
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

  if (businessId == null || campaignId == null) {
    return <InvalidRouteMessage />;
  }

  return (
    <div className="h-[100dvh] min-h-0 w-full overflow-hidden">
      <CrmTemplateEditor
        businessId={businessId}
        campaignId={campaignId}
        interactivePreview
      />
    </div>
  );
}
