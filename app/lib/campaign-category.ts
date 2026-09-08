export const CAMPAIGN_CATEGORY_VALUES = [
  "food_and_beverage",
  "restaurants_cafes",
  "coffee_tea",
  "grocery_markets",
  "beauty_wellness",
  "fitness_sports",
  "health_medical",
  "retail",
  "fashion_apparel",
  "experiences",
  "entertainment",
  "events_nightlife",
  "travel_hospitality",
  "home_services",
  "automotive",
  "education",
  "professional_services",
  "other",
] as const;

export type CampaignCategory = (typeof CAMPAIGN_CATEGORY_VALUES)[number];

export const CAMPAIGN_CATEGORY_OPTIONS: Array<{
  value: CampaignCategory;
  label: string;
}> = [
  { value: "food_and_beverage", label: "Food & Beverage" },
  { value: "restaurants_cafes", label: "Restaurants & Cafes" },
  { value: "coffee_tea", label: "Coffee & Tea" },
  { value: "grocery_markets", label: "Grocery & Markets" },
  { value: "beauty_wellness", label: "Beauty & Wellness" },
  { value: "fitness_sports", label: "Fitness & Sports" },
  { value: "health_medical", label: "Health & Medical" },
  { value: "retail", label: "Retail" },
  { value: "fashion_apparel", label: "Fashion & Apparel" },
  { value: "experiences", label: "Experiences" },
  { value: "entertainment", label: "Entertainment" },
  { value: "events_nightlife", label: "Events & Nightlife" },
  { value: "travel_hospitality", label: "Travel & Hospitality" },
  { value: "home_services", label: "Home Services" },
  { value: "automotive", label: "Automotive" },
  { value: "education", label: "Education" },
  { value: "professional_services", label: "Professional Services" },
  { value: "other", label: "Other" },
];

export function isCampaignCategory(value: unknown): value is CampaignCategory {
  return (
    typeof value === "string" &&
    (CAMPAIGN_CATEGORY_VALUES as readonly string[]).includes(value)
  );
}

export function formatCampaignCategoryLabel(
  category: CampaignCategory | null | undefined,
): string {
  if (!category) return "Other";
  return (
    CAMPAIGN_CATEGORY_OPTIONS.find((option) => option.value === category)
      ?.label ?? "Other"
  );
}
