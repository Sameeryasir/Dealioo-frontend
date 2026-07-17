"use client";

import { Suspense } from "react";
import { FunnelPreviewSkeleton } from "@/app/components/crm-template-editor/FunnelPreviewSkeleton";
import { useFunnelTemplatePagesFromStorage } from "@/app/components/crm-template-editor/funnel-template-storage";
import { TemplatePreview } from "@/app/components/crm-template-editor/TemplatePreview";
import { FunnelGuestPageShell } from "@/app/components/funnel/FunnelGuestPageShell";
import { useCampaignPricing } from "@/app/hooks/use-campaign-pricing";
import { useFunnelGuestRoute } from "@/app/hooks/use-funnel-guest-route";
import { useFunnelStepGuard } from "@/app/hooks/use-funnel-step-guard";
import { buildFunnelPublicPath } from "@/app/lib/funnel-public-path";

function FunnelCampaignSignupInner() {
  const { funnelIdSegment, funnelId, campaignId, businessId } =
    useFunnelGuestRoute();
  useFunnelStepGuard(funnelId, "signup");

  const campaignPricing = useCampaignPricing(campaignId, businessId);
  const funnelLinkQuery = {
    campaignId,
    businessId,
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

  if (isLoading) {
    return <FunnelPreviewSkeleton />;
  }

  return (
    <TemplatePreview
      page={signup}
      landingPage={landing}
      signupNextHref={signupNextHref}
      interactiveForms
      submitCustomerOnSignupNext
      fullPageShellChrome
      trackingFunnelId={funnelId}
      checkoutBusinessId={businessId}
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
