"use client";

import { FunnelOrdersPanel } from "@/app/components/campaign/FunnelOrdersPanel";
import { FunnelOverviewPanel } from "@/app/components/campaign/FunnelOverviewPanel";
import { CrmTemplateEditor } from "@/app/components/crm-template-editor/CrmTemplateEditor";
import CampaignHeader from "@/app/components/CampaignHeader";
import { useCampaignsByRestaurantQuery } from "@/app/hooks/use-campaigns-by-restaurant-query";
import type { Funnel } from "@/app/services/funnel/get-campaigns-by-restaurant";
import { useCampaignFunnelId } from "@/app/hooks/use-campaign-funnel-id";
import { AutomationListPage } from "@/app/components/automation/AutomationListPage";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";

export default function CampaignWelcomePage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = useMemo(
    () => parseRoutePositiveInt(params.restaurantId),
    [params.restaurantId],
  );
  const campaignId = useMemo(
    () => parseRoutePositiveInt(params.campaignId),
    [params.campaignId],
  );

  const { data: campaigns, isLoading: campaignsLoading } =
    useCampaignsByRestaurantQuery(restaurantId);

  const campaign = useMemo((): Funnel | null | undefined => {
    if (campaignId == null) return undefined;
    if (campaignsLoading) return undefined;
    return campaigns.find((f) => f.id === campaignId) ?? null;
  }, [campaignId, campaigns, campaignsLoading]);

  const [activeTabId, setActiveTabId] = useState("overview");
  const { funnelId, isLoading: isFunnelIdLoading } =
    useCampaignFunnelId(campaignId);

  const openAutomationBuilder = useCallback(
    (automationId: string) => {
      if (restaurantId == null) return;
      const funnelQuery =
        funnelId != null ? `?funnelId=${encodeURIComponent(String(funnelId))}` : "";
      router.push(
        `/restaurant/${restaurantId}/dashboard/automations/${automationId}${funnelQuery}`,
      );
    },
    [router, restaurantId, funnelId],
  );

  if (restaurantId == null || campaignId == null) {
    return <InvalidRouteMessage />;
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="shrink-0">
        <CampaignHeader
          restaurantId={restaurantId}
          campaignId={campaignId}
          funnelId={funnelId}
          offer={campaign?.offer}
          price={campaign?.price}
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
        />
      </div>
      {activeTabId === "funnel" ? (
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
          <CrmTemplateEditor
            restaurantId={restaurantId}
            campaignId={campaignId}
            campaignName={campaign?.campaignName}
            campaignPrice={campaign?.price}
            campaignOffer={campaign?.offer}
          />
        </div>
      ) : activeTabId === "overview" ? (
        <FunnelOverviewPanel
          campaignName={campaign?.campaignName}
          price={campaign?.price}
          funnelId={funnelId}
          isFunnelIdLoading={isFunnelIdLoading}
        />
      ) : activeTabId === "orders" ? (
        <FunnelOrdersPanel
          funnelId={funnelId}
          isFunnelIdLoading={isFunnelIdLoading}
        />
      ) : activeTabId === "automations" ? (
        <AutomationListPage onOpenBuilder={openAutomationBuilder} />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
          <p className="text-center text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Welcome to Campaign page
          </p>
          {campaign === null ? (
            <p className="mt-4 text-center text-sm text-zinc-500">
              Could not load this campaign from the list.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
