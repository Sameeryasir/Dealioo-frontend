import type { ReactNode } from "react";
import type { CampaignPricing } from "@/app/lib/campaign-price";
import type { FunnelStripePaymentContext } from "@/app/components/funnel/FunnelStripePaymentForm";
import type { CheckoutFormStyles } from "@/app/components/payment-templates/shared/checkout-form-styles";
import type {
  PaymentTemplatePage,
  TemplatePage,
} from "@/app/components/crm-template-editor/template-types";

export type CheckoutLandingBlend = {
  isDark: boolean;
  background: string;
  primary: string;
  secondary: string;
};

export type CheckoutTemplateProps = {
  page: PaymentTemplatePage;
  landingPage: TemplatePage;
  interactive: boolean;
  stripeCheckout: FunnelStripePaymentContext | null;
  paymentSlot: ReactNode;
  campaignPricing: CampaignPricing;
  landingBlend?: CheckoutLandingBlend | null;
  formStyles: CheckoutFormStyles;
};
