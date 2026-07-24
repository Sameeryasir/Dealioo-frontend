"use client";

/**
 * Change summary: Instant full-viewport loader (no blank flash, soft fade-in).
 * Why: Smooth onboarding UX — spinner + "Loading…" only.
 */
import { Loader2 } from "lucide-react";

type OnboardingPageLoadingProps = {
  /** Kept for call-site compatibility; UI always shows general "Loading…". */
  message?: string;
  compact?: boolean;
};

export function OnboardingPageLoading({
  compact = false,
}: OnboardingPageLoadingProps) {
  return (
    <div
      className={
        compact
          ? "flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 px-4"
          : "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-brand-soft px-4"
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{
        animation: "onboarding-loader-fade-in 120ms ease-out",
      }}
    >
      <style>{`
        @keyframes onboarding-loader-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <Loader2
        className="h-9 w-9 animate-spin text-brand-primary"
        strokeWidth={2}
        aria-hidden
      />
      <p className="text-center text-sm text-brand-muted">Loading…</p>
    </div>
  );
}
