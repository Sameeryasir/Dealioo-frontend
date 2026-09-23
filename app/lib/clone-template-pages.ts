import { INITIAL_TEMPLATE_PAGES } from "@/app/components/crm-template-editor/template-data";
import type {
  LandingTemplatePage,
  TemplatePagesState,
} from "@/app/components/crm-template-editor/template-types";

export function cloneTemplatePages(): TemplatePagesState {
  return JSON.parse(JSON.stringify(INITIAL_TEMPLATE_PAGES)) as TemplatePagesState;
}

export function applyCampaignOfferToLandingPages(
  pages: TemplatePagesState,
  offer?: string | null,
): TemplatePagesState {
  const trimmed = offer?.trim();
  if (!trimmed || pages.landing.id !== "landing") {
    return pages;
  }

  const landing = pages.landing as LandingTemplatePage;
  if (landing.eyebrow?.trim() === trimmed) {
    return pages;
  }

  return {
    ...pages,
    landing: {
      ...landing,
      eyebrow: trimmed,
    },
  };
}
