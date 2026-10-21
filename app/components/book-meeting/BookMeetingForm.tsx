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
import { BookMeetingPlanStep } from "@/app/components/book-meeting/BookMeetingPlanStep";
import {
  BOOK_MEETING_STEP_UI,
  type BookMeetingStepId,
} from "@/app/components/book-meeting/book-meeting-ui";
import { validateBusinessLocation } from "@/app/lib/business-location";
import {
  optionalHttpsWebsiteUrlMessage,
  withAutomaticHttps,
} from "@/app/lib/website-url";
import OtpForm from "@/app/components/OtpForm";
import { easeOut } from "@/app/components/landing/landing-motion";
import {
  confirmMeetingEmailOtp,
  sendMeetingEmailOtp,
} from "@/app/services/meeting/verify-meeting-email";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  Check,
  Loader2,
  Mail,
  Sparkles,
  User,
  Video,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import fieldStyles from "@/app/components/register-business/RegisterBusinessForm.module.css";
import styles from "./BookMeetingForm.module.css";

function SuccessMetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  if (!value.trim()) return null;
  return (
    <div className={styles.successMetaRow}>
      <span className={styles.successMetaIcon} aria-hidden>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className={styles.successMetaCopy}>
        <span className={styles.successMetaLabel}>{label}</span>
        <span className={styles.successMetaValue}>{value}</span>
      </div>
    </div>
  );
}

export type BookMeetingFormProps = {
  submitting: boolean;
  errorMessage: string | null;
  meetLink?: string | null;
  onSubmit: (
    values: MeetingFormValues,
    emailVerificationToken: string,
  ) => Promise<void>;
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
        selectedBillingCycle:
          parsed.values.selectedBillingCycle === "monthly" ||
          parsed.values.selectedBillingCycle === "annual"
            ? parsed.values.selectedBillingCycle
            : "",
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
  const [contactPhase, setContactPhase] = useState<"form" | "otp">("form");
  const [emailVerificationToken, setEmailVerificationToken] = useState<
    string | null
  >(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [otpBusy, setOtpBusy] = useState(false);

  const currentStep = BOOK_MEETING_STEPS[stepIndex];
  const stepUi = BOOK_MEETING_STEP_UI[currentStep.id as BookMeetingStepId];
  const progress = ((stepIndex + 1) / BOOK_MEETING_STEPS.length) * 100;
  const isLastStep = stepIndex >= BOOK_MEETING_STEPS.length - 1;
  const showingEmailOtp =
    currentStep.id === "contact" && contactPhase === "otp";

  const patchValues = useCallback((patch: Partial<MeetingFormValues>) => {
    setValues((prev) => {
      if (
        typeof patch.email === "string" &&
        patch.email.trim().toLowerCase() !== prev.email.trim().toLowerCase()
      ) {
        setEmailVerificationToken(null);
        setVerifiedEmail(null);
        setContactPhase("form");
      }
      return { ...prev, ...patch };
    });
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
        case "plan":
          if (
            snapshot.selectedBillingCycle !== "monthly" &&
            snapshot.selectedBillingCycle !== "annual"
          ) {
            return "Please choose monthly or annually.";
          }
          if (!snapshot.selectedPlanSlug.trim() || !snapshot.selectedPlanName.trim()) {
            return "Please choose a plan.";
          }
          return null;
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
    if (submitting || otpBusy) return;
    const website = withAutomaticHttps(values.website);
    const snapshot = website === values.website ? values : { ...values, website };
    if (website !== values.website) patchValues({ website });
    const validationError = validateStep(snapshot);
    if (validationError) {
      setStepError(validationError);
      return;
    }
    setStepError(null);

    if (currentStep.id === "contact") {
      const email = snapshot.email.trim().toLowerCase();
      const alreadyVerified =
        verifiedEmail === email && Boolean(emailVerificationToken);
      if (!alreadyVerified) {
        setOtpBusy(true);
        try {
          await sendMeetingEmailOtp(email);
          setContactPhase("otp");
        } catch (error) {
          setStepError(
            error instanceof Error
              ? error.message
              : "Could not send verification code.",
          );
        } finally {
          setOtpBusy(false);
        }
        return;
      }
    }

    if (isLastStep) {
      if (!emailVerificationToken) {
        setStepError("Please verify your email before booking.");
        setStepIndex(0);
        setContactPhase("form");
        return;
      }
      try {
        await onSubmit(snapshot, emailVerificationToken);
        setCompleted(true);
      } catch {
        return;
      }
      return;
    }
    setStepIndex((index) => index + 1);
  }, [
    currentStep.id,
    emailVerificationToken,
    isLastStep,
    onSubmit,
    otpBusy,
    patchValues,
    submitting,
    validateStep,
    values,
    verifiedEmail,
  ]);

  const goBack = useCallback(() => {
    if (submitting || otpBusy) return;
    if (showingEmailOtp) {
      setContactPhase("form");
      setStepError(null);
      return;
    }
    setStepError(null);
    setStepIndex((index) => Math.max(0, index - 1));
  }, [otpBusy, showingEmailOtp, submitting]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (showingEmailOtp) return;
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "TEXTAREA") return;
      if (event.key !== "Enter" || event.shiftKey) return;
      event.preventDefault();
      void goNext();
    },
    [goNext, showingEmailOtp],
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
            <div className={styles.successGlow} aria-hidden />
            <motion.div
              className={styles.successCard}
              initial={reduced ? false : { opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.42, ease: easeOut }}
            >
              <div className={styles.successAccent} aria-hidden />
              <div className={styles.successBody}>
                <motion.div
                  className={styles.successIcon}
                  initial={reduced ? false : { scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.08, ease: easeOut }}
                >
                  <Check className="h-7 w-7" strokeWidth={2.5} aria-hidden />
                </motion.div>
                <p className={styles.successEyebrow}>You&apos;re all set</p>
                <h1 className={styles.successTitle}>Meeting scheduled</h1>
                <p className={styles.successCopy}>
                  We saved your request. Add it to your calendar and we&apos;ll
                  follow up by email.
                </p>

                <div className={styles.successHero}>
                  <p className={styles.successHeroDate}>
                    {formatMeetingDate(values.meetingDate)}
                  </p>
                  <p className={styles.successHeroTime}>
                    {formatMeetingTime(values.meetingTime)}
                  </p>
                  <p className={styles.successHeroSub}>
                    {values.meetingDuration} min
                    {values.meetingTimeZone
                      ? ` · ${values.meetingTimeZone.replace(/_/g, " ")}`
                      : ""}
                  </p>
                </div>

                <div className={styles.successMetaGrid}>
                  <SuccessMetaRow
                    icon={Sparkles}
                    label="Plan"
                    value={[
                      values.selectedPlanName,
                      values.selectedBillingCycle === "annual"
                        ? "Annually"
                        : values.selectedBillingCycle === "monthly"
                          ? "Monthly"
                          : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                  <SuccessMetaRow
                    icon={Mail}
                    label="Follow up"
                    value={values.email}
                  />
                </div>

                <div className={styles.successActions}>
                  {meetLink ? (
                    <a
                      href={meetLink}
                      className={styles.successMeetBtn}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Video className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                      Join with Google Meet
                    </a>
                  ) : null}
                  <Link href="/" className={styles.nextBtn}>
                    Back to home
                  </Link>
                </div>
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
                    key={`${currentStep.id}-${contactPhase}`}
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
                        {showingEmailOtp ? (
                          <>
                            Verify your{" "}
                            <span className="landing-hero-accent-blue">email</span>
                            <span className={styles.requiredMark} aria-hidden>
                              *
                            </span>
                          </>
                        ) : (
                          <>
                            {stepUi.lead}
                            <span className="landing-hero-accent-blue">{stepUi.accent}</span>
                            {currentStep.required ? (
                              <span className={styles.requiredMark} aria-hidden>
                                *
                              </span>
                            ) : null}
                          </>
                        )}
                      </h2>

                      {showingEmailOtp ? (
                        <p className={styles.hint}>
                          Enter the 6-digit code we sent to {values.email.trim()}.
                        </p>
                      ) : stepUi.subtitle || currentStep.hint ? (
                        <p className={styles.hint}>{stepUi.subtitle ?? currentStep.hint}</p>
                      ) : null}

                      {currentStep.id === "contact" && contactPhase === "form" ? (
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

                      {showingEmailOtp ? (
                        <OtpForm
                          embedded
                          email={values.email.trim()}
                          onVerifyOtp={async (otp) => {
                            const email = values.email.trim().toLowerCase();
                            const result = await confirmMeetingEmailOtp(email, otp);
                            setEmailVerificationToken(result.emailVerificationToken);
                            setVerifiedEmail(email);
                            setContactPhase("form");
                            setStepError(null);
                            setStepIndex((index) => index + 1);
                          }}
                          onResendOtp={async () => {
                            await sendMeetingEmailOtp(values.email.trim().toLowerCase());
                          }}
                          onBack={goBack}
                        />
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

                      {currentStep.id === "plan" ? (
                        <BookMeetingPlanStep
                          selectedPlanSlug={values.selectedPlanSlug}
                          selectedBillingCycle={values.selectedBillingCycle}
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

                    {!showingEmailOtp ? (
                      <div
                        className={`${styles.actions}${stepIndex > 0 ? ` ${styles.actionsDuo}` : ""}`}
                        data-book-meeting-actions
                      >
                        {stepIndex > 0 ? (
                          <button
                            type="button"
                            className={styles.back}
                            onClick={goBack}
                            disabled={submitting || otpBusy}
                          >
                            Back
                          </button>
                        ) : (
                          <span className={styles.actionsSpacer} aria-hidden />
                        )}

                        <button
                          type="button"
                          className={styles.nextBtn}
                          onClick={() => void goNext()}
                          disabled={submitting || otpBusy}
                        >
                          {submitting || otpBusy ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                              {otpBusy ? "Sending code…" : "Submitting…"}
                            </>
                          ) : isLastStep ? (
                            "Schedule"
                          ) : currentStep.id === "contact" &&
                            verifiedEmail !== values.email.trim().toLowerCase() ? (
                            "Verify email"
                          ) : (
                            "Next"
                          )}
                        </button>
                      </div>
                    ) : null}
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
