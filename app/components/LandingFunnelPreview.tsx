"use client";

import { useFunnelTemplatePagesFromStorage } from "@/app/components/crm-template-editor/funnel-template-storage";
import { TemplatePreview } from "@/app/components/crm-template-editor/TemplatePreview";
import { useCampaignPricing } from "@/app/hooks/use-campaign-pricing";
import { useFunnelGuestRoute } from "@/app/hooks/use-funnel-guest-route";
import { buildFunnelPublicPath } from "@/app/lib/funnel-public-path";

export function LandingFunnelPreview() {
  const { funnelIdSegment, funnelId, campaignId, restaurantId } =
    useFunnelGuestRoute();

  const campaignPricing = useCampaignPricing(campaignId, restaurantId);

  const pages = useFunnelTemplatePagesFromStorage(funnelIdSegment);
  const landing = pages.landing;

  const landingCtaHref =
    funnelId != null
      ? buildFunnelPublicPath({
          funnelId,
          step: "signup",
          query: {
            campaignId,
            restaurantId,
            price: campaignPricing.subtotal ?? undefined,
          },
        })
      : undefined;

  return (
    <div className="w-full min-w-0">
      <TemplatePreview
        page={landing}
        landingPage={landing}
        landingCtaHref={landingCtaHref}
        trackingFunnelId={funnelId}
      />
    </div>
  );
}
