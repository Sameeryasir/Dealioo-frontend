"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FunnelPreviewSkeleton } from "@/app/components/crm-template-editor/FunnelPreviewSkeleton";
import { usePublicFunnelTemplatePages } from "@/app/hooks/use-public-funnel-template-pages";
import { TemplatePreview } from "@/app/components/crm-template-editor/TemplatePreview";
import { FunnelGuestPageShell } from "@/app/components/funnel/FunnelGuestPageShell";
import { useCampaignPricing } from "@/app/hooks/use-campaign-pricing";
import { useFunnelGuestRoute } from "@/app/hooks/use-funnel-guest-route";
import { useFunnelStepGuard } from "@/app/hooks/use-funnel-step-guard";
import {
  buildFunnelPaymentConfirmationPath,
  buildFunnelPublicPath,
} from "@/app/lib/funnel-public-path";

function FunnelCampaignSignupInner() {
  const searchParams = useSearchParams();
  const { funnelIdSegment, funnelId, campaignId, businessId } =
    useFunnelGuestRoute();
  useFunnelStepGuard(funnelId, "signup");

  const campaignTypeParam = searchParams.get("campaignType")?.trim();
  const isPostpaid = campaignTypeParam === "postpaid";
  const campaignType: "prepaid" | "postpaid" | undefined =
    campaignTypeParam === "postpaid" || campaignTypeParam === "prepaid"
      ? campaignTypeParam
      : undefined;

  const campaignPricing = useCampaignPricing(campaignId, businessId);
  const funnelLinkQuery = {
    campaignId,
    businessId,
    price: campaignPricing.subtotal ?? undefined,
    campaignType,
  };

  const { pages, isLoading } = usePublicFunnelTemplatePages(funnelIdSegment);
  const signup = pages.signup;
  const landing = pages.landing;

  const signupNextHref =
    funnelId != null
      ? isPostpaid
        ? buildFunnelPaymentConfirmationPath(funnelId, funnelLinkQuery, {
            paymentConfirmed: true,
          })
        : buildFunnelPublicPath({
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
      skipPaymentStep={isPostpaid}
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
