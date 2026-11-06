/**
 * Change: Also sync payment checkoutTemplate from the active funnel page template.
 * Why: Form design was prepared for sync, but checkout shell drifted so payment
 *      no longer matched the selected funnel page template after load.
 * Related: funnel-page-templates.ts, CrmTemplateEditor.tsx (hydrate + gallery apply)
 * MCP Context 7: single sync helper keeps landing → signup/payment aligned.
 */

import { applyCheckoutTemplateAccentToTheme } from "@/app/components/crm-template-editor/checkout-template-accents";
import { normalizeCheckoutTemplate } from "@/app/components/crm-template-editor/checkout-template-types";
import type { FormDesign } from "@/app/components/crm-template-editor/form-designs/types";
import {
  FUNNEL_PAGE_DESIGN_TEMPLATES,
  type FunnelPageDesignTemplate,
} from "@/app/components/crm-template-editor/funnel-page-templates";
import { normalizeLandingDesign } from "@/app/components/crm-template-editor/landing-designs/registry";
import type { LandingTemplatePage } from "@/app/components/crm-template-editor/template-types";
import type {
  PaymentTemplatePage,
  SignUpTemplatePage,
  TemplatePagesState,
} from "@/app/components/crm-template-editor/template-types";

export function getFunnelPageDesignTemplateById(
  templateId: string | undefined | null,
): FunnelPageDesignTemplate | null {
  const id = templateId?.trim();
  if (!id) return null;
  return FUNNEL_PAGE_DESIGN_TEMPLATES.find((template) => template.id === id) ?? null;
}

export function getFunnelPageDesignTemplateForLanding(
  landingPage: Pick<LandingTemplatePage, "pageTemplateId" | "landingDesign">,
): FunnelPageDesignTemplate | null {
  const byId = getFunnelPageDesignTemplateById(landingPage.pageTemplateId);
  if (byId) return byId;

  const landingDesign = normalizeLandingDesign(landingPage.landingDesign);
  return (
    FUNNEL_PAGE_DESIGN_TEMPLATES.find(
      (template) => template.landingDesign === landingDesign,
    ) ?? null
  );
}

/** Keep signup/payment form styling aligned with the active funnel page template. */
export function resolveSyncedFormDesign(
  landingPage: Pick<LandingTemplatePage, "pageTemplateId" | "landingDesign">,
  fallback: FormDesign,
): FormDesign {
  return (
    getFunnelPageDesignTemplateForLanding(landingPage)?.formDesign ?? fallback
  );
}

/**
 * Business rule: active funnel page template owns payment checkout shell + form chrome.
 * Applies the preset to signup + payment so steps stay visually matched.
 */
export function syncFunnelPagesWithTemplate(
  pages: TemplatePagesState,
): TemplatePagesState {
  if (pages.landing.id !== "landing") return pages;

  const landing = pages.landing as LandingTemplatePage;
  const signup = pages.signup as SignUpTemplatePage;
  const payment = pages.payment as PaymentTemplatePage;
  // Only sync when a gallery template id is saved — landingDesign fallback can
  // match the wrong pack and overwrite intentional checkout customizations.
  const designTemplate = getFunnelPageDesignTemplateById(landing.pageTemplateId);
  if (!designTemplate) return pages;

  const syncedFormDesign = designTemplate.formDesign;
  const syncedCheckout = normalizeCheckoutTemplate(
    designTemplate.checkoutTemplate,
  );
  const paymentCheckout = normalizeCheckoutTemplate(payment.checkoutTemplate);
  const syncedTheme = applyCheckoutTemplateAccentToTheme(
    payment.checkoutTheme,
    syncedCheckout,
  );

  if (
    signup.formDesign === syncedFormDesign &&
    payment.formDesign === syncedFormDesign &&
    paymentCheckout === syncedCheckout &&
    payment.checkoutTheme?.buttonColor === syncedTheme.buttonColor
  ) {
    return pages;
  }

  return {
    ...pages,
    signup: {
      ...signup,
      formDesign: syncedFormDesign,
    },
    payment: {
      ...payment,
      formDesign: syncedFormDesign,
      checkoutTemplate: syncedCheckout,
      checkoutTheme: syncedTheme,
    },
  };
}
