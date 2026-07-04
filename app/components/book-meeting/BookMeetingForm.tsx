"use client";
import {
  BOOK_MEETING_STEPS,
  DEFAULT_MEETING_FORM_VALUES,
  MARKETING_ACTIVITY_OPTIONS,
  type MeetingFormValues,
} from "@/app/components/book-meeting/book-meeting-config";
import { BookMeetingBusinessStep } from "@/app/components/book-meeting/BookMeetingBusinessStep";
import { BookMeetingChoiceGrid } from "@/app/components/book-meeting/BookMeetingChoiceGrid";
import { BookMeetingFinalStep } from "@/app/components/book-meeting/BookMeetingFinalStep";
import { BookMeetingNav } from "@/app/components/book-meeting/BookMeetingNav";
import { BookMeetingRevenueStep } from "@/app/components/book-meeting/BookMeetingRevenueStep";
import {
  BookMeetingPhoneInput,
  isValidPhoneNumber,
} from "@/app/components/book-meeting/BookMeetingPhoneInput";
import {
  BOOK_MEETING_STEP_UI,
  type BookMeetingStepId,
} from "@/app/components/book-meeting/book-meeting-ui";
import { easeOut } from "@/app/components/landing/landing-motion";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import styles from "./BookMeetingForm.module.css";

export type BookMeetingFormProps = {
  submitting: boolean;
  errorMessage: string | null;
  onSubmit: (values: MeetingFormValues) => Promise<void>;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function BookMeetingForm({
  submitting,
  errorMessage,
  onSubmit,
}: BookMeetingFormProps) {
  const reduced = useReducedMotion();
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<MeetingFormValues>(DEFAULT_MEETING_FORM_VALUES);
  const [stepError, setStepError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const currentStep = BOOK_MEETING_STEPS[stepIndex];
  const stepUi = BOOK_MEETING_STEP_UI[currentStep.id as BookMeetingStepId];
  const progress = ((stepIndex + 1) / BOOK_MEETING_STEPS.length) * 100;
  const isLastStep = stepIndex >= BOOK_MEETING_STEPS.length - 1;

  const patchValues = useCallback((patch: Partial<MeetingFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleMulti = useCallback((field: "marketingActivities", value: string) => {
    setValues((prev) => {
      const current = prev[field];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [field]: next };
    });
  }, []);

  const validateStep = useCallback(
    (snapshot: MeetingFormValues = values): string | null => {
      switch (currentStep.id) {
        case "contact":
          if (!snapshot.firstName.trim()) return "Please enter your first name.";
          if (!snapshot.lastName.trim()) return "Please enter your last name.";
          if (!snapshot.phone.trim() || !isValidPhoneNumber(snapshot.phone)) {
            return "Please enter a valid phone number.";
          }
          if (!isValidEmail(snapshot.email)) return "Please enter a valid email address.";
          return null;
        case "business":
          if (!snapshot.businessRole) return "Please select the option that best describes you.";
          if (!snapshot.businessCategory.trim()) return "Please enter your business type.";
          if (!snapshot.businessName.trim()) return "Please enter your business name.";
          if (!snapshot.cityLocation.trim()) return "Please enter your city or area.";
          return null;
        case "revenue":
          if (!snapshot.monthlyRevenue) return "Please select a monthly revenue range.";
          return null;
        case "marketing":
          if (snapshot.marketingActivities.length === 0) {
            return "Please select at least one marketing activity.";
          }
          return null;
        case "situation":
          if (snapshot.currentSituation.trim().length < 10) {
            return "Please share a bit more detail (at least 10 characters).";
          }
          return null;
        case "readiness":
          if (!snapshot.startTimeline) return "Please tell us when you want to start.";
          if (!snapshot.meetingCommitment) {
            return "Please tell us if you will come prepared.";
          }
          return null;
        default:
          return null;
      }
    },
    [currentStep.id, values],
  );

  const goNext = useCallback(async () => {
    const validationError = validateStep();
    if (validationError) {
      setStepError(validationError);
      return;
    }
    setStepError(null);

    if (isLastStep) {
      try {
        await onSubmit(values);
        setCompleted(true);
      } catch {
      }
      return;
    }
    setStepIndex((index) => index + 1);
  }, [isLastStep, onSubmit, validateStep, values]);

  const goBack = useCallback(() => {
    setStepError(null);
    setStepIndex((index) => Math.max(0, index - 1));
  }, []);

  const handleSingleChoice = useCallback((field: keyof MeetingFormValues, value: string) => {
    setValues((prev) => {
      const current = prev[field];
      const next = current === value ? "" : value;
      return { ...prev, [field]: next };
    });
    setStepError(null);
  }, []);

  const handleBusinessRoleChange = useCallback((value: string) => {
    setValues((prev) => {
      const nextRole = prev.businessRole === value ? "" : value;
      if (!nextRole) {
        return {
          ...prev,
          businessRole: "",
          businessCategory: "",
          businessName: "",
          cityLocation: "",
        };
      }
      return { ...prev, businessRole: nextRole };
    });
    setStepError(null);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key !== "Enter" || event.shiftKey) return;
      if (currentStep.id === "situation") return;
      event.preventDefault();
      void goNext();
    },
    [currentStep.id, goNext],
  );

  if (completed) {
    return (
      <div
        className={`landing-page ${styles.shell}${mobileNavOpen ? " landing-page-shell--menu-open" : ""}`}
        data-book-meeting-page
      >
        <BookMeetingNav onMenuOpenChange={setMobileNavOpen} />
        <div className={styles.pageContent}>
          <div className={styles.successWrap}>
            <motion.div
              className={styles.successCard}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: easeOut }}
            >
              <div className={styles.successAccent} aria-hidden />
              <div className={styles.successBody}>
                <div className={styles.successIcon}>
                  <Check className="h-6 w-6" strokeWidth={2.5} aria-hidden />
                </div>
                <h1 className={styles.successTitle}>Response recorded</h1>
                <p className={styles.successCopy}>
                  We will review your answers and email{" "}
                  <strong>{values.email}</strong> if we are a good fit.
                </p>
                <Link href="/" className={styles.nextBtn}>
                  Back to home
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`landing-page ${styles.shell}${mobileNavOpen ? " landing-page-shell--menu-open" : ""}`}
      data-book-meeting-page
      onKeyDown={handleKeyDown}
    >
      <BookMeetingNav onMenuOpenChange={setMobileNavOpen} />

      <div className={styles.pageContent}>
        <div className={styles.pageContentGrain} aria-hidden />
        <main id="book-meeting-form" className={styles.main}>
          <div className={styles.formZone}>
            <div className={styles.progressMeta}>
              <span className={styles.progressLabel}>
                Question {stepIndex + 1} of {BOOK_MEETING_STEPS.length}
              </span>
              <span className={styles.progressPct}>{Math.round(progress)}%</span>
            </div>

            <div className={styles.progressTrack} aria-hidden>
              <motion.div
                className={styles.progressFill}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: easeOut }}
              />
            </div>

            <div className={styles.sheet} data-book-meeting-sheet>
              <div className={styles.sheetAccent} aria-hidden />
              <div className={styles.sheetBody}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep.id}
                    className={styles.sheetStep}
                    initial={reduced ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: easeOut }}
                  >
                    <div
                      className={`${styles.sheetStepContent}${currentStep.id === "readiness" ? ` ${styles.sheetStepReadiness}` : ""}`}
                    >
                      <span className={styles.stepBadge}>{currentStep.number}</span>

                      <h2 className={styles.question}>
                        {stepUi.lead}
                        <span className="landing-hero-accent-blue">{stepUi.accent}</span>
                        {currentStep.required ? (
                          <span className={styles.requiredMark} aria-hidden>
                            *
                          </span>
                        ) : null}
                      </h2>

                      {stepUi.subtitle || currentStep.hint ? (
                        <p className={styles.hint}>{stepUi.subtitle ?? currentStep.hint}</p>
                      ) : null}

                      {currentStep.id === "contact" ? (
                        <div className={`${styles.fields} ${styles.fieldsContact}`}>
                          <label>
                            <span className={styles.fieldLabel}>
                              First name<span className={styles.required}>*</span>
                            </span>
                            <input
                              type="text"
                              autoComplete="given-name"
                              autoFocus
                              className={styles.input}
                              value={values.firstName}
                              onChange={(e) => patchValues({ firstName: e.target.value })}
                            />
                          </label>
                          <label>
                            <span className={styles.fieldLabel}>
                              Last name<span className={styles.required}>*</span>
                            </span>
                            <input
                              type="text"
                              autoComplete="family-name"
                              className={styles.input}
                              value={values.lastName}
                              onChange={(e) => patchValues({ lastName: e.target.value })}
                            />
                          </label>
                          <label className={styles.phoneField}>
                            <span className={styles.fieldLabel}>
                              Phone number<span className={styles.required}>*</span>
                            </span>
                            <BookMeetingPhoneInput
                              value={values.phone}
                              onChange={(phone) => patchValues({ phone })}
                            />
                          </label>
                          <label>
                            <span className={styles.fieldLabel}>
                              Email<span className={styles.required}>*</span>
                            </span>
                            <input
                              type="email"
                              autoComplete="email"
                              className={styles.input}
                              placeholder="you@business.com"
                              value={values.email}
                              onChange={(e) => patchValues({ email: e.target.value })}
                            />
                          </label>
                        </div>
                      ) : null}

                      {currentStep.id === "business" ? (
                        <BookMeetingBusinessStep
                          businessRole={values.businessRole}
                          businessCategory={values.businessCategory}
                          businessName={values.businessName}
                          cityLocation={values.cityLocation}
                          onRoleChange={handleBusinessRoleChange}
                          onCategoryChange={(value) => {
                            patchValues({ businessCategory: value });
                            setStepError(null);
                          }}
                          onNameChange={(value) => {
                            patchValues({ businessName: value });
                            setStepError(null);
                          }}
                          onCityChange={(value) => {
                            patchValues({ cityLocation: value });
                            setStepError(null);
                          }}
                        />
                      ) : null}

                      {currentStep.id === "revenue" ? (
                        <BookMeetingRevenueStep
                          value={values.monthlyRevenue}
                          onChange={(revenue) => handleSingleChoice("monthlyRevenue", revenue)}
                        />
                      ) : null}

                      {currentStep.id === "marketing" ? (
                        <BookMeetingChoiceGrid
                          ariaLabel="Marketing activities"
                          layout="stack"
                          multi
                          options={MARKETING_ACTIVITY_OPTIONS}
                          values={values.marketingActivities}
                          onSelect={(value) => {
                            toggleMulti("marketingActivities", value);
                            setStepError(null);
                          }}
                        />
                      ) : null}

                      {currentStep.id === "situation" ? (
                        <label className={styles.situationField}>
                          <textarea
                            rows={6}
                            autoFocus
                            className={styles.situationTextarea}
                            placeholder="Type your answer here."
                            value={values.currentSituation}
                            onChange={(event) => patchValues({ currentSituation: event.target.value })}
                          />
                          <span className={styles.situationHint}>Shift and Enter for a new line.</span>
                        </label>
                      ) : null}

                      {currentStep.id === "readiness" ? (
                        <BookMeetingFinalStep
                          startTimeline={values.startTimeline}
                          meetingCommitment={values.meetingCommitment}
                          onTimelineChange={(value) => handleSingleChoice("startTimeline", value)}
                          onCommitmentChange={(value) =>
                            handleSingleChoice("meetingCommitment", value)
                          }
                        />
                      ) : null}

                      {(stepError || errorMessage) && (
                        <div className={styles.error} role="alert">
                          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                          <span>{stepError ?? errorMessage}</span>
                        </div>
                      )}
                    </div>

                    <div
                      className={`${styles.actions}${stepIndex > 0 ? ` ${styles.actionsDuo}` : ""}`}
                      data-book-meeting-actions
                    >
                      {stepIndex > 0 ? (
                        <button type="button" className={styles.back} onClick={goBack} disabled={submitting}>
                          Back
                        </button>
                      ) : (
                        <span className={styles.actionsSpacer} aria-hidden />
                      )}

                      <button
                        type="button"
                        className={styles.nextBtn}
                        onClick={() => void goNext()}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            Submitting…
                          </>
                        ) : isLastStep ? (
                          "Submit"
                        ) : (
                          "Next"
                        )}
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
