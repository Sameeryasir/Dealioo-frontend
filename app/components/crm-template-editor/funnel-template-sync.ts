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

/** Apply the active page template form preset to signup and payment page state. */
export function syncFunnelPagesWithTemplate(
  pages: TemplatePagesState,
): TemplatePagesState {
  if (pages.landing.id !== "landing") return pages;

  const landing = pages.landing as LandingTemplatePage;
  const signup = pages.signup as SignUpTemplatePage;
  const payment = pages.payment as PaymentTemplatePage;
  const syncedFormDesign = resolveSyncedFormDesign(landing, signup.formDesign);

  if (
    signup.formDesign === syncedFormDesign &&
    payment.formDesign === syncedFormDesign
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
    },
  };
}
