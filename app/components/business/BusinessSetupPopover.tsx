"use client";

import type {
  BusinessSetup,
  BusinessSetupStep,
  BusinessSetupStepId,
} from "@/app/lib/business-setup";
import {
  GoogleAdsLogo,
  MetaLogo,
  StripeLogo,
} from "@/app/components/landing/LandingIntegrationLogos";
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  ImagePlus,
  Mail,
  MapPin,
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
  canManageSetup?: boolean;
};

const STEP_HINTS: Record<BusinessSetupStepId, string> = {
  "business-information": "Add your business name to continue.",
  "business-logo": "Upload a logo so customers recognize you.",
  "contact-details": "Add email and phone so customers can reach you.",
  address: "Add your city and address to continue.",
  "twilio-number": "Choose or add your Twilio number to continue.",
  stripe: "Connect Stripe to accept payments.",
  "meta-ads": "Connect Meta Ads to run campaigns.",
  "google-ads": "Connect Google Ads to run campaigns.",
};

const STEP_ICONS: Partial<
  Record<
    BusinessSetupStepId,
    ComponentType<{ className?: string; strokeWidth?: number }>
  >
> = {
  "business-information": Building2,
  "business-logo": ImagePlus,
  "contact-details": Mail,
  address: MapPin,
};

function TwilioMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden role="img">
      <circle cx="12" cy="12" r="12" fill="#F22F46" />
      <circle cx="8.2" cy="8.2" r="2.15" fill="#fff" />
      <circle cx="15.8" cy="8.2" r="2.15" fill="#fff" />
      <circle cx="8.2" cy="15.8" r="2.15" fill="#fff" />
      <circle cx="15.8" cy="15.8" r="2.15" fill="#fff" />
    </svg>
  );
}

function StepMark({ step }: { step: BusinessSetupStep }) {
  if (step.id === "stripe") {
    return <StripeLogo className="size-4" />;
  }
  if (step.id === "meta-ads") {
    return <MetaLogo className="size-4" />;
  }
  if (step.id === "google-ads") {
    return <GoogleAdsLogo className="size-4" />;
  }
  if (step.id === "twilio-number") {
    return <TwilioMark className="size-4" />;
  }
  const Icon = STEP_ICONS[step.id];
  if (!Icon) return null;
  return <Icon className="size-4" strokeWidth={2.25} />;
}

function RemainingStepRow({
  step,
  onGo,
  stopCardNavigation,
  canGo,
}: {
  step: BusinessSetupStep;
  onGo: (href: string) => void;
  stopCardNavigation: (event: ReactMouseEvent | ReactPointerEvent) => void;
  canGo: boolean;
}) {
  const title =
    step.label === "Twilio Number Selected"
      ? "Select Twilio number"
      : step.ctaLabel;

  const body = (
    <>
      <span
        className={`org-biz-setup-step-icon org-biz-setup-step-icon--${step.id}`}
        aria-hidden
      >
        <StepMark step={step} />
      </span>
      <span className="org-biz-setup-step-copy">
        {step.necessary ? (
          <span className="org-biz-setup-step-badge org-biz-setup-step-badge--necessary">
            Necessary
          </span>
        ) : null}
        <span className="org-biz-setup-step-title">{title}</span>
        <span className="org-biz-setup-step-hint">{STEP_HINTS[step.id]}</span>
      </span>
      {canGo ? (
        <span className="org-biz-setup-pending">
          Go
          <ChevronRight className="size-3.5" strokeWidth={2.75} aria-hidden />
        </span>
      ) : null}
    </>
  );

  if (!canGo) {
    return (
      <div className="org-biz-setup-step-card org-biz-setup-step-card--todo">
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="org-biz-setup-step-card org-biz-setup-step-card--todo"
      onClick={(event) => {
        stopCardNavigation(event);
        onGo(step.href);
      }}
    >
      {body}
    </button>
  );
}

function CompletedStepRow({ step }: { step: BusinessSetupStep }) {
  return (
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
        {step.necessary ? (
          <span className="org-biz-setup-step-badge org-biz-setup-step-badge--necessary">
            Necessary
          </span>
        ) : null}
        <span className="org-biz-setup-step-title">{step.label}</span>
      </span>
      <span className="org-biz-setup-step-check" aria-hidden>
        <Check className="size-3" strokeWidth={3} />
      </span>
    </span>
  );
}

export function BusinessSetupPopover({
  setup,
  children,
  canManageSetup = true,
}: BusinessSetupPopoverProps) {
  const router = useRouter();
  const triggerId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isComplete = setup.isComplete;
  const remainingCore = setup.coreSteps.filter((step) => !step.done);
  const completedCore = setup.coreSteps.filter((step) => step.done);
  const [completedOpen, setCompletedOpen] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    setCompletedOpen(false);
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
                  All {setup.totalCount} required setup steps are done for this
                  business.
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
                  {remainingCore.length > 0 ? (
                    <section
                      className="org-biz-setup-status-group"
                      aria-label={`Remaining (${remainingCore.length})`}
                    >
                      <p className="org-biz-setup-status-label org-biz-setup-status-label--remain">
                        <Clock3 className="size-4" strokeWidth={2.4} />
                        Remaining ({remainingCore.length})
                      </p>
                      <ul className="org-biz-setup-popover-list">
                        {remainingCore.map((step) => (
                          <li key={step.id}>
                            <RemainingStepRow
                              step={step}
                              onGo={goTo}
                              stopCardNavigation={stopCardNavigation}
                              canGo={canManageSetup}
                            />
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {completedCore.length > 0 ? (
                    <section
                      className="org-biz-setup-status-group"
                      aria-label={`Completed (${completedCore.length})`}
                    >
                      <button
                        type="button"
                        className="org-biz-setup-status-label org-biz-setup-completed-summary"
                        aria-expanded={completedOpen}
                        onClick={(event) => {
                          stopCardNavigation(event);
                          setCompletedOpen((current) => !current);
                        }}
                      >
                        <CheckCircle2 className="size-4" strokeWidth={2.4} />
                        <span>Completed ({completedCore.length})</span>
                        <ChevronDown
                          className={`org-biz-setup-completed-chevron size-4${
                            completedOpen
                              ? " org-biz-setup-completed-chevron--open"
                              : ""
                          }`}
                          strokeWidth={2.4}
                          aria-hidden
                        />
                      </button>
                      {completedOpen ? (
                        <ul className="org-biz-setup-popover-list org-biz-setup-completed-list">
                          {completedCore.map((step) => (
                            <li key={step.id}>
                              <CompletedStepRow step={step} />
                            </li>
                          ))}
                        </ul>
                      ) : null}
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
      {modal ? createPortal(modal, document.body) : null}
    </>
  );
}
