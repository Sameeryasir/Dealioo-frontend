"use client";

import { FunnelEditorPageShell } from "@/app/components/crm-template-editor/FunnelEditorPageShell";
import { LazyCrmTemplateEditor } from "@/app/components/crm-template-editor/LazyCrmTemplateEditor";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { useCampaignByIdQuery } from "@/app/hooks/use-campaigns-by-business-query";
import { useBusinessMembershipPermissions } from "@/app/hooks/use-business-membership-permissions";
import { useFunnelEditorWarmup } from "@/app/hooks/use-funnel-editor-warmup";
import { campaignDashboardHref } from "@/app/lib/campaign-dashboard-tab";
import { warmupFunnelEditorChunk } from "@/app/lib/funnel-editor-warmup";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  const funnelHref =
    businessId != null && campaignId != null
      ? campaignDashboardHref(businessId, campaignId, "funnel")
      : null;

  const { data: campaign } = useCampaignByIdQuery(campaignId ?? undefined);
  const { can, isFetched, isOwnerLike } = useBusinessMembershipPermissions(
    businessId ?? null,
  );
  const canAccess = isOwnerLike || can("funnels_edit");
  const [editorReady, setEditorReady] = useState(false);

  useFunnelEditorWarmup(Boolean(funnelHref && (!isFetched || canAccess)), funnelHref);

  useEffect(() => {
    let cancelled = false;
    void warmupFunnelEditorChunk().finally(() => {
      if (!cancelled) setEditorReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isFetched || campaignId == null || businessId == null) return;
    if (!canAccess) {
      router.replace(`/business/${businessId}/dashboard/campaigns/${campaignId}`);
    }
  }, [businessId, campaignId, canAccess, isFetched, router]);

  if (businessId == null || campaignId == null) {
    return <InvalidRouteMessage />;
  }

  if (!isFetched || !canAccess || !editorReady) {
    return null;
  }

  return (
    <FunnelEditorPageShell>
      <LazyCrmTemplateEditor
        embedded
        businessId={businessId}
        campaignId={campaignId}
        campaignName={campaign?.campaignName}
        campaignPrice={campaign?.price}
        campaignOriginalPrice={campaign?.originalPrice}
        campaignOffer={campaign?.offer}
        campaignType={campaign?.campaignType}
      />
    </FunnelEditorPageShell>
  );
}
