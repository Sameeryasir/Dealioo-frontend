"use client";

import {
  FunnelStripePaymentForm,
  type FunnelStripePaymentContext,
} from "@/app/components/funnel/FunnelStripePaymentForm";
import { CheckoutTemplateRenderer } from "@/app/components/payment-templates/CheckoutTemplateRenderer";
import {
  normalizeCheckoutTemplate,
  normalizeCheckoutTheme,
  CheckoutTemplateType,
  DEFAULT_CHECKOUT_THEME,
} from "@/app/components/crm-template-editor/checkout-template-types";
import { LandingFunnelStepShell } from "@/app/components/crm-template-editor/LandingFunnelStepShell";
import {
  normalizeLandingDesign,
  syncCheckoutThemeWithLandingDesign,
} from "@/app/components/crm-template-editor/landing-designs/registry";
import { getCheckoutFormStyles } from "@/app/components/payment-templates/shared/checkout-form-styles";
import {
  EMPTY_CAMPAIGN_PRICING,
  type CampaignPricing,
} from "@/app/lib/campaign-price";
import type {
  LandingTemplatePage,
  PaymentTemplatePage,
  TemplatePage,
} from "@/app/components/crm-template-editor/template-types";

function isLandingTemplatePage(page: TemplatePage): page is LandingTemplatePage {
  return page.id === "landing";
}

export function normalizePaymentPage(page: PaymentTemplatePage): PaymentTemplatePage {
  return {
    ...page,
    checkoutTemplate: normalizeCheckoutTemplate(page.checkoutTemplate),
    showCoupon: page.showCoupon ?? true,
    showPhoneField: page.showPhoneField ?? true,
    showAddressField: page.showAddressField ?? true,
    showOrderSummary: page.showOrderSummary ?? true,
    checkoutTheme: normalizeCheckoutTheme(page.checkoutTheme ?? DEFAULT_CHECKOUT_THEME),
  };
}

export function PaymentPagePreview({
  page,
  landingPage,
  interactive = false,
  stripeCheckout = null,
  campaignPricing,
  fillViewport = false,
}: {
  page: TemplatePage;
  landingPage: TemplatePage;
  interactive?: boolean;
  stripeCheckout?: FunnelStripePaymentContext | null;
  campaignPricing?: CampaignPricing | null;
  fillViewport?: boolean;
}) {
  const pricing = campaignPricing ?? EMPTY_CAMPAIGN_PRICING;
  const payment = normalizePaymentPage(page as PaymentTemplatePage);
  const stripeMode = Boolean(interactive && stripeCheckout);

  const onLanding = isLandingTemplatePage(landingPage);
  const landingDesignId = onLanding
    ? normalizeLandingDesign(landingPage.landingDesign)
    : null;

  const syncedPayment =
    onLanding && landingDesignId
      ? {
          ...payment,
          checkoutTheme: syncCheckoutThemeWithLandingDesign(
            payment.checkoutTheme,
            landingDesignId,
          ),
        }
      : payment;

  const formStyles = getCheckoutFormStyles(syncedPayment.formDesign, {
    landingDesignId,
    blendWithLanding: onLanding,
  });

  const landingBlend = onLanding
    ? { isDark: formStyles.isDark }
    : null;

  const paymentSlot =
    stripeMode && stripeCheckout ? (
      <FunnelStripePaymentForm
        context={stripeCheckout}
        page={syncedPayment}
        formStyles={formStyles}
      />
    ) : null;

  const checkout = (
    <CheckoutTemplateRenderer
      page={syncedPayment}
      landingPage={landingPage}
      interactive={interactive}
      stripeCheckout={stripeCheckout}
      paymentSlot={paymentSlot}
      campaignPricing={pricing}
      landingBlend={landingBlend}
      formStyles={formStyles}
    />
  );

  if (!isLandingTemplatePage(landingPage)) {
    return checkout;
  }

  return (
    <LandingFunnelStepShell
      landingPage={landingPage}
      heroImageUrl={landingPage.imageUrl}
      heroImageScale={landingPage.imageScale}
      fillViewport={fillViewport}
    >
      {checkout}
    </LandingFunnelStepShell>
  );
}

export { CheckoutTemplateType };
