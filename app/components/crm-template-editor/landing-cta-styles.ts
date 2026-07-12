import type { CSSProperties } from "react";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Base layout classes for funnel CTA buttons (colors come from the template). */
export const landingTemplateCtaLayoutClass =
  "inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-6 py-3.5 text-sm font-semibold transition hover:brightness-110 active:scale-[0.99]";

export function landingTemplateButtonStyle(
  primary: string,
  secondary: string,
  options?: {
    labelColor?: string;
    shadowOpacity?: number;
  },
): CSSProperties {
  const { r, g, b } = hexToRgb(primary);
  const opacity = options?.shadowOpacity ?? 0.28;

  return {
    backgroundImage: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
    color: options?.labelColor?.trim() || "#ffffff",
    boxShadow: `0 12px 28px rgba(${r}, ${g}, ${b}, ${opacity})`,
  };
}
