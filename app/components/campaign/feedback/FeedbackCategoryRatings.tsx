"use client";

import {
  REVIEW_CATEGORY_KEYS,
  REVIEW_CATEGORY_LABELS,
  type ReviewCategoryKey,
  type ReviewCategoryRatings,
} from "@/app/components/campaign/feedback/review-categories";
import { FeedbackStarPicker } from "@/app/components/campaign/feedback/FeedbackStarPicker";

type FeedbackCategoryRatingsProps = {
  value: ReviewCategoryRatings;
  onChange: (next: ReviewCategoryRatings) => void;
};

export function FeedbackCategoryRatingsFields({
  value,
  onChange,
}: FeedbackCategoryRatingsProps) {
  const setCategory = (key: ReviewCategoryKey, rating: number) => {
    onChange({ ...value, [key]: rating });
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="brand-label mb-0.5">Details (optional)</p>
        <p className="m-0 text-xs text-brand-muted">
          Rate food, service, and atmosphere if you like.
        </p>
      </div>
      {REVIEW_CATEGORY_KEYS.map((key) => (
        <div
          key={key}
          className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-brand-soft/50 px-3 py-2"
        >
          <span className="text-sm font-semibold text-brand-navy">
            {REVIEW_CATEGORY_LABELS[key]}
          </span>
          <FeedbackStarPicker
            value={value[key] ?? 0}
            onChange={(rating) => setCategory(key, rating)}
            size="sm"
            ariaLabel={`${REVIEW_CATEGORY_LABELS[key]} rating`}
          />
        </div>
      ))}
    </div>
  );
}
