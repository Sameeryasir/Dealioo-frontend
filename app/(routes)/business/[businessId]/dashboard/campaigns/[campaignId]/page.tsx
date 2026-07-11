"use client";

import { CampaignAdsPanel } from "@/app/components/campaign/CampaignAdsPanel";
// import { CampaignGoogleAdsPanel } from "@/app/components/campaign/CampaignGoogleAdsPanel";
import { FunnelOrdersPanel } from "@/app/components/campaign/FunnelOrdersPanel";
import { CampaignGuestsPanel } from "@/app/components/campaign/CampaignGuestsPanel";
import { FunnelOverviewPanel } from "@/app/components/campaign/FunnelOverviewPanel";
import { CrmTemplateEditor } from "@/app/components/crm-template-editor/CrmTemplateEditor";
import CampaignHeader from "@/app/components/CampaignHeader";
import { useCampaignByIdQuery } from "@/app/hooks/use-campaigns-by-business-query";
import { useCampaignFunnelId } from "@/app/hooks/use-campaign-funnel-id";
import { AutomationListPage } from "@/app/components/automation/AutomationListPage";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { funnelQueryKeys } from "@/app/services/funnel/funnel-query-keys";

export default function CampaignWelcomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
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

  const [activeTabId, setActiveTabId] = useState("overview");
  const [pattiHost, setPattiHost] = useState<HTMLElement | null>(null);
  const { funnelId, isLoading: isFunnelIdLoading } =
    useCampaignFunnelId(campaignId);

  useEffect(() => {
    setPattiHost(document.getElementById("campaign-immersive-patti-host"));
  }, []);

  const openAutomationBuilder = useCallback(
    (automationId: string) => {
      if (businessId == null) return;
      const funnelQuery =
        funnelId != null ? `?funnelId=${encodeURIComponent(String(funnelId))}` : "";
      router.push(
        `/business/${businessId}/dashboard/automations/${automationId}${funnelQuery}`,
      );
    },
    [router, businessId, funnelId],
  );

  const handleCampaignUpdated = useCallback(async () => {
    if (businessId == null) return;
    await queryClient.invalidateQueries({
      queryKey: [...funnelQueryKeys.campaigns(), businessId],
    });
    await queryClient.invalidateQueries({
      queryKey: [...funnelQueryKeys.campaigns(), "detail", campaignId],
    });
  }, [queryClient, businessId, campaignId]);

  if (businessId == null || campaignId == null) {
    return <InvalidRouteMessage />;
  }

  const campaignHeader = (
    <CampaignHeader
      embedded
      businessId={businessId}
      campaignId={campaignId}
      funnelId={funnelId}
      offer={campaign?.offer}
      price={campaign?.price}
      campaign={campaign}
      activeTabId={activeTabId}
      onTabChange={setActiveTabId}
      onCampaignUpdated={handleCampaignUpdated}
    />
  );

  return (
    <section className="rd-premium rd-premium--fill" aria-label="Campaign">
      {pattiHost ? createPortal(campaignHeader, pattiHost) : null}

      <div className="rd-premium-page campaign-immersive-page">
        <article
          className={`campaign-immersive-shell rd-premium-panel ${
            activeTabId === "funnel" ? "funnel-editor-shell" : ""
          }`}
        >
          <div
            className={`flex min-h-0 flex-1 flex-col ${
              activeTabId === "funnel" ? "overflow-hidden" : "overflow-y-auto"
            }`}
          >
            {activeTabId === "funnel" ? (
              <div className="funnel-editor-host flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
                <CrmTemplateEditor
                  embedded
                  businessId={businessId}
                  campaignId={campaignId}
                  campaignName={campaign?.campaignName}
                  campaignPrice={campaign?.price}
                  campaignOffer={campaign?.offer}
                />
              </div>
            ) : activeTabId === "overview" ? (
              <FunnelOverviewPanel
                embedded
                campaignName={campaign?.campaignName}
                price={campaign?.price}
                funnelId={funnelId}
                isFunnelIdLoading={isFunnelIdLoading}
                onCreateFunnel={() => setActiveTabId("funnel")}
              />
            ) : activeTabId === "orders" ? (
              <FunnelOrdersPanel
                embedded
                funnelId={funnelId}
                isFunnelIdLoading={isFunnelIdLoading}
              />
            ) : activeTabId === "guests" ? (
              <CampaignGuestsPanel
                embedded
                funnelId={funnelId}
                isFunnelIdLoading={isFunnelIdLoading}
              />
            ) : activeTabId === "automations" ? (
              <AutomationListPage
                embedded
                businessId={businessId}
                campaignId={campaignId}
                funnelId={funnelId}
                onOpenBuilder={openAutomationBuilder}
              />
            ) : activeTabId === "ads" ? (
              <div className="campaign-immersive-tab-panel overflow-y-auto">
                <CampaignAdsPanel
                  embedded
                  businessId={businessId}
                  campaignName={campaign?.campaignName}
                  campaignImageUrl={campaign?.imageUrl}
                  campaignWebsiteUrl={campaign?.websiteUrl}
                />
                {/* Google Ads — hidden for now
                <div className="w-full px-0">
                  <div
                    className="h-px bg-gradient-to-r from-transparent via-zinc-300/80 to-transparent"
                    aria-hidden
                  />
                </div>
                <CampaignGoogleAdsPanel embedded businessId={businessId} />
                */}
              </div>
            ) : (
              <div className="campaign-immersive-tab-panel flex flex-1 flex-col items-center justify-center py-8">
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
        </article>
      </div>
    </section>
  );
}
