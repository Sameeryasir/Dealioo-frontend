"use client";

import { ArrowUpRight, Building2, Sparkles, X } from "lucide-react";
import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onViewPlans: () => void;
};

export function StarterPlanLimitDialog({
  open,
  onClose,
  onViewPlans,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="starter-limit-overlay" role="presentation">
      <button
        type="button"
        className="starter-limit-backdrop"
        aria-label="Close"
        onClick={onClose}
      />

      <div
        className="starter-limit-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="starter-limit-title"
      >
        <div className="starter-limit-glow" aria-hidden />

        <button
          type="button"
          className="starter-limit-close"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X className="size-4" strokeWidth={2.25} />
        </button>

        <div className="starter-limit-hero">
          <div className="starter-limit-hero-orb" aria-hidden />
          <div className="starter-limit-icon-wrap" aria-hidden>
            <Building2 className="size-7" strokeWidth={1.75} />
          </div>
          <span className="starter-limit-badge">
            <Sparkles className="size-3" strokeWidth={2.5} aria-hidden />
            Starter plan
          </span>
        </div>

        <div className="starter-limit-body">
          <h2 id="starter-limit-title" className="starter-limit-title">
            You&apos;ve filled your one business slot
          </h2>
          <p className="starter-limit-lead">
            Starter includes a single location so you can launch fast. Ready for
            another shop or brand? Upgrade and keep growing on Dealioo.
          </p>

          <div className="starter-limit-meter" aria-label="1 of 1 businesses used">
            <div className="starter-limit-meter-top">
              <span>Business locations</span>
              <span className="starter-limit-meter-count">1 / 1 used</span>
            </div>
            <div className="starter-limit-meter-track">
              <div className="starter-limit-meter-fill" />
            </div>
          </div>
        </div>

        <div className="starter-limit-actions">
          <button
            type="button"
            className="starter-limit-btn starter-limit-btn--ghost"
            onClick={onClose}
          >
            Maybe later
          </button>
          <button
            type="button"
            className="starter-limit-btn starter-limit-btn--primary"
            onClick={onViewPlans}
          >
            Upgrade plan
            <ArrowUpRight className="size-4" strokeWidth={2.5} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
