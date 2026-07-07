"use client";

import { Suspense } from "react";
import { FunnelPreviewSkeleton } from "@/app/components/crm-template-editor/FunnelPreviewSkeleton";
import { useFunnelTemplatePagesFromStorage } from "@/app/components/crm-template-editor/funnel-template-storage";
import { TemplatePreview } from "@/app/components/crm-template-editor/TemplatePreview";
import { FunnelGuestPageShell } from "@/app/components/funnel/FunnelGuestPageShell";
import { useCampaignPricing } from "@/app/hooks/use-campaign-pricing";
import { useFunnelGuestRoute } from "@/app/hooks/use-funnel-guest-route";
import { buildFunnelPublicPath } from "@/app/lib/funnel-public-path";

function FunnelCampaignSignupInner() {
  const { funnelIdSegment, funnelId, campaignId, restaurantId } =
    useFunnelGuestRoute();

  const campaignPricing = useCampaignPricing(campaignId, restaurantId);
  const funnelLinkQuery = {
    campaignId,
    restaurantId,
    price: campaignPricing.subtotal ?? undefined,
  };

  const { pages, isLoading } = useFunnelTemplatePagesFromStorage(funnelIdSegment);
  const signup = pages.signup;
  const landing = pages.landing;

  const signupNextHref =
    funnelId != null
      ? buildFunnelPublicPath({
          funnelId,
          step: "payment",
          query: funnelLinkQuery,
        })
      : undefined;

  const signupBackHref =
    funnelId != null
      ? buildFunnelPublicPath({
          funnelId,
          step: "landing",
          query: funnelLinkQuery,
        })
      : undefined;

  if (isLoading) {
    return <FunnelPreviewSkeleton />;
  }

  return (
    <TemplatePreview
      page={signup}
      landingPage={landing}
      signupNextHref={signupNextHref}
      signupBackHref={signupBackHref}
      interactiveForms
      submitCustomerOnSignupNext
      fullPageShellChrome
      trackingFunnelId={funnelId}
      checkoutRestaurantId={restaurantId}
      checkoutCampaignId={campaignId}
    />
  );
}

export default function FunnelCampaignSignupPage() {
  return (
    <FunnelGuestPageShell>
      <Suspense fallback={<FunnelPreviewSkeleton />}>
        <FunnelCampaignSignupInner />
      </Suspense>
    </FunnelGuestPageShell>
  );
}
