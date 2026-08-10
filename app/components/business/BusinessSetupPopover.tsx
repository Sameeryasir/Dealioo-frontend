"use client";

/**
 * Change: Business Setup opens as a centered modal popup, not a card-anchored dropdown.
 * Why: Tap should show a real popup in the middle of the screen, not a slider beside the card.
 * Related: BusinessDashboardCard, getBusinessSetup
 */

import type { BusinessSetup } from "@/app/lib/business-setup";
import { CheckCircle2, Clock3, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type BusinessSetupPopoverProps = {
  setup: BusinessSetup;
  children: ReactNode;
};

export function BusinessSetupPopover({
  setup,
  children,
}: BusinessSetupPopoverProps) {
  const router = useRouter();
  const triggerId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isComplete = setup.isComplete;

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  const stopCardNavigation = (
    event: ReactMouseEvent | ReactPointerEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleTriggerClick = (event: ReactMouseEvent) => {
    stopCardNavigation(event);
    // Card “Next: …” CTA goes to Settings — do not toggle the popup.
    if ((event.target as HTMLElement | null)?.closest?.("[data-setup-next]")) {
      return;
    }
    setOpen((current) => !current);
  };

  const goTo = (href: string) => {
    close();
    router.push(href);
  };

  const modal =
    mounted && open ? (
      <div className="org-biz-setup-modal-root">
        <button
          type="button"
          className="org-biz-setup-popover-backdrop"
          aria-label="Close business setup"
          onClick={close}
        />
        <div
          id={`${triggerId}-panel`}
          role="dialog"
          aria-modal="true"
          aria-label={
            isComplete ? "Business setup complete" : "Business setup progress"
          }
          className={`org-biz-setup-modal${
            isComplete ? " org-biz-setup-modal--complete" : ""
          }`}
          onClick={stopCardNavigation}
        >
          <div className="org-biz-setup-popover-inner">
            {isComplete ? (
              <div className="org-biz-setup-popover-complete">
                <button
                  type="button"
                  className="org-biz-setup-modal-close"
                  aria-label="Close"
                  onClick={close}
                >
                  <X className="size-4" strokeWidth={2.25} />
                </button>
                <span className="org-biz-setup-popover-complete-icon" aria-hidden>
                  <CheckCircle2 className="size-5" strokeWidth={2.25} />
                </span>
                <p className="org-biz-setup-popover-title">
                  Business setup complete
                </p>
                <p className="org-biz-setup-popover-subtitle">
                  All {setup.totalCount} setup steps are done for this business.
                </p>
                <p className="org-biz-setup-popover-complete-meta">
                  {setup.completedCount}/{setup.totalCount} ·{" "}
                  {setup.progressPercent}%
                </p>
              </div>
            ) : (
              <>
                <header className="org-biz-setup-popover-head">
                  <div className="org-biz-setup-modal-head-row">
                    <p className="org-biz-setup-popover-title">
                      Finish business setup
                    </p>
                    <button
                      type="button"
                      className="org-biz-setup-modal-close"
                      aria-label="Close"
                      onClick={close}
                    >
                      <X className="size-4" strokeWidth={2.25} />
                    </button>
                  </div>
                  <p className="org-biz-setup-popover-subtitle">
                    <span className="org-biz-setup-progress-chip">
                      {setup.completedCount} of {setup.totalCount} complete
                    </span>
                    <span className="org-biz-setup-progress-pct">
                      {setup.progressPercent}%
                    </span>
                  </p>
                </header>

                <div className="org-biz-setup-popover-groups">
                  {setup.groups.map((group) => (
                    <section
                      key={group.id}
                      className="org-biz-setup-popover-group"
                      data-group={group.id}
                      aria-label={group.label}
                    >
                      <p className="org-biz-setup-popover-group-label">
                        {group.label}
                      </p>
                      <ul className="org-biz-setup-popover-list">
                        {group.steps.map((step) => (
                          <li key={step.id}>
                            {step.done ? (
                              <span className="org-biz-setup-popover-item org-biz-setup-popover-item--done">
                                <CheckCircle2
                                  className="size-3.5 shrink-0"
                                  strokeWidth={2.25}
                                  aria-hidden
                                />
                                <span>{step.label}</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="org-biz-setup-popover-item org-biz-setup-popover-item--todo"
                                onClick={(event) => {
                                  stopCardNavigation(event);
                                  goTo(step.href);
                                }}
                              >
                                <Clock3
                                  className="size-3.5 shrink-0"
                                  strokeWidth={2.25}
                                  aria-hidden
                                />
                                <span>{step.label}</span>
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>

                <footer className="org-biz-setup-popover-footer">
                  {setup.nextRecommendedStep ? (
                    <button
                      type="button"
                      className="org-biz-setup-popover-cta"
                      onClick={(event) => {
                        stopCardNavigation(event);
                        goTo(setup.nextRecommendedStep!.href);
                      }}
                    >
                      Next: {setup.nextRecommendedStep.ctaLabel} →
                    </button>
                  ) : null}
                </footer>
              </>
            )}
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <div
        className="org-biz-card-bento-cell org-biz-card-progress-wrap org-biz-card-progress-wrap--interactive"
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `${triggerId}-panel` : undefined}
        onPointerDown={stopCardNavigation}
        onClick={handleTriggerClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            setOpen((current) => !current);
          }
        }}
      >
        {children}
      </div>
      {mounted ? createPortal(modal, document.body) : null}
    </>
  );
}
