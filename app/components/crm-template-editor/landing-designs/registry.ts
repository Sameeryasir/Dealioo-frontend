import {
  landingDesignStyles,
  type LandingDesign,
} from "@/app/components/crm-template-editor/landing-designs/landing-design-catalog";

const DEFAULT_LANDING_DESIGN: LandingDesign = "classic_offer";

export type { LandingDesign };

export function normalizeLandingDesign(
  value: string | undefined | null,
): LandingDesign {
  if (value && value in landingDesignStyles) {
    return value as LandingDesign;
  }
  return DEFAULT_LANDING_DESIGN;
}

export function getLandingDesignStyle(design: LandingDesign | string | undefined) {
  return landingDesignStyles[normalizeLandingDesign(design)];
}

/** Keep payment CTA color aligned with the active landing template palette. */
export function syncCheckoutThemeWithLandingDesign<
  T extends { buttonColor: string },
>(theme: T, landingDesign: LandingDesign | string | undefined): T {
  const { primary } = getLandingDesignStyle(landingDesign);
  return {
    ...theme,
    buttonColor: primary,
  };
}

export { landingDesignStyles, LANDING_DESIGN_OPTIONS } from "@/app/components/crm-template-editor/landing-designs/landing-design-catalog";
