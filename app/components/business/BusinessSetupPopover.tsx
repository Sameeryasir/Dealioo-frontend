"use client";

import type {
  BusinessSetup,
  BusinessSetupGroupId,
  BusinessSetupStep,
  BusinessSetupStepId,
} from "@/app/lib/business-setup";
import {
  Building2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  ImagePlus,
  Infinity as InfinityIcon,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useState,
  type ComponentType,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type BusinessSetupPopoverProps = {
  setup: BusinessSetup;
  children: ReactNode;
};

const STEP_HINTS: Record<BusinessSetupStepId, string> = {
  "business-information": "Add your business name to continue.",
  "business-logo": "Upload a logo so customers recognize you.",
  "contact-details": "Add email and phone so customers can reach you.",
  address: "Add your city and address to continue.",
  branch: "Add at least one branch to continue.",
  "twilio-number": "Choose or add your Twilio number to continue.",
  stripe: "Connect Stripe to accept payments.",
  "meta-ads": "Connect Meta Ads to run campaigns.",
};

const GROUP_BADGE: Record<BusinessSetupGroupId, string | null> = {
  business_profile: null,
  operations: "OPERATIONS",
  payments: "PAYMENTS",
  marketing: "MARKETING",
};

const STEP_ICONS: Record<
  BusinessSetupStepId,
  ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  "business-information": Building2,
  "business-logo": ImagePlus,
  "contact-details": Mail,
  address: MapPin,
  branch: Building2,
  "twilio-number": Phone,
  stripe: Building2,
  "meta-ads": InfinityIcon,
};

function StepMark({ step }: { step: BusinessSetupStep }) {
  if (step.id === "stripe") {
    return <span className="org-biz-setup-step-stripe">S</span>;
  }
  const Icon = STEP_ICONS[step.id];
  return <Icon className="size-4" strokeWidth={2.25} />;
}

export function BusinessSetupPopover({
  setup,
  children,
}: BusinessSetupPopoverProps) {
  const router = useRouter();
  const triggerId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isComplete = setup.isComplete;
  const completedSteps = setup.steps.filter((step) => step.done);
  const remainingSteps = setup.steps.filter((step) => !step.done);

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
                    <div className="org-biz-setup-head-copy">
                      <span className="org-biz-setup-head-icon" aria-hidden>
                        <ClipboardCheck className="size-5" strokeWidth={2.2} />
                      </span>
                      <div>
                        <p className="org-biz-setup-popover-title">
                          Finish business setup
                        </p>
                        <div className="org-biz-setup-popover-subtitle">
                          <span className="org-biz-setup-progress-chip">
                            {setup.completedCount} of {setup.totalCount} complete
                          </span>
                          <span className="org-biz-setup-progress-pct">
                            {setup.progressPercent}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="org-biz-setup-modal-close"
                      aria-label="Close"
                      onClick={close}
                    >
                      <X className="size-4" strokeWidth={2.25} />
                    </button>
                  </div>
                </header>

                <div className="org-biz-setup-popover-groups">
                  {completedSteps.length > 0 ? (
                    <section
                      className="org-biz-setup-status-group"
                      aria-label={`Completed (${completedSteps.length})`}
                    >
                      <p className="org-biz-setup-status-label">
                        <CheckCircle2 className="size-4" strokeWidth={2.4} />
                        Completed ({completedSteps.length})
                      </p>
                      <ul className="org-biz-setup-popover-list">
                        {completedSteps.map((step) => {
                          const badge = GROUP_BADGE[step.group];
                          return (
                            <li key={step.id}>
                              <span
                                className={`org-biz-setup-step-card org-biz-setup-step-card--done org-biz-setup-step-card--${step.group}`}
                              >
                                <span
                                  className={`org-biz-setup-step-icon org-biz-setup-step-icon--${step.id}`}
                                  aria-hidden
                                >
                                  <StepMark step={step} />
                                </span>
                                <span className="org-biz-setup-step-copy">
                                  {badge ? (
                                    <span className="org-biz-setup-step-badge">
                                      {badge}
                                    </span>
                                  ) : null}
                                  <span className="org-biz-setup-step-title">
                                    {step.label}
                                  </span>
                                </span>
                                <span
                                  className="org-biz-setup-step-check"
                                  aria-hidden
                                >
                                  <Check className="size-3" strokeWidth={3} />
                                </span>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ) : null}

                  {remainingSteps.length > 0 ? (
                    <section
                      className="org-biz-setup-status-group"
                      aria-label={`Remaining (${remainingSteps.length})`}
                    >
                      <p className="org-biz-setup-status-label org-biz-setup-status-label--remain">
                        <Clock3 className="size-4" strokeWidth={2.4} />
                        Remaining ({remainingSteps.length})
                      </p>
                      <ul className="org-biz-setup-popover-list">
                        {remainingSteps.map((step) => (
                          <li key={step.id}>
                            <button
                              type="button"
                              className="org-biz-setup-step-card org-biz-setup-step-card--todo"
                              onClick={(event) => {
                                stopCardNavigation(event);
                                goTo(step.href);
                              }}
                            >
                              <span
                                className={`org-biz-setup-step-icon org-biz-setup-step-icon--${step.id}`}
                                aria-hidden
                              >
                                <StepMark step={step} />
                              </span>
                              <span className="org-biz-setup-step-copy">
                                <span className="org-biz-setup-step-title">
                                  {step.label === "Twilio Number Selected"
                                    ? "Select Twilio number"
                                    : step.ctaLabel}
                                </span>
                                <span className="org-biz-setup-step-hint">
                                  {STEP_HINTS[step.id]}
                                </span>
                              </span>
                              <span className="org-biz-setup-pending">
                                Pending
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>

                <footer className="org-biz-setup-popover-footer">
                  <p className="org-biz-setup-footer-note">
                    <Sparkles className="size-3.5 shrink-0" strokeWidth={2.2} />
                    {setup.remainingCount === 1
                      ? "Almost there! Complete the last step to finish your business setup."
                      : "Complete the remaining steps to finish your business setup."}
                  </p>
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
