"use client";

import { useSearchParams } from "next/navigation";
import { FunnelPreviewSkeleton } from "@/app/components/crm-template-editor/FunnelPreviewSkeleton";
import { FunnelMetaPixel } from "@/app/components/funnel/FunnelMetaPixel";
import { usePublicFunnelTemplatePages } from "@/app/hooks/use-public-funnel-template-pages";
import { TemplatePreview } from "@/app/components/crm-template-editor/TemplatePreview";
import { useCampaignPricing } from "@/app/hooks/use-campaign-pricing";
import { useFunnelGuestRoute } from "@/app/hooks/use-funnel-guest-route";
import { useFunnelStepGuard } from "@/app/hooks/use-funnel-step-guard";
import { buildFunnelPublicPath } from "@/app/lib/funnel-public-path";
import { parsePublicCampaignType } from "@/app/services/funnel/get-public-funnel";

export function LandingFunnelPreview() {
  const searchParams = useSearchParams();
  const { funnelIdSegment, funnelId, campaignId, businessId } =
    useFunnelGuestRoute();

  const isDesignPreview = searchParams.get("preview") === "1";
  const campaignPricing = useCampaignPricing(campaignId, businessId);

  const { pages, isLoading, publicFunnel } = usePublicFunnelTemplatePages(
    funnelIdSegment,
    businessId,
    "landing",
  );

  const campaignType = parsePublicCampaignType(publicFunnel?.campaignType);
  useFunnelStepGuard(funnelId, "landing", { campaignType });

  const landing = pages.landing;

  const landingCtaHref =
    !isDesignPreview && funnelId != null
      ? buildFunnelPublicPath({
          funnelId,
          step: "signup",
          query: {
            campaignId,
            businessId,
            price: campaignPricing.subtotal ?? undefined,
            campaignType,
          },
        })
      : undefined;

  return (
    <>
      <FunnelMetaPixel
        pixelId={isDesignPreview ? null : publicFunnel?.pixelId}
        businessId={businessId ?? publicFunnel?.businessId}
        funnelId={funnelId}
        stepKey="landing"
      />
      {isLoading ? (
        <FunnelPreviewSkeleton />
      ) : (
        <TemplatePreview
          page={landing}
          landingPage={landing}
          landingCtaHref={landingCtaHref}
          editorStepPreviewChrome={isDesignPreview}
          fullPageShellChrome
          trackingFunnelId={isDesignPreview ? null : funnelId}
          metaPixelId={isDesignPreview ? null : publicFunnel?.pixelId}
          metaBusinessId={
            isDesignPreview
              ? null
              : (businessId ?? publicFunnel?.businessId)
          }
        />
      )}
    </>
  );
}
