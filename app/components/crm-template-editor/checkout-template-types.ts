export enum CheckoutTemplateType {
  SHOPIFY = "shopify",
  PREMIUM = "premium",
  MINIMAL = "minimal",
  STRIPE = "stripe",
  APPLE = "apple",
  FLOATING = "floating",
  SPLIT = "split",
  DARK = "dark",
  CRM = "crm",
  COMPACT = "compact",
  GRADIENT = "gradient",
  CARD = "card",
  BOLD = "bold",
}

export type CheckoutTheme = {
  background: string;
  buttonColor: string;
  borderRadius: string;
  shadow: string;
};

export const DEFAULT_CHECKOUT_THEME: CheckoutTheme = {
  background: "#f4f4f5",
  buttonColor: "#18181b",
  borderRadius: "12px",
  shadow: "0 12px 40px rgba(24,24,27,0.12)",
};

export function normalizeCheckoutTemplate(
  value: string | undefined | null,
): CheckoutTemplateType {
  const v = value?.trim().toLowerCase();
  const allowed = Object.values(CheckoutTemplateType) as string[];
  if (v && allowed.includes(v)) {
    return v as CheckoutTemplateType;
  }
  return CheckoutTemplateType.STRIPE;
}

export function normalizeCheckoutTheme(
  partial: Partial<CheckoutTheme> | undefined | null,
): CheckoutTheme {
  return {
    background:
      partial?.background?.trim() || DEFAULT_CHECKOUT_THEME.background,
    buttonColor:
      partial?.buttonColor?.trim() || DEFAULT_CHECKOUT_THEME.buttonColor,
    borderRadius:
      partial?.borderRadius?.trim() || DEFAULT_CHECKOUT_THEME.borderRadius,
    shadow: partial?.shadow?.trim() || DEFAULT_CHECKOUT_THEME.shadow,
  };
}
