"use client";

import {
  BOOK_MEETING_STEPS,
  DEFAULT_MEETING_FORM_VALUES,
  formatMeetingDate,
  formatMeetingTime,
  meetingSlotStillOpen,
  type MeetingFormValues,
} from "@/app/components/book-meeting/book-meeting-config";
import { BookMeetingBusinessStep } from "@/app/components/book-meeting/BookMeetingBusinessStep";
import { BookMeetingFinalStep } from "@/app/components/book-meeting/BookMeetingFinalStep";
import { BookMeetingNav } from "@/app/components/book-meeting/BookMeetingNav";
import {
  BookMeetingPhoneInput,
  isValidPhoneNumber,
} from "@/app/components/book-meeting/BookMeetingPhoneInput";
import {
  BOOK_MEETING_STEP_UI,
  type BookMeetingStepId,
} from "@/app/components/book-meeting/book-meeting-ui";
import { validateBusinessLocation } from "@/app/lib/business-location";
import {
  optionalHttpsWebsiteUrlMessage,
  withAutomaticHttps,
} from "@/app/lib/website-url";
import { easeOut } from "@/app/components/landing/landing-motion";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Check, Loader2, Mail, User } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import fieldStyles from "@/app/components/register-business/RegisterBusinessForm.module.css";
import styles from "./BookMeetingForm.module.css";

export type BookMeetingFormProps = {
  submitting: boolean;
  errorMessage: string | null;
  meetLink?: string | null;
  onSubmit: (values: MeetingFormValues) => Promise<void>;
};

const MEETING_DRAFT_KEY = "dealio-book-meeting-draft";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function readMeetingDraft(): { stepIndex: number; values: MeetingFormValues } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(MEETING_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      stepIndex?: number;
      values?: Partial<MeetingFormValues>;
    };
    if (!parsed.values) return null;
    const stepIndex = Math.min(
      BOOK_MEETING_STEPS.length - 1,
      Math.max(0, Number(parsed.stepIndex) || 0),
    );
    return {
      stepIndex,
      values: {
        ...DEFAULT_MEETING_FORM_VALUES,
        ...parsed.values,
        meetingDuration: parsed.values.meetingDuration === 15 ? 15 : 30,
      },
    };
  } catch {
    return null;
  }
}

export default function BookMeetingForm({
  submitting,
  errorMessage,
  meetLink = null,
  onSubmit,
}: BookMeetingFormProps) {
  const reduced = useReducedMotion();
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<MeetingFormValues>(DEFAULT_MEETING_FORM_VALUES);
  const [draftReady, setDraftReady] = useState(false);
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

  const setMeetingTimeZone = useCallback((meetingTimeZone: string) => {
    setValues((prev) =>
      prev.meetingTimeZone === meetingTimeZone ? prev : { ...prev, meetingTimeZone },
    );
  }, []);

  useEffect(() => {
    const draft = readMeetingDraft();
    if (draft) {
      setStepIndex(draft.stepIndex);
      setValues(draft.values);
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    if (completed) {
      sessionStorage.removeItem(MEETING_DRAFT_KEY);
      return;
    }
    sessionStorage.setItem(
      MEETING_DRAFT_KEY,
      JSON.stringify({ stepIndex, values }),
    );
  }, [completed, draftReady, stepIndex, values]);

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
          if (!snapshot.businessName.trim()) return "Please enter your business name.";
          if (!snapshot.businessPhone.trim() || !isValidPhoneNumber(snapshot.businessPhone)) {
            return "Please enter a valid phone number.";
          }
          if (!snapshot.businessCategory.trim()) return "Please select a business type.";
          if (!isValidEmail(snapshot.businessEmail)) return "Please enter a valid email address.";
          if (!snapshot.description.trim()) {
            return "Please enter a short description of your business.";
          }
          if (snapshot.description.trim().length > 500) {
            return "Keep the description under 500 characters.";
          }
          if (optionalHttpsWebsiteUrlMessage(withAutomaticHttps(snapshot.website))) {
            return "Enter a full website URL starting with https:// (e.g. https://example.com).";
          }
          return null;
        case "location":
          return validateBusinessLocation({
            city: snapshot.cityLocation,
            state: snapshot.state,
            postalCode: snapshot.postalCode,
            country: snapshot.country,
          });
        case "readiness":
          if (!snapshot.meetingDate) return "Please pick a day for the meeting.";
          if (!snapshot.meetingTime) return "Please pick a time for the meeting.";
          if (!meetingSlotStillOpen(snapshot.meetingDate, snapshot.meetingTime)) {
            return "That time is no longer open. Pick a weekday within the next 60 days.";
          }
          if (snapshot.meetingDuration !== 15 && snapshot.meetingDuration !== 30) {
            return "Please choose a 15 or 30 minute meeting.";
          }
          return null;
        default:
          return null;
      }
    },
    [currentStep.id, values],
  );

  const goNext = useCallback(async () => {
    if (submitting) return;
    const website = withAutomaticHttps(values.website);
    const snapshot = website === values.website ? values : { ...values, website };
    if (website !== values.website) patchValues({ website });
    const validationError = validateStep(snapshot);
    if (validationError) {
      setStepError(validationError);
      return;
    }
    setStepError(null);

    if (isLastStep) {
      try {
        await onSubmit(snapshot);
        setCompleted(true);
      } catch {
        return;
      }
      return;
    }
    setStepIndex((index) => index + 1);
  }, [isLastStep, onSubmit, patchValues, submitting, validateStep, values]);

  const goBack = useCallback(() => {
    setStepError(null);
    setStepIndex((index) => Math.max(0, index - 1));
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "TEXTAREA") return;
      if (event.key !== "Enter" || event.shiftKey) return;
      event.preventDefault();
      void goNext();
    },
    [goNext],
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
              <div className={styles.successBody}>
                <div className={styles.successIcon}>
                  <Check className="h-6 w-6" strokeWidth={2.5} aria-hidden />
                </div>
                <h1 className={styles.successTitle}>Meeting scheduled</h1>
                <p className={styles.successCopy}>
                  Your request is saved for{" "}
                  <strong>
                    {formatMeetingDate(values.meetingDate)} at {formatMeetingTime(values.meetingTime)}
                    {" "}({values.meetingDuration} min
                    {values.meetingTimeZone
                      ? `, ${values.meetingTimeZone.replace(/_/g, " ")}`
                      : ""}
                    )
                  </strong>
                  . This meeting is with <strong>sameeryasir02@gmail.com</strong>. We will follow up at <strong>{values.email}</strong>.
                </p>
                {meetLink ? (
                  <a
                    href={meetLink}
                    className={styles.meetLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Join with Google Meet
                  </a>
                ) : null}
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
                    initial={
                      reduced
                        ? false
                        : currentStep.id === "location"
                          ? { opacity: 0 }
                          : { opacity: 0, y: 10 }
                    }
                    animate={
                      currentStep.id === "location" ? { opacity: 1 } : { opacity: 1, y: 0 }
                    }
                    exit={
                      reduced
                        ? undefined
                        : currentStep.id === "location"
                          ? { opacity: 0 }
                          : { opacity: 0, y: -8 }
                    }
                    style={currentStep.id === "location" ? { transform: "none" } : undefined}
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
                        <div className={styles.reachGrid}>
                          <label>
                            <span className={fieldStyles.basicsLabel}>
                              First name<span className={fieldStyles.basicsRequired}>*</span>
                            </span>
                            <span className={fieldStyles.basicsInputWrap}>
                              <User className={`${fieldStyles.basicsInputIcon} size-4`} strokeWidth={2.25} aria-hidden />
                              <input
                                type="text"
                                name="given-name"
                                autoComplete="given-name"
                                autoFocus
                                className={fieldStyles.basicsInput}
                                placeholder="First name"
                                value={values.firstName}
                                onChange={(e) => patchValues({ firstName: e.target.value })}
                              />
                            </span>
                          </label>
                          <label>
                            <span className={fieldStyles.basicsLabel}>
                              Last name<span className={fieldStyles.basicsRequired}>*</span>
                            </span>
                            <span className={fieldStyles.basicsInputWrap}>
                              <User className={`${fieldStyles.basicsInputIcon} size-4`} strokeWidth={2.25} aria-hidden />
                              <input
                                type="text"
                                name="family-name"
                                autoComplete="family-name"
                                className={fieldStyles.basicsInput}
                                placeholder="Last name"
                                value={values.lastName}
                                onChange={(e) => patchValues({ lastName: e.target.value })}
                              />
                            </span>
                          </label>
                          <label>
                            <span className={fieldStyles.basicsLabel}>
                              Phone number<span className={fieldStyles.basicsRequired}>*</span>
                            </span>
                            <div className={fieldStyles.basicsPhoneWrap}>
                              <BookMeetingPhoneInput
                                variant="boxed"
                                value={values.phone}
                                onChange={(phone) => patchValues({ phone })}
                              />
                            </div>
                          </label>
                          <label>
                            <span className={fieldStyles.basicsLabel}>
                              Email<span className={fieldStyles.basicsRequired}>*</span>
                            </span>
                            <span className={fieldStyles.basicsInputWrap}>
                              <Mail className={`${fieldStyles.basicsInputIcon} size-4`} strokeWidth={2.25} aria-hidden />
                              <input
                                type="email"
                                name="email"
                                autoComplete="email"
                                className={fieldStyles.basicsInput}
                                placeholder="you@gmail.com"
                                value={values.email}
                                onChange={(e) => patchValues({ email: e.target.value })}
                              />
                            </span>
                          </label>
                        </div>
                      ) : null}

                      {currentStep.id === "business" || currentStep.id === "location" ? (
                        <BookMeetingBusinessStep
                          section={currentStep.id === "location" ? "location" : "about"}
                          businessName={values.businessName}
                          businessPhone={values.businessPhone}
                          businessCategory={values.businessCategory}
                          businessEmail={values.businessEmail}
                          description={values.description}
                          website={values.website}
                          cityLocation={values.cityLocation}
                          state={values.state}
                          postalCode={values.postalCode}
                          country={values.country}
                          onChange={(patch) => {
                            patchValues(patch);
                            setStepError(null);
                          }}
                        />
                      ) : null}

                      {currentStep.id === "readiness" ? (
                        <BookMeetingFinalStep
                          meetingDate={values.meetingDate}
                          meetingTime={values.meetingTime}
                          meetingDuration={values.meetingDuration}
                          onDateChange={(meetingDate) => {
                            patchValues({ meetingDate });
                            setStepError(null);
                          }}
                          onTimeChange={(meetingTime) => {
                            patchValues({ meetingTime });
                            setStepError(null);
                          }}
                          onDurationChange={(meetingDuration) => {
                            patchValues({ meetingDuration });
                            setStepError(null);
                          }}
                          onTimeZoneChange={setMeetingTimeZone}
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
                          "Schedule"
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
