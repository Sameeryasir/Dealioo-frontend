import { BRAND_COLORS } from "@/app/components/landing/landing-brand";

export type BillingCycle = "monthly" | "annual";

export type PricingTier = {
  price: string;
  period: string;
  /** Struck-through list price shown next to the discounted `price`. */
  originalPrice: string | null;
  promo: string | null;
  subline: string | null;
};

export type PricingFeatureGroup = {
  label: string;
  items: readonly string[];
};

export type PricingPlan = {
  id: string;
  name: string;
  badge: string | null;
  tagline: string;
  description: string;
  monthly: PricingTier;
  annual: PricingTier;
  features?: readonly string[];
  featureGroups?: readonly PricingFeatureGroup[];
  salesEmail?: string;
  cta: string;
  highlighted: boolean;
  color: string;
};

export const PRICING_PLANS: readonly PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    badge: "Perfect for small businesses",
    tagline: "Perfect for businesses getting started.",
    description: "Ideal for businesses managing marketing in-house.",
    monthly: { price: "$29", period: "/ month", originalPrice: null, promo: null, subline: "Billed monthly" },
    annual: { price: "$24", period: "/ mo", originalPrice: null, promo: null, subline: "Billed annually ($290/year)" },
    features: [
      "One location",
      "DIY Campaign Builder",
      "Landing pages",
      "QR redemption",
      "Stripe checkout",
      "Customer CRM",
      "Analytics",
    ],
    cta: "Get Started",
    highlighted: false,
    color: BRAND_COLORS.blue,
  },
  {
    id: "growth-ai",
    name: "Growth AI",
    badge: "Most Popular ⭐",
    tagline: "Everything you need to grow with AI.",
    description: "Everything in Starter, powered by AI.",
    monthly: { price: "$99", period: "/ month", originalPrice: null, promo: null, subline: "Billed monthly" },
    annual: { price: "$82", period: "/ mo", originalPrice: null, promo: null, subline: "Billed annually ($990/year)" },
    features: [
      "Everything in Starter",
      "AI Deal Generator",
      "AI Image Generation",
      "AI Copywriting",
      "AI Campaign Builder",
      "AI Chat Assistant",
      "AI Follow-ups",
      "AI Email, SMS & WhatsApp Automation",
      "Unlimited campaigns",
    ],
    cta: "Start Now",
    highlighted: true,
    color: BRAND_COLORS.pink,
  },
  {
    id: "growth-expert",
    name: "Growth Expert",
    badge: "Best ROI",
    tagline: "AI plus a dedicated marketing expert.",
    description: "Everything in Growth AI—with a dedicated marketing expert.",
    monthly: {
      price: "$299",
      period: "/ month",
      originalPrice: "$500",
      promo: null,
      subline: "Billed monthly",
    },
    annual: {
      price: "$249",
      period: "/ mo",
      originalPrice: null,
      promo: null,
      subline: "Billed annually ($2,990/year)",
    },
    salesEmail: "support@dealioo.com",
    featureGroups: [
      { label: "Included", items: ["Everything in Growth AI"] },
      {
        label: "Expert Services",
        items: [
          "Dedicated marketing expert",
          "Monthly strategy session",
          "Weekly strategy call",
          "Campaign reviews",
          "Creative feedback",
          "Growth strategy",
          "Campaign recommendations",
          "Priority support",
        ],
      },
    ],
    cta: "Talk to Us",
    highlighted: false,
    color: BRAND_COLORS.violet,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    badge: "Contact Sales",
    tagline: "Built for multi-location businesses.",
    description: "Custom plans for multi-location brands and franchises.",
    monthly: { price: "Custom", period: "", originalPrice: null, promo: null, subline: null },
    annual: { price: "Custom", period: "", originalPrice: null, promo: null, subline: null },
    salesEmail: "support@dealioo.com",
    features: [
      "Unlimited locations",
      "Multi-location & franchise",
      "White label",
      "Dedicated success manager",
      "API access",
      "Custom AI",
      "SLA",
    ],
    cta: "Contact Sales",
    highlighted: false,
    color: BRAND_COLORS.violet,
  },
] as const;

export function getPlanTier(plan: PricingPlan, billing: BillingCycle): PricingTier {
  return billing === "annual" ? plan.annual : plan.monthly;
}

export function findPricingPlan(planId: string): PricingPlan | undefined {
  return PRICING_PLANS.find((plan) => plan.id === planId);
}
