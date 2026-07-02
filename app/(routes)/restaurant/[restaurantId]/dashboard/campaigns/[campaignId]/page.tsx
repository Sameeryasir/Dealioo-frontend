"use client";

import { CampaignAdsPanel } from "@/app/components/campaign/CampaignAdsPanel";
import { CampaignGoogleAdsPanel } from "@/app/components/campaign/CampaignGoogleAdsPanel";
import { FunnelOrdersPanel } from "@/app/components/campaign/FunnelOrdersPanel";
import { CampaignGuestsPanel } from "@/app/components/campaign/CampaignGuestsPanel";
import { FunnelOverviewPanel } from "@/app/components/campaign/FunnelOverviewPanel";
import { CrmTemplateEditor } from "@/app/components/crm-template-editor/CrmTemplateEditor";
import CampaignHeader from "@/app/components/CampaignHeader";
import { useCampaignByIdQuery } from "@/app/hooks/use-campaigns-by-restaurant-query";
import { useCampaignFunnelId } from "@/app/hooks/use-campaign-funnel-id";
import { AutomationListPage } from "@/app/components/automation/AutomationListPage";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { funnelQueryKeys } from "@/app/services/funnel/funnel-query-keys";

export default function CampaignWelcomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const restaurantId = useMemo(
    () => parseRoutePositiveInt(params.restaurantId),
    [params.restaurantId],
  );
  const campaignId = useMemo(
    () => parseRoutePositiveInt(params.campaignId),
    [params.campaignId],
  );

  const { data: campaign, isLoading: campaignsLoading } =
    useCampaignByIdQuery(campaignId);

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

  const handleCampaignUpdated = useCallback(async () => {
    if (restaurantId == null) return;
    await queryClient.invalidateQueries({
      queryKey: [...funnelQueryKeys.campaigns(), restaurantId],
    });
    await queryClient.invalidateQueries({
      queryKey: [...funnelQueryKeys.campaigns(), "detail", campaignId],
    });
  }, [queryClient, restaurantId, campaignId]);

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
          campaign={campaign}
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          onCampaignUpdated={handleCampaignUpdated}
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
          onCreateFunnel={() => setActiveTabId("funnel")}
        />
      ) : activeTabId === "orders" ? (
        <FunnelOrdersPanel
          funnelId={funnelId}
          isFunnelIdLoading={isFunnelIdLoading}
        />
      ) : activeTabId === "guests" ? (
        <CampaignGuestsPanel />
      ) : activeTabId === "automations" ? (
        <AutomationListPage onOpenBuilder={openAutomationBuilder} />
      ) : activeTabId === "ads" ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-zinc-50/50">
          <CampaignAdsPanel
            restaurantId={restaurantId}
            campaignName={campaign?.campaignName}
            campaignImageUrl={campaign?.imageUrl}
            campaignWebsiteUrl={campaign?.websiteUrl}
          />
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-8">
            <div
              className="h-px bg-gradient-to-r from-transparent via-zinc-300/80 to-transparent"
              aria-hidden
            />
          </div>
          <CampaignGoogleAdsPanel restaurantId={restaurantId} />
        </div>
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
