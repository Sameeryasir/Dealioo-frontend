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

export const CHECKOUT_TEMPLATE_OPTIONS: {
  value: CheckoutTemplateType;
  label: string;
  description: string;
}[] = [
  {
    value: CheckoutTemplateType.SHOPIFY,
    label: "Shopify",
    description: "Classic commerce checkout with sticky summary.",
  },
  {
    value: CheckoutTemplateType.PREMIUM,
    label: "Premium",
    description: "Modern gradients, glass panels, bold CTA.",
  },
  {
    value: CheckoutTemplateType.MINIMAL,
    label: "Minimal",
    description: "Clean whitespace-focused layout.",
  },
  {
    value: CheckoutTemplateType.STRIPE,
    label: "Stripe Style",
    description: "Familiar Stripe-like two-column flow.",
  },
  {
    value: CheckoutTemplateType.APPLE,
    label: "Apple",
    description: "Rounded, soft, high-contrast mobile feel.",
  },
  {
    value: CheckoutTemplateType.FLOATING,
    label: "Floating",
    description: "Elevated card floating on gradient backdrop.",
  },
  {
    value: CheckoutTemplateType.SPLIT,
    label: "Split Layout",
    description: "Card left, order summary right.",
  },
  {
    value: CheckoutTemplateType.DARK,
    label: "Dark",
    description: "Dark premium checkout theme.",
  },
  {
    value: CheckoutTemplateType.CRM,
    label: "CRM",
    description: "HubSpot / GoHighLevel style CRM checkout.",
  },
  {
    value: CheckoutTemplateType.COMPACT,
    label: "Compact",
    description: "Dense single-column checkout for mobile speed.",
  },
  {
    value: CheckoutTemplateType.GRADIENT,
    label: "Gradient",
    description: "Bold gradient wash behind the form.",
  },
  {
    value: CheckoutTemplateType.CARD,
    label: "Card",
    description: "Centered elevated payment card.",
  },
  {
    value: CheckoutTemplateType.BOLD,
    label: "Bold",
    description: "Large CTA and strong color framing.",
  },
];

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
