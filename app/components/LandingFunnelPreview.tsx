"use client";

import { useSearchParams } from "next/navigation";
import { FunnelPreviewSkeleton } from "@/app/components/crm-template-editor/FunnelPreviewSkeleton";
import { useFunnelTemplatePagesFromStorage } from "@/app/components/crm-template-editor/funnel-template-storage";
import { TemplatePreview } from "@/app/components/crm-template-editor/TemplatePreview";
import { useCampaignPricing } from "@/app/hooks/use-campaign-pricing";
import { useFunnelGuestRoute } from "@/app/hooks/use-funnel-guest-route";
import { useFunnelStepGuard } from "@/app/hooks/use-funnel-step-guard";
import { buildFunnelPublicPath } from "@/app/lib/funnel-public-path";

export function LandingFunnelPreview() {
  const searchParams = useSearchParams();
  const { funnelIdSegment, funnelId, campaignId, businessId } =
    useFunnelGuestRoute();
  useFunnelStepGuard(funnelId, "landing");

  const campaignPricing = useCampaignPricing(campaignId, businessId);
  const campaignTypeParam = searchParams.get("campaignType")?.trim();
  const campaignType =
    campaignTypeParam === "postpaid" || campaignTypeParam === "prepaid"
      ? campaignTypeParam
      : undefined;

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
            campaignType,
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
