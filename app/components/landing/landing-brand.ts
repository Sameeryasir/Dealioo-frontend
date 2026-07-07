/**
 * Dealioo brand palette, Google/Meta-inspired with fixed semantic roles
 *
 * Blue   → Primary CTA / active states
 * Pink   → Highlights / urgency
 * Orange → Offers / payments / deal value
 * Green  → Success / completed
 * Yellow → Badges / small attention
 * Navy   → Text / dark theme anchor
 */
export const BRAND_COLORS = {
  blue: "#1877F2",
  blueHover: "#0F5ED7",
  pink: "#E1306C",
  orange: "#F77737",
  green: "#34A853",
  yellow: "#FBBC05",
  violet: "#833ABA",
  navy: "#05070D",
  light: "#F8FAFF",
  cardDark: "#0B1220",
  muted: "#CBD5E1",
  gray: "#64748B",
  gray100: "#E5EAF5",
  gray400: "#94A3B8",
  gray700: "#334155",
} as const;

/** @deprecated use BRAND_COLORS, kept for component imports */
export const LOGO_COLORS = {
  blue: BRAND_COLORS.blue,
  pink: BRAND_COLORS.pink,
  purple: BRAND_COLORS.violet,
  orange: BRAND_COLORS.orange,
  green: BRAND_COLORS.green,
  yellow: BRAND_COLORS.yellow,
  red: "#EA4335",
  navy: BRAND_COLORS.navy,
} as const;

/**
 * Guest journey colors, ad → funnel → signup → pay → QR → return.
 * Blues for top-of-funnel, pink/orange for conversion, greens for retention.
 */
export const JOURNEY_STEP_COLORS = {
  ad: BRAND_COLORS.blue,
  funnel: "#4A6CF7",
  signup: BRAND_COLORS.pink,
  pay: BRAND_COLORS.orange,
  qr: BRAND_COLORS.green,
  return: "#279B52",
} as const;

/** Soft fills + rings for pipeline nodes, keeps icons readable on light band */
export function journeyStepSurface(color: string) {
  return {
    background: `color-mix(in srgb, ${color} 10%, #ffffff)`,
    boxShadow: `0 0 0 2px color-mix(in srgb, ${color} 26%, #ffffff), 0 4px 12px rgba(15, 23, 42, 0.05)`,
  };
}

export function journeyConnectorColor(fromColor: string) {
  return `color-mix(in srgb, ${fromColor} 20%, #e5eaf5)`;
}

export const OFFER_COLORS = {
  flat: BRAND_COLORS.blue,
  bogo: BRAND_COLORS.orange,
  first: BRAND_COLORS.pink,
  weekend: BRAND_COLORS.green,
} as const;

export const PILLAR_COLORS = {
  acquire: BRAND_COLORS.blue,
  convert: BRAND_COLORS.pink,
  retain: BRAND_COLORS.green,
} as const;

export const LOGO_SPECTRUM = [
  BRAND_COLORS.blue,
  BRAND_COLORS.violet,
  BRAND_COLORS.pink,
  BRAND_COLORS.orange,
  BRAND_COLORS.green,
] as const;
