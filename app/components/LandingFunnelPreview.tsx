"use client";

import { FunnelPreviewSkeleton } from "@/app/components/crm-template-editor/FunnelPreviewSkeleton";
import { useFunnelTemplatePagesFromStorage } from "@/app/components/crm-template-editor/funnel-template-storage";
import { TemplatePreview } from "@/app/components/crm-template-editor/TemplatePreview";
import { useCampaignPricing } from "@/app/hooks/use-campaign-pricing";
import { useFunnelGuestRoute } from "@/app/hooks/use-funnel-guest-route";
import { buildFunnelPublicPath } from "@/app/lib/funnel-public-path";

export function LandingFunnelPreview() {
  const { funnelIdSegment, funnelId, campaignId, businessId } =
    useFunnelGuestRoute();

  const campaignPricing = useCampaignPricing(campaignId, businessId);

  const { pages, isLoading } = useFunnelTemplatePagesFromStorage(funnelIdSegment);
  const landing = pages.landing;

  const landingCtaHref =
    funnelId != null
      ? buildFunnelPublicPath({
          funnelId,
          step: "signup",
          query: {
            campaignId,
            businessId,
            price: campaignPricing.subtotal ?? undefined,
          },
        })
      : undefined;

  return (
    <>
      {isLoading ? (
        <FunnelPreviewSkeleton />
      ) : (
        <TemplatePreview
          page={landing}
          landingPage={landing}
          landingCtaHref={landingCtaHref}
          fullPageShellChrome
          trackingFunnelId={funnelId}
        />
      )}
    </>
  );
}
