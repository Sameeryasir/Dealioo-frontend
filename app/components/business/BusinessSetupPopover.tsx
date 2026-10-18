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
  ChevronRight,
  Image as ImageIcon,
  MapPin,
  UserRound,
  X,
} from "lucide-react";
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

function stepTitle(step: BusinessSetupStep): string {
  if (step.id === "twilio-number") return "Select Twilio number";
  return step.done ? step.label : step.ctaLabel;
}

function StepGlyph({ id }: { id: BusinessSetupStepId }) {
  if (id === "twilio-number") {
    return (
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <circle cx="12" cy="12" r="12" fill="#F22F46" />
        <circle cx="8.2" cy="8.2" r="2.15" fill="#fff" />
        <circle cx="15.8" cy="8.2" r="2.15" fill="#fff" />
        <circle cx="8.2" cy="15.8" r="2.15" fill="#fff" />
        <circle cx="15.8" cy="15.8" r="2.15" fill="#fff" />
      </svg>
    );
  }
  if (id === "stripe") return <StripeLogo className="size-4" />;
  if (id === "meta-ads") return <MetaLogo className="size-4" />;
  if (id === "google-ads") return <GoogleAdsLogo className="size-4" />;

  const iconClass = "size-4";
  if (id === "business-information") return <Building2 className={iconClass} />;
  if (id === "business-logo") return <ImageIcon className={iconClass} />;
  if (id === "contact-details") return <UserRound className={iconClass} />;
  if (id === "address") return <MapPin className={iconClass} />;
  return null;
}

function SetupProgressRing({ percent }: { percent: number }) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <span className="org-biz-setup-ring" aria-hidden>
      <svg viewBox="0 0 44 44">
        <circle className="org-biz-setup-ring-track" cx="22" cy="22" r={radius} />
        <circle
          className="org-biz-setup-ring-fill"
          cx="22"
          cy="22"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 22 22)"
        />
      </svg>
      <span>{percent}%</span>
    </span>
  );
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
  return (
    <div className="org-biz-setup-step-card org-biz-setup-step-card--todo">
      <span className={`org-biz-setup-step-icon org-biz-setup-step-icon--${step.id}`}>
        <StepGlyph id={step.id} />
      </span>
      <span className="org-biz-setup-step-copy">
        <span className="org-biz-setup-step-title-row">
          <span className="org-biz-setup-step-title">{stepTitle(step)}</span>
          {step.necessary ? (
            <span className="org-biz-setup-required-pill">Required</span>
          ) : null}
        </span>
        <span className="org-biz-setup-step-hint">
          {step.necessary ? "Not connected. " : ""}
          {STEP_HINTS[step.id]}
        </span>
      </span>
      {canGo ? (
        <button
          type="button"
          className="org-biz-setup-pending"
          onClick={(event) => {
            stopCardNavigation(event);
            onGo(step.href);
          }}
        >
          Go
          <ChevronRight className="size-3.5" strokeWidth={2.75} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

function CompletedStepRow({ step }: { step: BusinessSetupStep }) {
  return (
    <span className="org-biz-setup-step-card org-biz-setup-step-card--done">
      <span className={`org-biz-setup-step-icon org-biz-setup-step-icon--${step.id}`}>
        <StepGlyph id={step.id} />
      </span>
      <span className="org-biz-setup-step-copy">
        <span className="org-biz-setup-step-title">{step.label}</span>
      </span>
      <span className="org-biz-setup-done-pill">
        <Check className="size-3" strokeWidth={3} aria-hidden />
        Completed
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
  const remainingIntegrations = remainingCore.filter((step) => step.necessary);
  const remainingOther = remainingCore.filter((step) => !step.necessary);
  const nextStep = remainingIntegrations[0] ?? remainingOther[0] ?? null;

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

  const remainingLabel =
    setup.remainingCount === 1
      ? "You're almost there! Just 1 more step to go."
      : `You're almost there! Just ${setup.remainingCount} more steps to go.`;

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
                        <Check className="size-4" strokeWidth={3} />
                      </span>
                      <div>
                        <p className="org-biz-setup-popover-title">
                          Finish business setup
                        </p>
                        <p className="org-biz-setup-popover-subtitle">
                          Complete a few simple steps to get your business ready
                          and running.
                        </p>
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

                  <div className="org-biz-setup-progress-banner">
                    <SetupProgressRing percent={setup.progressPercent} />
                    <div className="org-biz-setup-progress-copy">
                      <p className="org-biz-setup-progress-title">
                        {setup.completedCount} of {setup.totalCount} complete
                      </p>
                      <p className="org-biz-setup-progress-sub">{remainingLabel}</p>
                    </div>
                    {canManageSetup && nextStep ? (
                      <button
                        type="button"
                        className="org-biz-setup-progress-next"
                        aria-label={`Go to ${stepTitle(nextStep)}`}
                        onClick={(event) => {
                          stopCardNavigation(event);
                          goTo(nextStep.href);
                        }}
                      >
                        <ChevronRight className="size-4" strokeWidth={2.5} />
                      </button>
                    ) : (
                      <ChevronRight
                        className="org-biz-setup-progress-chevron size-4"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                    )}
                  </div>
                </header>

                <div className="org-biz-setup-popover-groups">
                  <ul className="org-biz-setup-popover-list">
                    {[...remainingIntegrations, ...remainingOther].map((step) => (
                      <li key={step.id}>
                        <RemainingStepRow
                          step={step}
                          onGo={goTo}
                          stopCardNavigation={stopCardNavigation}
                          canGo={canManageSetup}
                        />
                      </li>
                    ))}
                    {completedCore.map((step) => (
                      <li key={step.id}>
                        <CompletedStepRow step={step} />
                      </li>
                    ))}
                  </ul>
                </div>

                <footer className="org-biz-setup-popover-footer">
                  <span className="org-biz-setup-footer-check" aria-hidden>
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                  <p className="org-biz-setup-footer-note">
                    <span className="org-biz-setup-footer-title">
                      {setup.remainingCount === 1 ? "Almost there!" : "Keep going"}
                    </span>
                    <span>
                      {remainingIntegrations.length > 0
                        ? "Connect the required integrations shown above."
                        : setup.remainingCount === 1
                          ? "Complete the last step to finish your business setup."
                          : "Complete the remaining steps to finish your business setup."}
                    </span>
                  </p>
                  {canManageSetup && nextStep ? (
                    <button
                      type="button"
                      className="org-biz-setup-footer-go"
                      aria-label={`Continue to ${stepTitle(nextStep)}`}
                      onClick={(event) => {
                        stopCardNavigation(event);
                        goTo(nextStep.href);
                      }}
                    >
                      <ChevronRight className="size-4" strokeWidth={2.75} />
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
      {modal ? createPortal(modal, document.body) : null}
    </>
  );
}
