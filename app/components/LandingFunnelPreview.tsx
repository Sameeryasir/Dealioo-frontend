"use client";

import { useFunnelTemplatePagesFromStorage } from "@/app/components/crm-template-editor/funnel-template-storage";
import { TemplatePreview } from "@/app/components/crm-template-editor/TemplatePreview";
import { useFunnelGuestRoute } from "@/app/hooks/use-funnel-guest-route";
import { buildFunnelPublicPath } from "@/app/lib/funnel-public-path";

export function LandingFunnelPreview() {
  const { funnelIdSegment, funnelId, campaignId, restaurantId } =
    useFunnelGuestRoute();

  const pages = useFunnelTemplatePagesFromStorage(funnelIdSegment);
  const landing = pages.landing;

  const landingCtaHref =
    funnelId != null
      ? buildFunnelPublicPath({
          funnelId,
          step: "signup",
          query: { campaignId, restaurantId },
        })
      : undefined;

  return (
    <div className="w-full min-w-0">
      <TemplatePreview
        page={landing}
        landingPage={landing}
        landingCtaHref={landingCtaHref}
      />
    </div>
  );
}
