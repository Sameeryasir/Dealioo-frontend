/**
 * Change: Shared accent colors for checkout templates (picker + live preview).
 * Why: Sidebar thumbnails used fake red/teal swatches while the canvas kept the
 *      landing primary (e.g. purple), so Bold looked selected but paid purple.
 * Related: PaymentPagePreview.tsx, funnel-template-sync.ts,
 *          funnel-page-templates.ts
 * MCP Context 7: one accent map keeps checkout chrome consistent.
 */

import {
  CheckoutTemplateType,
  type CheckoutTheme,
  DEFAULT_CHECKOUT_THEME,
} from "@/app/components/crm-template-editor/checkout-template-types";

export type CheckoutTemplateAccent = {
  /** Top bar / strong brand strip (picker + Bold header). */
  bar: string;
  /** Soft panel wash behind the mini preview. */
  panel: string;
  /** Pay button + focus/ring accent in the real checkout. */
  buttonColor: string;
};

export const CHECKOUT_TEMPLATE_ACCENTS: Record<
  CheckoutTemplateType,
  CheckoutTemplateAccent
> = {
  [CheckoutTemplateType.SHOPIFY]: {
    bar: "#27272a",
    panel: "#fafafa",
    buttonColor: "#059669",
  },
  [CheckoutTemplateType.PREMIUM]: {
    bar: "#7c3aed",
    panel: "#f5f3ff",
    buttonColor: "#7c3aed",
  },
  [CheckoutTemplateType.MINIMAL]: {
    bar: "#e4e4e7",
    panel: "#ffffff",
    buttonColor: "#18181b",
  },
  [CheckoutTemplateType.STRIPE]: {
    bar: "#635bff",
    panel: "#ffffff",
    buttonColor: "#635bff",
  },
  [CheckoutTemplateType.APPLE]: {
    bar: "#f4f4f5",
    panel: "#ffffff",
    buttonColor: "#000000",
  },
  [CheckoutTemplateType.FLOATING]: {
    bar: "#e0f2fe",
    panel: "#ffffff",
    buttonColor: "#0284c7",
  },
  [CheckoutTemplateType.SPLIT]: {
    bar: "#18181b",
    panel: "#f4f4f5",
    buttonColor: "#f59e0b",
  },
  [CheckoutTemplateType.DARK]: {
    bar: "#09090b",
    panel: "#18181b",
    buttonColor: "#8b5cf6",
  },
  [CheckoutTemplateType.CRM]: {
    bar: "#4338ca",
    panel: "#eef2ff",
    buttonColor: "#4f46e5",
  },
  [CheckoutTemplateType.COMPACT]: {
    bar: "#0f766e",
    panel: "#f0fdfa",
    buttonColor: "#0d9488",
  },
  [CheckoutTemplateType.GRADIENT]: {
    bar: "#f43f5e",
    panel: "#fff1f2",
    buttonColor: "#e11d48",
  },
  [CheckoutTemplateType.CARD]: {
    bar: "#1d4ed8",
    panel: "#eff6ff",
    buttonColor: "#2563eb",
  },
  [CheckoutTemplateType.BOLD]: {
    bar: "#b91c1c",
    panel: "#fef2f2",
    buttonColor: "#dc2626",
  },
};

export function getCheckoutTemplateAccent(
  template: CheckoutTemplateType,
): CheckoutTemplateAccent {
  return (
    CHECKOUT_TEMPLATE_ACCENTS[template] ??
    CHECKOUT_TEMPLATE_ACCENTS[CheckoutTemplateType.STRIPE]
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => `${c}${c}`)
          .join("")
      : raw;
  if (full.length !== 6) return `rgba(24, 24, 27, ${alpha})`;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return `rgba(24, 24, 27, ${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** CSS vars so shell rings / form chrome use the template accent, not landing purple. */
export function checkoutTemplateAccentCssVars(
  template: CheckoutTemplateType,
): Record<string, string> {
  const accent = getCheckoutTemplateAccent(template).buttonColor;
  return {
    "--cf-accent": accent,
    "--cf-accent-muted": hexToRgba(accent, 0.45),
    "--cf-accent-soft": hexToRgba(accent, 0.22),
  };
}

/**
 * Business rule: landing may own the page wash; the checkout template owns the CTA color.
 */
export function applyCheckoutTemplateAccentToTheme(
  theme: CheckoutTheme | undefined | null,
  template: CheckoutTemplateType,
): CheckoutTheme {
  const base = theme ?? DEFAULT_CHECKOUT_THEME;
  return {
    ...base,
    buttonColor: getCheckoutTemplateAccent(template).buttonColor,
  };
}
