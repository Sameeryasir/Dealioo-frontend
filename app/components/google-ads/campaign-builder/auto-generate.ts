import type {
  AdCreativeDraft,
  CallToActionId,
  CampaignGoalId,
  GoogleCampaignBuilderDraft,
  SitelinkDraft,
  SuggestedKeyword,
} from "@/app/components/google-ads/campaign-builder/types";

const KEYWORD_LIBRARY: Record<string, string[]> = {
  Restaurant: [
    "restaurant near me",
    "family restaurant",
    "pizza",
    "burgers",
    "steak",
    "food delivery",
    "best restaurant",
    "takeaway",
  ],
  Cafe: [
    "cafe near me",
    "best coffee",
    "coffee shop",
    "brunch cafe",
    "latte near me",
    "wifi cafe",
  ],
  Salon: [
    "hair salon near me",
    "haircut",
    "balayage",
    "beauty salon",
    "men's haircut",
    "salon appointment",
  ],
  Dentist: [
    "dentist near me",
    "teeth cleaning",
    "dental clinic",
    "emergency dentist",
    "cosmetic dentist",
  ],
  Gym: [
    "gym near me",
    "fitness center",
    "personal trainer",
    "gym membership",
    "24 hour gym",
  ],
  Hotel: [
    "hotel near me",
    "best hotel",
    "hotel booking",
    "luxury hotel",
    "weekend stay",
  ],
  "Law Firm": [
    "lawyer near me",
    "attorney",
    "legal advice",
    "law firm",
    "consultation lawyer",
  ],
  "Real Estate": [
    "homes for sale",
    "real estate agent",
    "apartments for rent",
    "property near me",
  ],
  "Retail Store": [
    "shop near me",
    "store hours",
    "buy online",
    "best deals",
    "retail store",
  ],
  Plumber: [
    "plumber near me",
    "emergency plumber",
    "leak repair",
    "drain cleaning",
  ],
  Electrician: [
    "electrician near me",
    "emergency electrician",
    "wiring repair",
    "electrical service",
  ],
  Doctor: [
    "doctor near me",
    "clinic appointment",
    "family doctor",
    "medical clinic",
  ],
  Automotive: [
    "car repair near me",
    "auto service",
    "oil change",
    "brake repair",
  ],
  Bakery: ["bakery near me", "fresh bread", "custom cakes", "pastries"],
  Spa: ["spa near me", "massage", "spa day", "facial treatment"],
  Clinic: ["clinic near me", "health clinic", "book appointment"],
};

const NEGATIVE_LIBRARY: Record<string, string[]> = {
  Restaurant: ["jobs", "salary", "recipe", "diy"],
  Cafe: ["jobs", "franchise cost"],
  Salon: ["jobs", "course", "school"],
  Dentist: ["jobs", "salary", "school"],
  default: ["jobs", "free", "diy", "cheap"],
};

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function monthLabel(date = new Date()): string {
  return date.toLocaleString("en-US", { month: "long" });
}

export function generateCampaignName(
  goal: CampaignGoalId | null,
  businessName?: string,
): string {
  const month = monthLabel();
  const brand = businessName?.trim();
  switch (goal) {
    case "SALES":
      return brand ? `${brand} Sales - ${month}` : `Sales Campaign - ${month}`;
    case "LEADS":
      return brand ? `${brand} Leads - ${month}` : `Lead Campaign - ${month}`;
    case "WEBSITE_TRAFFIC":
      return brand ? `${brand} Traffic` : "Traffic Campaign";
    case "AWARENESS":
      return brand ? `${brand} Promotion` : "Business Promotion Campaign";
    case "APP_PROMOTION":
      return brand ? `${brand} App` : "App Promotion Campaign";
    default:
      return brand ? `${brand} Campaign` : "New Campaign";
  }
}

export function generateKeywordsForBusinessType(
  businessType: string,
): SuggestedKeyword[] {
  const list =
    KEYWORD_LIBRARY[businessType] ??
    [
      `${businessType.toLowerCase()} near me`,
      `best ${businessType.toLowerCase()}`,
      `${businessType.toLowerCase()} services`,
      `${businessType.toLowerCase()} prices`,
    ];
  return list.map((text) => ({
    id: uid("kw"),
    text,
    enabled: true,
  }));
}

export function generateNegativeKeywordSuggestions(
  businessType: string,
): string[] {
  return NEGATIVE_LIBRARY[businessType] ?? NEGATIVE_LIBRARY.default;
}

function clampHeadline(text: string): string {
  return text.slice(0, 30);
}

function clampDescription(text: string): string {
  return text.slice(0, 90);
}

export function generateAdSuggestions(
  draft: GoogleCampaignBuilderDraft,
): AdCreativeDraft {
  const name = draft.businessName.trim() || "Your Business";
  const type = draft.businessType || draft.businessCategory || "Business";
  const cityHint =
    draft.targetLocations.find((row) => row.type === "city")?.name ||
    draft.targetLocations.find((row) => row.type === "state")?.name ||
    draft.targetLocations.find((row) => row.type === "country")?.name?.replace(
      "United ",
      "",
    ) ||
    draft.cities[0] ||
    draft.regions[0] ||
    draft.countries[0]?.replace("United ", "") ||
    "Nearby";

  const headlinePool = [
    `Best ${type} in ${cityHint}`,
    `${name}`,
    "Open Today",
    "Book Your Visit",
    "Order Online",
    "Fresh & Local",
    "Trusted Local Choice",
    "Fast Friendly Service",
    "Special Offers Now",
    "Visit Us Today",
    "Highly Rated",
    "Family Owned",
    "Same-Day Service",
    "Quality You Can Trust",
    "Call Us Today",
  ].map(clampHeadline);

  const descriptionPool = [
    `Discover ${name}. Quality ${type.toLowerCase()} with friendly service.`,
    `Visit us today or order online. Convenient, reliable, and ready when you are.`,
    `Looking for the best ${type.toLowerCase()}? You're in the right place.`,
    `Book now and enjoy a better experience with ${name}.`,
  ].map(clampDescription);

  const url =
    draft.websiteUrl.trim() ||
    draft.landingPageUrl.trim() ||
    "https://www.example.com";

  let path1 = type.toLowerCase().replace(/\s+/g, "-").slice(0, 15);
  let path2 = "offer";
  if (draft.goal === "LEADS") path2 = "contact";
  if (draft.goal === "SALES") path2 = "shop";

  let callToAction: CallToActionId = "LEARN_MORE";
  if (draft.goal === "SALES") callToAction = "SHOP_NOW";
  if (draft.goal === "LEADS") callToAction = "GET_QUOTE";
  if (type.toLowerCase().includes("restaurant") || type === "Cafe") {
    callToAction = "ORDER_ONLINE";
  }

  return {
    id: uid("ad"),
    finalUrl: url,
    headlines: headlinePool.slice(0, 15),
    descriptions: descriptionPool.slice(0, 4),
    path1,
    path2,
    callToAction,
  };
}

export function generateCallouts(businessType: string): string[] {
  const base = [
    "Open 24/7",
    "Family Owned",
    "Professional Service",
    "Free Consultation",
  ];
  if (businessType === "Restaurant" || businessType === "Cafe") {
    return [
      "Fresh Ingredients",
      "Family Owned",
      "Open Today",
      "Fast Delivery",
      "Dine In or Takeaway",
    ];
  }
  if (businessType === "Retail Store") {
    return ["Free Shipping", "Easy Returns", "New Arrivals", "In-Store Pickup"];
  }
  return base;
}

export function generateSnippetValues(businessType: string): string[] {
  const map: Record<string, string[]> = {
    Restaurant: ["Dine-in", "Takeaway", "Delivery", "Catering"],
    Cafe: ["Coffee", "Brunch", "Pastries", "Wi-Fi"],
    Salon: ["Haircut", "Color", "Styling", "Treatments"],
    Dentist: ["Cleaning", "Whitening", "Implants", "Emergency"],
    Gym: ["Cardio", "Weights", "Classes", "Personal Training"],
    Hotel: ["Rooms", "Breakfast", "Parking", "Wi-Fi"],
  };
  return map[businessType] ?? ["Services", "Support", "Consultation", "Booking"];
}

export const SITELINK_SUGGESTION_LABELS = [
  "Menu",
  "Book Now",
  "Contact",
  "About Us",
  "Services",
  "Pricing",
  "Order Online",
  "Locations",
  "Gallery",
  "FAQ",
] as const;

export const MAX_SITELINKS = 8;

export function generateSitelinks(
  websiteUrl: string,
  _businessType?: string,
): SitelinkDraft[] {
  const homepage = normalizeWebsiteHomepage(websiteUrl);

  return SITELINK_SUGGESTION_LABELS.slice(0, MAX_SITELINKS).map(
    (text, index) => ({
      id: uid("sl"),
      text,
      url: homepage,
      description1: "",
      description2: "",
      enabled: index < 4,
    }),
  );
}

function normalizeWebsiteHomepage(websiteUrl: string): string {
  const trimmed = websiteUrl.trim();
  if (!trimmed) return "";
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const url = new URL(withProtocol);
    if (url.protocol === "http:") url.protocol = "https:";
    if (url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

export function estimateMetrics(dailyBudget: number): {
  monthlySpend: string;
  clicks: string;
  impressions: string;
  reach: string;
  cost: string;
} {
  const budget = Number.isFinite(dailyBudget) ? Math.max(0, dailyBudget) : 0;
  const monthly = budget * 30.4;
  const lowClicks = Math.max(1, Math.floor(budget / 2.2));
  const highClicks = Math.max(lowClicks, Math.floor(budget / 0.7));
  const lowImp = lowClicks * 35;
  const highImp = highClicks * 80;
  return {
    monthlySpend: `≈ $${monthly.toFixed(0)} / month`,
    clicks: `≈ ${lowClicks}–${highClicks} / day`,
    impressions: `≈ ${lowImp.toLocaleString()}–${highImp.toLocaleString()} / day`,
    reach: `≈ ${(lowImp * 0.7).toLocaleString()}–${(highImp * 0.85).toLocaleString()} people`,
    cost: `≈ $${budget.toFixed(0)} / day`,
  };
}

export function enabledKeywords(draft: GoogleCampaignBuilderDraft): string[] {
  const fromSuggestions = draft.suggestedKeywords
    .filter((k) => k.enabled)
    .map((k) => k.text.trim())
    .filter(Boolean);
  return [...new Set([...fromSuggestions, ...draft.customKeywords.map((k) => k.trim()).filter(Boolean)])];
}
