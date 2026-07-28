import { normalizeHexColor } from "@/app/components/crm-template-editor/landing-content-colors";
import {
  FRAMEWORK_LANDING_DEFAULTS,
  type FrameworkThemeDefaults,
  type LandingStyleOverrides,
  type ResolvedLandingTheme,
  type TemplateTheme,
} from "@/app/components/crm-template-editor/theme-resolver/types";

const NAMED_CSS_COLORS: Record<string, string> = {
  black: "#000000",
  white: "#FFFFFF",
  red: "#EF4444",
  blue: "#2563EB",
  green: "#16A34A",
  yellow: "#EAB308",
  orange: "#EA580C",
  purple: "#7C3AED",
  pink: "#DB2777",
  gray: "#6B7280",
  grey: "#6B7280",
  cyan: "#06B6D4",
  teal: "#0D9488",
  indigo: "#4F46E5",
  violet: "#8B5CF6",
  rose: "#F43F5E",
  slate: "#64748B",
  zinc: "#71717A",
  navy: "#1E3A5F",
  maroon: "#7F1D1D",
  gold: "#D4AF37",
};

export function resolvePaintColor(
  override: string | null | undefined,
  templateDefault: string | null | undefined,
  frameworkDefault: string,
): string {
  return (
    coercePaintColor(override) ||
    coercePaintColor(templateDefault) ||
    frameworkDefault
  );
}

export function coercePaintColor(
  value: string | null | undefined,
): string | undefined {
  const hex = normalizeHexColor(value);
  if (hex) return hex;

  const named = value?.trim().toLowerCase() ?? "";
  if (!named) return undefined;
  return NAMED_CSS_COLORS[named];
}

function firstOverride(
  ...candidates: Array<string | null | undefined>
): string | undefined {
  for (const candidate of candidates) {
    const resolved = coercePaintColor(candidate);
    if (resolved) return resolved;
  }
  return undefined;
}

export function resolveLandingTheme(input: {
  overrides: LandingStyleOverrides;
  template: TemplateTheme;
  framework?: Partial<FrameworkThemeDefaults>;
}): ResolvedLandingTheme {
  const framework = {
    ...FRAMEWORK_LANDING_DEFAULTS,
    ...input.framework,
  };
  const { overrides, template } = input;

  const ctaBackgroundOverride = firstOverride(
    overrides.ctaBackgroundColor,
    overrides.buttonBackgroundColor,
    overrides.buttonColor,
  );

  const ctaBackground = resolvePaintColor(
    ctaBackgroundOverride,
    template.primary,
    framework.ctaBackground,
  );

  const ctaBackgroundEnd = ctaBackgroundOverride
    ? ctaBackground
    : resolvePaintColor(
        undefined,
        template.secondary,
        framework.ctaBackgroundEnd,
      );

  const ctaTextOverride = firstOverride(
    overrides.ctaTextColor,
    overrides.buttonTextColor,
  );

  return {
    background: resolvePaintColor(
      overrides.backgroundColor,
      template.backgroundDefault,
      framework.background,
    ),
    headlineColor: firstOverride(
      overrides.headlineColor,
      overrides.headingColor,
    ),
    subheadlineColor: firstOverride(
      overrides.subheadlineColor,
      overrides.subheadingColor,
    ),
    bodyColor: firstOverride(overrides.bodyColor),
    ctaBackground,
    ctaBackgroundEnd,
    ctaTextColor: resolvePaintColor(
      ctaTextOverride,
      undefined,
      framework.ctaTextColor,
    ),
    headingClass: template.headingClass,
    subheadingClass: template.subheadingClass,
    bodyClass: template.bodyClass,
    badgeClass: template.badgeClass,
    dividerClass: template.dividerClass,
    ctaShadow: template.ctaShadow,
    trustClass: template.trustClass,
    heroPlaceholderClass: template.heroPlaceholderClass,
    eyebrow: template.eyebrow,
    trustLine: template.trustLine,
  };
}
