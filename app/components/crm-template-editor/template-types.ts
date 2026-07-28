export type TemplatePageId =
  | "landing"
  | "signup"
  | "payment"
  | "confirmation";

export type FormFieldId = "firstName" | "lastName" | "email" | "phone";

import type {
  CheckoutTemplateType,
  CheckoutTheme,
} from "@/app/components/crm-template-editor/checkout-template-types";
import type { FormDesign } from "@/app/components/crm-template-editor/form-designs/types";
import type { HeroDesign } from "@/app/components/crm-template-editor/hero-designs/types";
import type { LandingDesign } from "@/app/components/crm-template-editor/landing-designs/types";
import type { LandingContentSectionId } from "@/app/components/crm-template-editor/landing-sections";
export type { FormDesign, HeroDesign, LandingDesign };
export type { CheckoutTemplateType, CheckoutTheme };

export interface TemplatePageBase {
  id: TemplatePageId;
  label: string;
  heading: string;
  subheading: string;
  body: string;
  buttonText: string;
  imageUrl: string;
  imageScale: number;
  backgroundColor: string;
  layoutType: string;
}

export interface SignUpTemplatePage extends TemplatePageBase {
  id: "signup";
  formFieldIds: FormFieldId[];
  formDesign: FormDesign;
  navBackLabel: string;
  navNextLabel: string;
}

export interface PaymentTemplatePage extends TemplatePageBase {
  id: "payment";
  checkoutTemplate: CheckoutTemplateType;
  showCoupon: boolean;
  showPhoneField: boolean;
  showAddressField: boolean;
  showOrderSummary: boolean;
  checkoutTheme: CheckoutTheme;
  formDesign: FormDesign;
  payWithLinkText: string;
  checkoutDividerText: string;
  contactSectionTitle: string;
  paymentEmailPlaceholder: string;
  paymentFullNamePlaceholder: string;
  paymentPhonePlaceholder: string;
  paymentMethodSectionTitle: string;
  paymentCardPlaceholder: string;
  paymentExpiryPlaceholder: string;
  paymentCvcPlaceholder: string;
  paymentNameOnCardPlaceholder: string;
  paymentCardBrandLabel: string;
  paymentChooseCurrencyLabel: string;
  paymentCurrencyRateHint: string;
  paymentFooterText: string;
}

export type LandingTemplatePage = TemplatePageBase & {
  id: "landing";
  landingDesign: LandingDesign;
  heroDesign: HeroDesign;
  contentSectionOrder?: LandingContentSectionId[];
  pageTemplateId?: string;
  copyTemplateId?: string;
  headingColor: string;
  subheadingColor: string;
  bodyColor: string;
  buttonTextColor: string;
  buttonBackgroundColor: string;
};

export type TemplatePage =
  | LandingTemplatePage
  | (TemplatePageBase & { id: "confirmation" })
  | SignUpTemplatePage
  | PaymentTemplatePage;

export type TemplatePagesState = Record<TemplatePageId, TemplatePage>;

export type TemplatePagePatch = Partial<Omit<TemplatePageBase, "id">> &
  Partial<
    Pick<
      LandingTemplatePage,
      | "landingDesign"
      | "heroDesign"
      | "contentSectionOrder"
      | "pageTemplateId"
      | "copyTemplateId"
      | "headingColor"
      | "subheadingColor"
      | "bodyColor"
      | "buttonTextColor"
      | "buttonBackgroundColor"
    >
  > &
  Partial<
    Pick<
      SignUpTemplatePage,
      "formFieldIds" | "formDesign" | "navBackLabel" | "navNextLabel"
    >
  > &
  Partial<
    Pick<
      PaymentTemplatePage,
      | "checkoutTemplate"
      | "showCoupon"
      | "showPhoneField"
      | "showAddressField"
      | "showOrderSummary"
      | "checkoutTheme"
      | "formDesign"
      | "payWithLinkText"
      | "checkoutDividerText"
      | "contactSectionTitle"
      | "paymentEmailPlaceholder"
      | "paymentFullNamePlaceholder"
      | "paymentPhonePlaceholder"
      | "paymentMethodSectionTitle"
      | "paymentCardPlaceholder"
      | "paymentExpiryPlaceholder"
      | "paymentCvcPlaceholder"
      | "paymentNameOnCardPlaceholder"
      | "paymentCardBrandLabel"
      | "paymentChooseCurrencyLabel"
      | "paymentCurrencyRateHint"
      | "paymentFooterText"
    >
  >;
