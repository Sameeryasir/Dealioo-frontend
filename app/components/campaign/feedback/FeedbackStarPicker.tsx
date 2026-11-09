"use client";

import { Star } from "lucide-react";

type FeedbackStarPickerProps = {
  value: number;
  onChange: (value: number) => void;
  size?: "lg" | "sm";
  ariaLabel?: string;
};

export function FeedbackStarPicker({
  value,
  onChange,
  size = "lg",
  ariaLabel = "Star rating",
}: FeedbackStarPickerProps) {
  const starClass = size === "lg" ? "size-9" : "size-6";
  const padClass = size === "lg" ? "p-1.5" : "p-1";

  return (
    <div
      className="flex items-center justify-center gap-1 sm:gap-1.5"
      role="group"
      aria-label={ariaLabel}
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        const active = starValue <= value;
        return (
          <button
            key={starValue}
            type="button"
            aria-label={`${starValue} star${starValue === 1 ? "" : "s"}`}
            aria-pressed={value === starValue}
            onClick={() => onChange(starValue)}
            className={`cursor-pointer rounded-lg ${padClass} transition-transform duration-150 hover:scale-110 active:scale-95`}
          >
            <Star
              className={`${starClass} transition-colors duration-150 ${
                active
                  ? "fill-[var(--feedback-star,var(--brand-yellow))] text-[var(--feedback-star,var(--brand-yellow))]"
                  : "text-slate-300"
              }`}
              strokeWidth={1.75}
            />
          </button>
        );
      })}
    </div>
  );
}
