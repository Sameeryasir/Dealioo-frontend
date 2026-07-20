import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";

export type SubscriptionPlanPricingTier = {
  price: string;
  period: string;
  /** Struck-through list price shown next to the discounted `price`. */
  originalPrice: string | null;
  promo: string | null;
  subline: string | null;
};

export type SubscriptionPlanFeatureGroup = {
  label: string;
  items: string[];
};

export type SubscriptionPlanDescription = {
  badge: string | null;
  tagline: string;
  summary: string;
  features?: string[];
  featureGroups?: SubscriptionPlanFeatureGroup[];
  cta: string;
  highlighted: boolean;
  salesEmail?: string | null;
  color?: string;
  monthly: SubscriptionPlanPricingTier;
  annual: SubscriptionPlanPricingTier;
};

export type SubscriptionPlanListItem = {
  id: string;
  slug: string;
  name: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  description: SubscriptionPlanDescription | null;
};

export async function getSubscriptionPlans(): Promise<SubscriptionPlanListItem[]> {
  const res = await fetch(`${getApiBaseUrl()}/subscription-plans`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load subscription plans."),
    );
  }

  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Invalid subscription plans response.");
  }

  return data
    .map((item) => coercePlan(item))
    .filter((plan): plan is SubscriptionPlanListItem => plan != null);
}

function coercePlan(value: unknown): SubscriptionPlanListItem | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const slug = typeof row.slug === "string" ? row.slug.trim() : "";
  const name = typeof row.name === "string" ? row.name.trim() : "";
  const id = typeof row.id === "string" ? row.id : String(row.id ?? "");
  if (!slug || !name || !id) return null;

  return {
    id,
    slug,
    name,
    monthlyPrice: parsePrice(row.monthlyPrice),
    yearlyPrice: parsePrice(row.yearlyPrice),
    description: coerceDescription(row.description),
  };
}

function coerceDescription(value: unknown): SubscriptionPlanDescription | null {
  if (!value || typeof value !== "object") {
    if (typeof value === "string" && value.trim()) {
      return {
        badge: null,
        tagline: "",
        summary: value.trim(),
        cta: "Continue",
        highlighted: false,
        monthly: {
          price: "Custom",
          period: "",
          originalPrice: null,
          promo: null,
          subline: null,
        },
        annual: {
          price: "Custom",
          period: "",
          originalPrice: null,
          promo: null,
          subline: null,
        },
      };
    }
    return null;
  }

  const row = value as Record<string, unknown>;

  return {
    badge: typeof row.badge === "string" ? row.badge : null,
    tagline: typeof row.tagline === "string" ? row.tagline : "",
    summary: typeof row.summary === "string" ? row.summary : "",
    features: coerceStringArray(row.features),
    featureGroups: coerceFeatureGroups(row.featureGroups),
    cta: typeof row.cta === "string" ? row.cta : "Continue",
    highlighted: row.highlighted === true,
    salesEmail:
      typeof row.salesEmail === "string" ? row.salesEmail : undefined,
    color: typeof row.color === "string" ? row.color : undefined,
    monthly: coerceTier(row.monthly),
    annual: coerceTier(row.annual),
  };
}

function coerceTier(value: unknown): SubscriptionPlanPricingTier {
  if (!value || typeof value !== "object") {
    return {
      price: "Custom",
      period: "",
      originalPrice: null,
      promo: null,
      subline: null,
    };
  }

  const row = value as Record<string, unknown>;
  return {
    price: typeof row.price === "string" ? row.price : "Custom",
    period: typeof row.period === "string" ? row.period : "",
    originalPrice:
      typeof row.originalPrice === "string" ? row.originalPrice : null,
    promo: typeof row.promo === "string" ? row.promo : null,
    subline: typeof row.subline === "string" ? row.subline : null,
  };
}

function coerceStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter((item): item is string => typeof item === "string");
  return items.length > 0 ? items : undefined;
}

function coerceFeatureGroups(
  value: unknown,
): SubscriptionPlanFeatureGroup[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const groups = value
    .map((group) => {
      if (!group || typeof group !== "object") return null;
      const row = group as Record<string, unknown>;
      const label = typeof row.label === "string" ? row.label : "";
      const items = coerceStringArray(row.items) ?? [];
      if (!label || items.length === 0) return null;
      return { label, items };
    })
    .filter((group): group is SubscriptionPlanFeatureGroup => group != null);

  return groups.length > 0 ? groups : undefined;
}

function parsePrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
