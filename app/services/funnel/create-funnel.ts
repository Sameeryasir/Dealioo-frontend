import { formDesignUsesSplitLayout } from "@/app/components/crm-template-editor/form-design-registry";
import type {
  FormFieldId,
  PaymentTemplatePage,
  SignUpTemplatePage,
  TemplatePage,
  TemplatePageId,
  TemplatePagesState,
} from "@/app/components/crm-template-editor/template-types";

import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";

export type CreateFunnelFormFieldId =
  | "first_name"
  | "last_name"
  | "email"
  | "phone";

const FORM_FIELD_TO_API: Record<FormFieldId, CreateFunnelFormFieldId> = {
  firstName: "first_name",
  lastName: "last_name",
  email: "email",
  phone: "phone",
};

export type CreateFunnelLandingPagePayload = {
  id: "landing";
  pageTitle: string;
  headline: string;
  subheadline: string;
  body: string;
  ctaLabel: string;
  heroImageSrc: string;
  heroImageScale: number;
  backgroundColor: string;
  layoutType: string;
};

export type CreateFunnelSignupPagePayload = {
  id: "signup";
  pageTitle: string;
  headline: string;
  subheadline: string;
  body: string;
  ctaLabel: string;
  heroImageSrc: string;
  heroImageScale: number;
  backgroundColor: string;
  layoutType: string;
  signupFormLayout: "split" | "stacked";
  signupFormDesign: string;
  formFieldIds: CreateFunnelFormFieldId[];
  navBackLabel: string;
  navNextLabel: string;
};

export type CreateFunnelPaymentPagePayload = {
  id: "payment";
  pageTitle: string;
  headline: string;
  subheadline: string;
  body: string;
  ctaLabel: string;
  heroImageSrc: string;
  heroImageScale: number;
  backgroundColor: string;
  layoutType: string;
  paymentFormDesign: string;
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
};

export type CreateFunnelConfirmationPagePayload = {
  id: "confirmation";
  pageTitle: string;
  headline: string;
  subheadline: string;
  body: string;
  ctaLabel: string;
  heroImageSrc: string;
  heroImageScale: number;
  backgroundColor: string;
  layoutType: string;
};

export type CreateFunnelPagesPayload = Partial<{
  landing: CreateFunnelLandingPagePayload;
  signup: CreateFunnelSignupPagePayload;
  payment: CreateFunnelPaymentPagePayload;
  confirmation: CreateFunnelConfirmationPagePayload;
}>;

export type CreateFunnelRequestBody = {
  campaignId: number;
  pages: CreateFunnelPagesPayload;
};

function mapFormFields(ids: FormFieldId[]): CreateFunnelFormFieldId[] {
  return ids.map((id) => FORM_FIELD_TO_API[id]);
}

function buildLandingPayload(
  page: TemplatePage,
): CreateFunnelLandingPagePayload {
  return {
    id: "landing",
    pageTitle: page.label,
    headline: page.heading,
    subheadline: page.subheading,
    body: page.body,
    ctaLabel: page.buttonText,
    heroImageSrc: page.imageUrl,
    heroImageScale: page.imageScale,
    backgroundColor: page.backgroundColor,
    layoutType: page.layoutType,
  };
}

function buildSignupPayload(
  page: SignUpTemplatePage,
): CreateFunnelSignupPagePayload {
  return {
    id: "signup",
    pageTitle: page.label,
    headline: page.heading,
    subheadline: page.subheading,
    body: page.body,
    ctaLabel: page.buttonText,
    heroImageSrc: page.imageUrl,
    heroImageScale: page.imageScale,
    backgroundColor: page.backgroundColor,
    layoutType: page.layoutType,
    signupFormLayout: formDesignUsesSplitLayout(page.formDesign)
      ? "split"
      : "stacked",
    signupFormDesign: page.formDesign,
    formFieldIds: mapFormFields(page.formFieldIds),
    navBackLabel: page.navBackLabel,
    navNextLabel: page.navNextLabel,
  };
}

function buildPaymentPayload(
  page: PaymentTemplatePage,
): CreateFunnelPaymentPagePayload {
  return {
    id: "payment",
    pageTitle: page.label,
    headline: page.heading,
    subheadline: page.subheading,
    body: page.body,
    ctaLabel: page.buttonText,
    heroImageSrc: page.imageUrl,
    heroImageScale: page.imageScale,
    backgroundColor: page.backgroundColor,
    layoutType: page.layoutType,
    paymentFormDesign: page.formDesign,
    payWithLinkText: page.payWithLinkText,
    checkoutDividerText: page.checkoutDividerText,
    contactSectionTitle: page.contactSectionTitle,
    paymentEmailPlaceholder: page.paymentEmailPlaceholder,
    paymentFullNamePlaceholder: page.paymentFullNamePlaceholder,
    paymentPhonePlaceholder: page.paymentPhonePlaceholder,
    paymentMethodSectionTitle: page.paymentMethodSectionTitle,
    paymentCardPlaceholder: page.paymentCardPlaceholder,
    paymentExpiryPlaceholder: page.paymentExpiryPlaceholder,
    paymentCvcPlaceholder: page.paymentCvcPlaceholder,
    paymentNameOnCardPlaceholder: page.paymentNameOnCardPlaceholder,
    paymentCardBrandLabel: page.paymentCardBrandLabel,
    paymentChooseCurrencyLabel: page.paymentChooseCurrencyLabel,
    paymentCurrencyRateHint: page.paymentCurrencyRateHint,
    paymentFooterText: page.paymentFooterText,
  };
}

function buildConfirmationPayload(
  page: TemplatePage,
): CreateFunnelConfirmationPagePayload {
  return {
    id: "confirmation",
    pageTitle: page.label,
    headline: page.heading,
    subheadline: page.subheading,
    body: page.body,
    ctaLabel: page.buttonText,
    heroImageSrc: page.imageUrl,
    heroImageScale: page.imageScale,
    backgroundColor: page.backgroundColor,
    layoutType: page.layoutType,
  };
}

export function buildCreateFunnelRequestBody(
  campaignId: number,
  pages: TemplatePagesState,
  includePageIds?: TemplatePageId[],
): CreateFunnelRequestBody {
  const include = new Set<TemplatePageId>(
    includePageIds && includePageIds.length > 0
      ? includePageIds
      : (["landing", "signup", "payment", "confirmation"] as TemplatePageId[]),
  );

  const out: CreateFunnelPagesPayload = {};
  if (include.has("landing")) {
    out.landing = buildLandingPayload(pages.landing);
  }
  if (include.has("signup")) {
    out.signup = buildSignupPayload(pages.signup as SignUpTemplatePage);
  }
  if (include.has("payment")) {
    out.payment = buildPaymentPayload(pages.payment as PaymentTemplatePage);
  }
  if (include.has("confirmation")) {
    out.confirmation = buildConfirmationPayload(pages.confirmation);
  }

  return { campaignId, pages: out };
}

export async function createFunnel(
  accessToken: string,
  body: CreateFunnelRequestBody,
): Promise<unknown> {
  if (!accessToken.trim()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!Number.isFinite(body.campaignId) || body.campaignId < 1) {
    throw new Error("Valid campaignId is required.");
  }

  const res = await fetch(`${getApiBaseUrl()}/funnel/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(await parseApiErrorMessage(res, "Could not save funnel."));
  }

  const ct = res.headers.get("content-type");
  if (ct?.includes("application/json")) {
    return res.json() as Promise<unknown>;
  }
  return undefined;
}
