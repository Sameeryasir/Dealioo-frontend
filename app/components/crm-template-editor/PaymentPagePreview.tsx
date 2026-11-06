import dynamic from "next/dynamic";
import type { FunnelStripePaymentContext } from "@/app/components/funnel/FunnelStripePaymentForm";
import { CheckoutTemplateRenderer } from "@/app/components/payment-templates/CheckoutTemplateRenderer";
import {
  applyCheckoutTemplateAccentToTheme,
  checkoutTemplateAccentCssVars,
} from "@/app/components/crm-template-editor/checkout-template-accents";
import {
  normalizeCheckoutTemplate,
  normalizeCheckoutTheme,
  CheckoutTemplateType,
  DEFAULT_CHECKOUT_THEME,
} from "@/app/components/crm-template-editor/checkout-template-types";
import { pageBackgroundStyle } from "@/app/components/crm-template-editor/LandingPagePreview";
import {
  getLandingDesignStyle,
  normalizeLandingDesign,
  syncCheckoutThemeWithLandingDesign,
} from "@/app/components/crm-template-editor/landing-designs/registry";
import { isLandingDesignDark } from "@/app/components/crm-template-editor/landing-blended-form-styles";
import { getCheckoutFormStyles } from "@/app/components/payment-templates/shared/checkout-form-styles";
import type { CheckoutLandingBlend } from "@/app/components/payment-templates/types";
import {
  EMPTY_CAMPAIGN_PRICING,
  type CampaignPricing,
} from "@/app/lib/campaign-price";
import type {
  LandingTemplatePage,
  PaymentTemplatePage,
  TemplatePage,
} from "@/app/components/crm-template-editor/template-types";

const FunnelStripePaymentForm = dynamic(
  () =>
    import("@/app/components/funnel/FunnelStripePaymentForm").then(
      (mod) => mod.FunnelStripePaymentForm,
    ),
  { ssr: false },
);

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
  const landingStyle = landingDesignId
    ? getLandingDesignStyle(landingDesignId)
    : null;

  // Landing owns page wash; checkout template owns CTA / accent.
  const syncedPayment = (() => {
    const withLanding =
      onLanding && landingDesignId
        ? {
            ...payment,
            checkoutTheme: syncCheckoutThemeWithLandingDesign(
              payment.checkoutTheme,
              landingDesignId,
            ),
            backgroundColor:
              landingPage.backgroundColor?.trim() ||
              landingStyle?.backgroundDefault ||
              payment.backgroundColor,
          }
        : payment;

    return {
      ...withLanding,
      checkoutTheme: applyCheckoutTemplateAccentToTheme(
        withLanding.checkoutTheme,
        withLanding.checkoutTemplate,
      ),
    };
  })();

  const baseFormStyles = getCheckoutFormStyles(syncedPayment.formDesign, {
    landingDesignId,
    blendWithLanding: onLanding,
  });
  const formStyles = {
    ...baseFormStyles,
    cssVars: {
      ...baseFormStyles.cssVars,
      ...checkoutTemplateAccentCssVars(syncedPayment.checkoutTemplate),
    },
  };

  const landingBlend: CheckoutLandingBlend | null =
    onLanding && landingStyle
      ? {
          isDark: isLandingDesignDark(landingDesignId ?? undefined),
          background:
            landingPage.backgroundColor?.trim() ||
            landingStyle.backgroundDefault,
          primary: landingStyle.primary,
          secondary: landingStyle.secondary,
        }
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

  const bg =
    landingPage.backgroundColor?.trim() ||
    landingStyle?.backgroundDefault ||
    syncedPayment.backgroundColor?.trim() ||
    syncedPayment.checkoutTheme.background;

  return (
    <div
      className={`flex w-full min-w-0 flex-col overflow-x-hidden px-4 pb-8 pt-6 sm:px-5 sm:pb-10 sm:pt-8 ${
        fillViewport ? "min-h-0 flex-1" : ""
      }`}
      style={pageBackgroundStyle(bg, bg)}
    >
      {checkout}
    </div>
  );
}

export { CheckoutTemplateType };
