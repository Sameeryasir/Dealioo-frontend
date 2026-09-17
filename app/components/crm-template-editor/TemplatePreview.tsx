"use client";

import type { FormEvent } from "react";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formDesignHidesTopHero } from "@/app/components/crm-template-editor/form-design-registry";
import { LandingPagePreview } from "@/app/components/crm-template-editor/LandingPagePreview";
import { SignupPagePreview } from "@/app/components/crm-template-editor/SignupPagePreview";
import { normalizeHeroDesign } from "@/app/components/crm-template-editor/hero-designs/registry";
import { normalizeLandingDesign } from "@/app/components/crm-template-editor/landing-designs/registry";
import { ConfirmationPagePreview } from "@/app/components/crm-template-editor/ConfirmationPagePreview";
import { PaymentPagePreview } from "@/app/components/crm-template-editor/PaymentPagePreview";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import type { CampaignPricing } from "@/app/lib/campaign-price";
import type {
  LandingTemplatePage,
  SignUpTemplatePage,
  TemplatePage,
} from "@/app/components/crm-template-editor/template-types";
import { createCustomer } from "@/app/services/customer/create-customer";
import {
  checkoutUrlToAppPath,
  createCheckoutSession,
} from "@/app/services/payment/checkout-session";
import { getOrCreateVisitorId } from "@/app/lib/funnel-visitor-id";
import { validateFunnelSignupFormData } from "@/app/lib/funnel-signup-validation";
import {
  trackMetaPixelCompleteRegistration,
} from "@/app/lib/meta-pixel-funnel-conversions";
import { trackMetaPixelEvent } from "@/app/lib/meta-pixel";
import {
  trackGoogleAdsConversion,
  trackGoogleAdsButtonClick,
  trackGoogleAdsSignupSuccess,
} from "@/app/lib/google-ads-tag";
import { clearFunnelLockedStep, forceFunnelLockedStep } from "@/app/lib/funnel-step-lock";
import { trackFunnelEvent } from "@/app/services/funnel/track-funnel-event";
import { useFunnelAnalyticsTracking } from "@/app/hooks/use-funnel-analytics-tracking";
import type { FunnelStripePaymentContext } from "@/app/components/funnel/FunnelStripePaymentForm";

function isLandingTemplatePage(page: TemplatePage): page is LandingTemplatePage {
  return page.id === "landing";
}

function layoutShellClass(_layoutType: string) {
  return "max-w-full";
}

function previewOuterChrome(
  _pageId: string,
  options: { editorChrome?: boolean; fullPageShell?: boolean },
): string {
  if (options.fullPageShell) {
    return "flex min-h-full min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto";
  }
  if (options.editorChrome) {
    return "flex w-full min-w-0 flex-col bg-white";
  }
  return "overflow-hidden rounded-2xl bg-white shadow-sm";
}

export function TemplatePreview({
  page,
  landingPage,
  landingCtaHref,
  signupNextHref,
  signupBackHref,
  interactiveForms = false,
  submitCustomerOnSignupNext = false,
  editorStepPreviewChrome = false,
  fullPageShellChrome = false,
  paymentStripeCheckout = null,
  trackingFunnelId = null,
  checkoutBusinessId = null,
  checkoutCampaignId = null,
  checkoutRestaurantId = null,
  campaignPricing,
  skipPaymentStep = false,
  campaignType = null,
  metaPixelId = null,
  metaBusinessId = null,
  googleAdsTagId = null,
  googleAdsSignupConversionLabel = null,
  googleAdsLeadConversionLabel = null,
  googleAdsBusinessId = null,
}: {
  page: TemplatePage;
  landingPage: TemplatePage;
  landingCtaHref?: string;
  signupNextHref?: string;
  signupBackHref?: string;
  interactiveForms?: boolean;
  submitCustomerOnSignupNext?: boolean;
  editorStepPreviewChrome?: boolean;
  fullPageShellChrome?: boolean;
  paymentStripeCheckout?: FunnelStripePaymentContext | null;
  trackingFunnelId?: number | null;
  checkoutBusinessId?: number | null;
  checkoutCampaignId?: number | null;
  checkoutRestaurantId?: number | null;
  campaignPricing?: CampaignPricing | null;
  skipPaymentStep?: boolean;
  campaignType?: "prepaid" | "postpaid" | null;
  metaPixelId?: string | null;
  metaBusinessId?: number | null;
  googleAdsTagId?: string | null;
  googleAdsSignupConversionLabel?: string | null;
  googleAdsLeadConversionLabel?: string | null;
  googleAdsBusinessId?: number | null;
}) {
  const resolvedCheckoutBusinessId =
    checkoutBusinessId ?? checkoutRestaurantId;
  const router = useRouter();
  const [signupSubmitting, setSignupSubmitting] = useState(false);

  const isEditorPreview = editorStepPreviewChrome;
  const formsEnabled = interactiveForms && !isEditorPreview;
  const trackingEnabled =
    !isEditorPreview && trackingFunnelId != null && trackingFunnelId >= 1;

  const { trackButtonClick: trackAnalyticsButtonClick } =
    useFunnelAnalyticsTracking(
      trackingEnabled ? trackingFunnelId : null,
      page.id,
    );

  const trackButtonClick = useCallback(
    (elementName: string, section = "CTA") => {
      if (isEditorPreview || !trackingEnabled) return;
      trackAnalyticsButtonClick(elementName, section);
      trackMetaPixelEvent("ButtonClicked", {
        pixelId: metaPixelId,
        businessId: metaBusinessId ?? resolvedCheckoutBusinessId,
        funnelId: trackingFunnelId,
        params: {
          buttonText: elementName,
          section,
          content_name: elementName,
          funnel_step: page.id,
        },
      });
      trackGoogleAdsButtonClick({
        googleAdsId: googleAdsTagId,
        businessId: googleAdsBusinessId ?? metaBusinessId ?? resolvedCheckoutBusinessId,
        funnelId: trackingFunnelId,
        params: {
          buttonText: elementName,
          section,
          content_name: elementName,
          funnel_step: page.id,
        },
      });
    },
    [
      isEditorPreview,
      trackingEnabled,
      trackAnalyticsButtonClick,
      metaPixelId,
      metaBusinessId,
      resolvedCheckoutBusinessId,
      trackingFunnelId,
      googleAdsTagId,
      googleAdsBusinessId,
      page.id,
    ],
  );

  const fromLanding = page.id === "signup";
  const layoutType = page.layoutType;
  const heroImageUrl = resolveUploadImageUrl(
    fromLanding ? landingPage.imageUrl : page.imageUrl,
  );
  const heroImageScale = fromLanding
    ? landingPage.imageScale
    : page.imageScale;

  const shell = `${layoutShellClass(layoutType)} mx-auto w-full`;
  const previewFrameClass = previewOuterChrome(page.id, {
    editorChrome: editorStepPreviewChrome,
    fullPageShell: fullPageShellChrome,
  });
  const fillFrame = fullPageShellChrome;
  const signup =
    page.id === "signup" ? (page as SignUpTemplatePage) : null;
  const showTopHero =
    !signup || !formDesignHidesTopHero(signup.formDesign);
  const landingCtaAsLink =
    !isEditorPreview &&
    page.id === "landing" &&
    landingCtaHref?.trim().length
      ? landingCtaHref.trim()
      : null;
  const signupNextAsLink =
    !isEditorPreview &&
    page.id === "signup" &&
    signupNextHref?.trim().length
      ? signupNextHref.trim()
      : null;
  const signupBackAsLink =
    !isEditorPreview &&
    page.id === "signup" &&
    signupBackHref?.trim().length
      ? signupBackHref.trim()
      : null;
  const stripeCheckout = isEditorPreview ? null : paymentStripeCheckout;
  const editorPreviewLockClass = isEditorPreview
    ? "pointer-events-none select-none"
    : "";
  const previewButtonClick = isEditorPreview ? undefined : trackButtonClick;

  const signupSubmitFlow =
    Boolean(signup) &&
    formsEnabled &&
    submitCustomerOnSignupNext &&
    Boolean(signupNextAsLink);

  const onSignupCustomerSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!signupSubmitFlow || !signupNextAsLink || !signup) return;

      const validated = validateFunnelSignupFormData(
        new FormData(e.currentTarget),
        signup.formFieldIds,
      );
      if (!validated.ok) {
        toast.error(validated.message);
        return;
      }
      const { email, phone, name } = validated.values;

      setSignupSubmitting(true);
      try {
        const customer = await createCustomer({
          name,
          email,
          phone,
          ...(resolvedCheckoutBusinessId != null &&
          resolvedCheckoutBusinessId >= 1
            ? { businessId: resolvedCheckoutBusinessId }
            : {}),
        });

        if (trackingFunnelId == null || trackingFunnelId < 1) {
          throw new Error(
            "This offer link is missing funnel details. Please open the original link and try again.",
          );
        }

        const tracked = await trackFunnelEvent({
          eventType: "signup",
          funnelId: trackingFunnelId,
          customerId: customer.id,
          visitorId: getOrCreateVisitorId(),
        });

        const signupStatus = tracked.signupStatus ?? "new";
        const isFreshSignup = signupStatus === "new";

        if (isFreshSignup) {
          await trackMetaPixelCompleteRegistration({
            pixelId: metaPixelId,
            businessId: metaBusinessId ?? resolvedCheckoutBusinessId,
            funnelId: trackingFunnelId,
            email,
            phone,
            customerId: customer.id,
          });

          const resolvedGoogleBusinessId =
            googleAdsBusinessId ?? metaBusinessId ?? resolvedCheckoutBusinessId;

          if (googleAdsTagId?.trim() && resolvedGoogleBusinessId != null) {
            await trackGoogleAdsSignupSuccess({
              googleAdsId: googleAdsTagId,
              businessId: resolvedGoogleBusinessId,
              funnelId: trackingFunnelId,
              customerId: customer.id,
              email,
              phone,
            });

            if (googleAdsLeadConversionLabel?.trim()) {
              trackGoogleAdsConversion({
                googleAdsId: googleAdsTagId,
                conversionLabel: googleAdsLeadConversionLabel,
                businessId: resolvedGoogleBusinessId,
                funnelId: trackingFunnelId,
                dedupeKey: `lead|${googleAdsTagId}|${googleAdsLeadConversionLabel}|${trackingFunnelId}|${customer.id}`,
              });
            }
            if (googleAdsSignupConversionLabel?.trim()) {
              trackGoogleAdsConversion({
                googleAdsId: googleAdsTagId,
                conversionLabel: googleAdsSignupConversionLabel,
                businessId: resolvedGoogleBusinessId,
                funnelId: trackingFunnelId,
                dedupeKey: `signup|${googleAdsTagId}|${googleAdsSignupConversionLabel}|${trackingFunnelId}|${customer.id}`,
              });
            }
          }
        }

        if (signupStatus === "already_paid") {
          toast.success("You're already registered for this offer.", {
            duration: 2800,
          });
          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, 900);
          });

          if (
            !skipPaymentStep &&
            resolvedCheckoutBusinessId != null &&
            resolvedCheckoutBusinessId >= 1
          ) {
            const checkout = await createCheckoutSession({
              customerId: customer.id,
              funnelId: trackingFunnelId,
              businessId: resolvedCheckoutBusinessId,
              campaignId: checkoutCampaignId,
            });
            clearFunnelLockedStep(trackingFunnelId);
            forceFunnelLockedStep(trackingFunnelId, "payment");
            router.replace(checkoutUrlToAppPath(checkout.checkoutUrl));
            return;
          }

          if (signupNextAsLink) {
            clearFunnelLockedStep(trackingFunnelId);
            forceFunnelLockedStep(
              trackingFunnelId,
              skipPaymentStep ? "confirmation" : "payment",
            );
            router.replace(signupNextAsLink);
          }
          return;
        }

        const successToast =
          signupStatus === "returning_continue"
            ? skipPaymentStep
              ? "Welcome back — continuing."
              : "Welcome back — continuing to your checkout."
            : skipPaymentStep
              ? "You're all set — continuing."
              : "You're all set — continuing to payment.";

        if (
          signupSubmitFlow &&
          !skipPaymentStep &&
          resolvedCheckoutBusinessId != null &&
          resolvedCheckoutBusinessId >= 1
        ) {
          const checkout = await createCheckoutSession({
            customerId: customer.id,
            funnelId: trackingFunnelId,
            businessId: resolvedCheckoutBusinessId,
            campaignId: checkoutCampaignId,
          });
          toast.success(successToast, {
            duration: 2400,
          });
          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, 1000);
          });
          clearFunnelLockedStep(trackingFunnelId);
          forceFunnelLockedStep(trackingFunnelId, "payment");
          router.replace(checkoutUrlToAppPath(checkout.checkoutUrl));
          return;
        }

        toast.success(successToast, {
          duration: 2400,
        });
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 1000);
        });
        if (signupNextAsLink) {
          clearFunnelLockedStep(trackingFunnelId);
          forceFunnelLockedStep(
            trackingFunnelId,
            skipPaymentStep ? "confirmation" : "payment",
          );
          router.replace(signupNextAsLink);
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Something went wrong.",
        );
      } finally {
        setSignupSubmitting(false);
      }
    },
    [
      signup,
      signupSubmitFlow,
      signupNextAsLink,
      router,
      trackingFunnelId,
      resolvedCheckoutBusinessId,
      checkoutCampaignId,
      skipPaymentStep,
      metaPixelId,
      metaBusinessId,
      googleAdsTagId,
      googleAdsSignupConversionLabel,
      googleAdsLeadConversionLabel,
      googleAdsBusinessId,
    ],
  );

  const fullPageLayoutClass = fillFrame
    ? "flex min-h-full min-w-0 flex-1 flex-col"
    : "";

  const frameInnerClass = fillFrame
    ? "flex min-h-full flex-1 flex-col"
    : "overflow-hidden";

  if (page.id === "payment") {
    return (
      <div
        className={`${shell} w-full min-w-0 ${fullPageLayoutClass} ${editorPreviewLockClass}`}
      >
        <div
          className={`w-full min-w-0 ${frameInnerClass} ${previewFrameClass}`}
        >
          <PaymentPagePreview
            page={page}
            landingPage={landingPage}
            interactive={formsEnabled}
            stripeCheckout={stripeCheckout}
            campaignPricing={campaignPricing}
            fillViewport={fillFrame}
          />
        </div>
      </div>
    );
  }

  if (page.id === "confirmation" && isLandingTemplatePage(landingPage)) {
    return (
      <div
        className={`${shell} w-full min-w-0 ${fullPageLayoutClass} ${editorPreviewLockClass}`}
      >
        <div
          className={`w-full min-w-0 ${
            fillFrame
              ? "flex min-h-full flex-1 flex-col"
              : "overflow-visible"
          } ${previewFrameClass}`}
        >
          <ConfirmationPagePreview
            page={page}
            landingPage={landingPage}
            fillViewport={fillFrame}
            campaignType={campaignType ?? (skipPaymentStep ? "postpaid" : null)}
          />
        </div>
      </div>
    );
  }

  if (page.id === "signup" && signup && isLandingTemplatePage(landingPage)) {
    return (
      <div className={`${shell} ${fullPageLayoutClass} ${editorPreviewLockClass}`}>
        <div
          className={`${frameInnerClass} ${previewFrameClass}`}
        >
          <SignupPagePreview
            signupPage={signup}
            landingPage={landingPage}
            heroImageUrl={heroImageUrl}
            heroImageScale={heroImageScale}
            signupBackHref={signupBackAsLink}
            signupNextHref={signupNextAsLink}
            interactiveForms={formsEnabled}
            signupSubmitFlow={signupSubmitFlow}
            signupSubmitting={signupSubmitting}
            onSignupSubmit={onSignupCustomerSubmit}
            onButtonClick={previewButtonClick}
            fillViewport={fillFrame}
          />
        </div>
      </div>
    );
  }

  if (page.id === "landing") {
    return (
      <div className={`${shell} ${fullPageLayoutClass} ${editorPreviewLockClass}`}>
        <div
          className={`${frameInnerClass} ${previewFrameClass}`}
        >
          <LandingPagePreview
            page={page}
            layoutType={layoutType}
            landingDesign={normalizeLandingDesign(
              page.id === "landing"
                ? (page as LandingTemplatePage).landingDesign
                : undefined,
            )}
            heroDesign={normalizeHeroDesign(
              page.id === "landing"
                ? (page as LandingTemplatePage).heroDesign
                : undefined,
            )}
            heroImageUrl={heroImageUrl}
            heroImageScale={heroImageScale}
            landingCtaHref={landingCtaAsLink}
            showTopHero={showTopHero}
            onButtonClick={previewButtonClick}
            fillViewport={fillFrame}
          />
        </div>
      </div>
    );
  }

  return null;
}
