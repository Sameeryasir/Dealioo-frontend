"use client";

import { LazyCrmTemplateEditor } from "@/app/components/crm-template-editor/LazyCrmTemplateEditor";
import { useCampaignByIdQuery } from "@/app/hooks/use-campaigns-by-business-query";
import { useBusinessMembershipPermissions } from "@/app/hooks/use-business-membership-permissions";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function CampaignFunnelPage() {
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
  const { data: campaign } = useCampaignByIdQuery(campaignId ?? undefined);
  const { can, isFetched, isOwnerLike } = useBusinessMembershipPermissions(
    businessId ?? null,
  );
  const canAccess = isOwnerLike || can("funnels_edit");

  useEffect(() => {
    if (!isFetched || campaignId == null || businessId == null) return;
    if (!canAccess) {
      router.replace(`/business/${businessId}/dashboard/campaigns/${campaignId}`);
    }
  }, [businessId, campaignId, canAccess, isFetched, router]);

  if (businessId == null || campaignId == null) {
    return <InvalidRouteMessage />;
  }

  if (!isFetched || !canAccess) {
    return null;
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
