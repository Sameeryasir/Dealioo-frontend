"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FunnelPreviewSkeleton } from "@/app/components/crm-template-editor/FunnelPreviewSkeleton";
import { FunnelGuestPageShell } from "@/app/components/funnel/FunnelGuestPageShell";
import { FunnelMetaPixel } from "@/app/components/funnel/FunnelMetaPixel";
import { usePublicFunnelTemplatePages } from "@/app/hooks/use-public-funnel-template-pages";
import { TemplatePreview } from "@/app/components/crm-template-editor/TemplatePreview";
import { useCampaignPricing } from "@/app/hooks/use-campaign-pricing";
import { useFunnelGuestRoute } from "@/app/hooks/use-funnel-guest-route";
import { useFunnelStepGuard } from "@/app/hooks/use-funnel-step-guard";
import {
  buildFunnelPaymentConfirmationPath,
  buildFunnelPublicPath,
} from "@/app/lib/funnel-public-path";
import { parsePublicCampaignType } from "@/app/services/funnel/get-public-funnel";

function FunnelCampaignSignupInner() {
  const searchParams = useSearchParams();
  const { funnelIdSegment, funnelId, campaignId, businessId } =
    useFunnelGuestRoute();

  const isDesignPreview = searchParams.get("preview") === "1";

  const campaignPricing = useCampaignPricing(campaignId, businessId);

  const { pages, isLoading, publicFunnel } = usePublicFunnelTemplatePages(
    funnelIdSegment,
    businessId,
    "signup",
  );

  const campaignType = parsePublicCampaignType(publicFunnel?.campaignType);
  const isPostpaid = campaignType === "postpaid";
  useFunnelStepGuard(funnelId, "signup", { campaignType });

  const funnelLinkQuery = {
    campaignId,
    businessId,
    price: campaignPricing.subtotal ?? undefined,
    campaignType: campaignType ?? undefined,
  };

  const signup = pages.signup;
  const landing = pages.landing;

  const signupNextHref =
    funnelId != null && campaignType != null
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

  return (
    <>
      <FunnelMetaPixel
        pixelId={isDesignPreview ? null : publicFunnel?.pixelId}
        businessId={businessId ?? publicFunnel?.businessId}
        funnelId={funnelId}
        stepKey="signup"
      />
      {isLoading || (!isDesignPreview && campaignType == null) ? (
        <FunnelPreviewSkeleton />
      ) : (
        <TemplatePreview
          page={signup}
          landingPage={landing}
          signupNextHref={isDesignPreview ? undefined : signupNextHref}
          interactiveForms={!isDesignPreview}
          submitCustomerOnSignupNext={!isDesignPreview}
          editorStepPreviewChrome={isDesignPreview}
          skipPaymentStep={isPostpaid}
          fullPageShellChrome
          trackingFunnelId={isDesignPreview ? null : funnelId}
          checkoutBusinessId={isDesignPreview ? null : businessId}
          checkoutCampaignId={isDesignPreview ? null : campaignId}
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

export default function FunnelCampaignSignupPage() {
  return (
    <FunnelGuestPageShell>
      <Suspense fallback={<FunnelPreviewSkeleton />}>
        <FunnelCampaignSignupInner />
      </Suspense>
    </FunnelGuestPageShell>
  );
}
