export const REVIEW_CATEGORY_KEYS = ["food", "service", "atmosphere"] as const;

export type ReviewCategoryKey = (typeof REVIEW_CATEGORY_KEYS)[number];

export type ReviewCategoryRatings = Partial<Record<ReviewCategoryKey, number>>;

export const REVIEW_CATEGORY_LABELS: Record<ReviewCategoryKey, string> = {
  food: "Food",
  service: "Service",
  atmosphere: "Atmosphere",
};

export function formatCategoryRatingsSummary(
  ratings: ReviewCategoryRatings | null | undefined,
): string {
  if (!ratings) return "";
  return REVIEW_CATEGORY_KEYS.filter((key) => ratings[key] != null)
    .map((key) => `${REVIEW_CATEGORY_LABELS[key]} ${ratings[key]}★`)
    .join(" · ");
}
