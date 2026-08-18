"use client";

import { AutomationListPage } from "@/app/components/automation/AutomationListPage";
import { useCampaignFunnelId } from "@/app/hooks/use-campaign-funnel-id";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

export default function CampaignAutomationsPage() {
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
  const { funnelId } = useCampaignFunnelId(campaignId);

  const openAutomationBuilder = useCallback(
    (automationId: string, bootstrapping = false) => {
      if (businessId == null) return;
      const query = new URLSearchParams();
      if (funnelId != null) {
        query.set("funnelId", String(funnelId));
      }
      if (bootstrapping) {
        query.set("bootstrapping", "1");
      }
      const qs = query.toString();
      router.push(
        `/business/${businessId}/dashboard/automations/${automationId}${
          qs ? `?${qs}` : ""
        }`,
      );
    },
    [router, businessId, funnelId],
  );

  if (businessId == null || campaignId == null) {
    return <InvalidRouteMessage />;
  }

  return (
    <div className="campaign-immersive-overview">
      <AutomationListPage
        embedded
        businessId={businessId}
        campaignId={campaignId}
        funnelId={funnelId}
        onOpenBuilder={openAutomationBuilder}
      />
    </div>
  );
}
