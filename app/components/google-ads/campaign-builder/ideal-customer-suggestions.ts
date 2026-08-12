import type { CampaignGoalId } from "@/app/components/google-ads/campaign-builder/types";

export type IdealCustomerSuggestionContext = {
  businessName?: string;
  businessCategory?: string;
  businessType?: string;
  businessDescription?: string;
  productsServices?: string[];
  goal?: CampaignGoalId | null;
};

export type IdealCustomerSuggestionsResult = {
  industryKey: string;
  label: string;
  suggestions: string[];
  isFallback: boolean;
};

const FALLBACK_SUGGESTIONS = [
  "Local customers",
  "Professionals",
  "Families",
  "Small businesses",
] as const;

type IndustryCatalog = {
  key: string;
  label: string;
  matchers: string[];
  suggestions: string[];
};

const INDUSTRY_CATALOGS: IndustryCatalog[] = [
  {
    key: "fitness",
    label: "Fitness & Gyms",
    matchers: [
      "gym",
      "fitness",
      "workout",
      "personal train",
      "yoga",
      "crossfit",
      "pilates",
      "health club",
    ],
    suggestions: [
      "Fitness enthusiasts",
      "Busy professionals",
      "Local residents",
      "Parents",
      "Beginners",
      "People interested in fitness",
    ],
  },
  {
    key: "restaurant",
    label: "Restaurants",
    matchers: [
      "restaurant",
      "cafe",
      "coffee",
      "diner",
      "bistro",
      "food & dining",
      "food and dining",
      "bakery",
      "pizza",
      "catering",
    ],
    suggestions: [
      "Local diners",
      "Families",
      "Professionals",
      "Food enthusiasts",
      "Tourists",
      "Nearby residents",
    ],
  },
  {
    key: "home_services",
    label: "Home Services",
    matchers: [
      "home services",
      "plumb",
      "hvac",
      "electric",
      "roof",
      "lawn",
      "garden",
      "cleaning",
      "handyman",
      "pest",
      "landscap",
      "hvac",
      "air conditioning",
    ],
    suggestions: [
      "Homeowners",
      "Property managers",
      "Landlords",
      "Local residents",
      "Business owners",
    ],
  },
  {
    key: "real_estate",
    label: "Real Estate",
    matchers: [
      "real estate",
      "realtor",
      "property",
      "homes for sale",
      "apartment",
      "broker",
    ],
    suggestions: [
      "Home buyers",
      "Home sellers",
      "Property investors",
      "Renters",
      "Landlords",
      "Local families",
    ],
  },
  {
    key: "beauty",
    label: "Salon & Beauty",
    matchers: [
      "salon",
      "beauty",
      "spa",
      "hair",
      "nail",
      "barber",
      "skincare",
      "makeup",
      "personal care",
    ],
    suggestions: [
      "Local customers",
      "Beauty enthusiasts",
      "Professionals",
      "Bridal customers",
      "Regular salon customers",
    ],
  },
  {
    key: "healthcare",
    label: "Health & Wellness",
    matchers: [
      "health",
      "wellness",
      "clinic",
      "dentist",
      "dental",
      "doctor",
      "medical",
      "chiropract",
      "physio",
      "therapy",
    ],
    suggestions: [
      "Local patients",
      "Families",
      "Busy professionals",
      "Seniors",
      "Parents",
      "People seeking care nearby",
    ],
  },
  {
    key: "automotive",
    label: "Automotive",
    matchers: [
      "auto",
      "car repair",
      "mechanic",
      "detailing",
      "tire",
      "vehicle",
      "automotive",
    ],
    suggestions: [
      "Local drivers",
      "Car owners",
      "Busy professionals",
      "Families",
      "Fleet managers",
    ],
  },
  {
    key: "retail",
    label: "Retail",
    matchers: [
      "retail",
      "shop",
      "store",
      "boutique",
      "ecommerce",
      "e-commerce",
      "clothing",
    ],
    suggestions: [
      "Local shoppers",
      "Online shoppers",
      "Gift buyers",
      "Families",
      "Professionals",
    ],
  },
  {
    key: "professional_services",
    label: "Professional Services",
    matchers: [
      "law",
      "attorney",
      "accountant",
      "consult",
      "agency",
      "professional services",
      "marketing",
      "insurance",
    ],
    suggestions: [
      "Small businesses",
      "Professionals",
      "Startup founders",
      "Local business owners",
      "Decision makers",
    ],
  },
  {
    key: "education",
    label: "Education",
    matchers: [
      "school",
      "tutor",
      "education",
      "course",
      "training",
      "academy",
      "learning",
    ],
    suggestions: [
      "Students",
      "Parents",
      "Working professionals",
      "Adult learners",
      "Local families",
    ],
  },
  {
    key: "hospitality",
    label: "Travel & Hospitality",
    matchers: [
      "hotel",
      "travel",
      "hospitality",
      "vacation",
      "resort",
      "tourism",
    ],
    suggestions: [
      "Travelers",
      "Tourists",
      "Families",
      "Business travelers",
      "Local weekenders",
    ],
  },
];

function buildContextBlob(ctx: IdealCustomerSuggestionContext): string {
  return [
    ctx.businessName,
    ctx.businessCategory,
    ctx.businessType,
    ctx.businessDescription,
    ...(ctx.productsServices ?? []),
    ctx.goal ?? "",
  ]
    .map((part) => String(part ?? "").trim().toLowerCase())
    .filter(Boolean)
    .join(" ");
}

function scoreCatalog(blob: string, catalog: IndustryCatalog): number {
  let score = 0;
  for (const matcher of catalog.matchers) {
    if (blob.includes(matcher)) score += matcher.length > 8 ? 3 : 2;
  }
  return score;
}

function goalBoostedSuggestions(
  suggestions: string[],
  goal: CampaignGoalId | null | undefined,
): string[] {
  if (!goal) return suggestions;
  const extras: string[] = [];
  if (goal === "LEADS") extras.push("People ready to enquire");
  if (goal === "SALES") extras.push("Ready-to-buy customers");
  if (goal === "LOCAL_VISITS") extras.push("Nearby visitors");
  if (goal === "WEBSITE_TRAFFIC") extras.push("Online researchers");
  if (goal === "AWARENESS") extras.push("New audiences in your area");

  const merged = [...suggestions];
  for (const item of extras) {
    if (!merged.some((row) => row.toLowerCase() === item.toLowerCase())) {
      merged.push(item);
    }
  }
  return merged.slice(0, 8);
}

export function suggestIdealCustomers(
  ctx: IdealCustomerSuggestionContext,
): IdealCustomerSuggestionsResult {
  const blob = buildContextBlob(ctx);
  let best: IndustryCatalog | null = null;
  let bestScore = 0;

  for (const catalog of INDUSTRY_CATALOGS) {
    const score = scoreCatalog(blob, catalog);
    if (score > bestScore) {
      best = catalog;
      bestScore = score;
    }
  }

  if (!best || bestScore === 0) {
    return {
      industryKey: "fallback",
      label: "your business",
      suggestions: [...FALLBACK_SUGGESTIONS],
      isFallback: true,
    };
  }

  return {
    industryKey: best.key,
    label: best.label,
    suggestions: goalBoostedSuggestions(best.suggestions, ctx.goal),
    isFallback: false,
  };
}

export function mergeIdealCustomerOptions(
  suggestions: string[],
  selected: string[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of [...suggestions, ...selected]) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}
