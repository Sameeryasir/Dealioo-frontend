import type { LandingDesignStyle } from "@/app/components/crm-template-editor/landing-designs/types";

export type TemplateTheme = Pick<
  LandingDesignStyle,
  | "primary"
  | "secondary"
  | "backgroundDefault"
  | "headingClass"
  | "subheadingClass"
  | "bodyClass"
  | "badgeClass"
  | "dividerClass"
  | "ctaShadow"
  | "trustClass"
  | "heroPlaceholderClass"
  | "eyebrow"
  | "trustLine"
> & {
  id?: string;
};

export type LandingStyleOverrides = {
  backgroundColor?: string | null;
  headlineColor?: string | null;
  headingColor?: string | null;
  subheadlineColor?: string | null;
  subheadingColor?: string | null;
  bodyColor?: string | null;
  ctaTextColor?: string | null;
  buttonTextColor?: string | null;
  ctaBackgroundColor?: string | null;
  buttonBackgroundColor?: string | null;
  buttonColor?: string | null;
};

export type FrameworkThemeDefaults = {
  background: string;
  ctaBackground: string;
  ctaBackgroundEnd: string;
  ctaTextColor: string;
};

export type ResolvedLandingTheme = {
  background: string;
  headlineColor?: string;
  subheadlineColor?: string;
  bodyColor?: string;
  ctaBackground: string;
  ctaBackgroundEnd: string;
  ctaTextColor: string;
  headingClass: string;
  subheadingClass: string;
  bodyClass: string;
  badgeClass: string;
  dividerClass: string;
  ctaShadow: string;
  trustClass: string;
  heroPlaceholderClass: string;
  eyebrow: string;
  trustLine: string;
};

export const FRAMEWORK_LANDING_DEFAULTS: FrameworkThemeDefaults = {
  background: "#F8F7FF",
  ctaBackground: "#2563EB",
  ctaBackgroundEnd: "#1D4ED8",
  ctaTextColor: "#FFFFFF",
};
