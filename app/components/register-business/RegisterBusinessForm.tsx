"use client";

import {
  BookMeetingPhoneInput,
  isValidPhoneNumber,
} from "@/app/components/book-meeting/BookMeetingPhoneInput";
import Navbar from "@/app/components/Navbar";
import bookStyles from "@/app/components/book-meeting/BookMeetingForm.module.css";
import {
  REGISTER_BUSINESS_STEPS,
  REGISTER_BUSINESS_STEP_UI,
  type RegisterBusinessStepId,
} from "@/app/components/register-business/register-business-ui";
import logoStyles from "@/app/components/register-business/RegisterBusinessForm.module.css";
import { easeOut } from "@/app/components/landing/landing-motion";
import { validateBusinessLocation } from "@/app/lib/business-location";
import { isValidOptionalHttpsWebsiteUrl } from "@/app/lib/website-url";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";

export type RegisterBusinessFormValues = {
  name: string;
  phoneNumber: string;
  email: string;
  description: string;
  websiteUrl: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  branchCount: number;
  logoFile?: File | null;
};

export type RegisterBusinessFormProps = {
  submitting: boolean;
  errorMessage: string | null;
  onSubmit: (data: RegisterBusinessFormValues) => Promise<void>;
};

const DEFAULT_VALUES: RegisterBusinessFormValues = {
  name: "",
  phoneNumber: "",
  email: "",
  description: "",
  websiteUrl: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  branchCount: 1,
  logoFile: null,
};

const MAX_LOGO_BYTES = 10 * 1024 * 1024;
const ACCEPT_IMAGES = "image/png,image/jpeg,image/webp";

function isImageMime(mime: string): boolean {
  return mime === "image/png" || mime === "image/jpeg" || mime === "image/webp";
}

function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function isValidOptionalUrl(value: string): boolean {
  return isValidOptionalHttpsWebsiteUrl(value);
}

type LogoDropProps = {
  id: string;
  disabled: boolean;
  file: File | null;
  error?: string;
  onFile: (file: File | null) => void;
};

function BusinessLogoDropField({
  id,
  disabled,
  file,
  error,
  onFile,
}: LogoDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | undefined>();
  const [isDragging, setIsDragging] = useState(false);

  const imagePreviewUrl = useMemo(() => {
    if (!file || !isImageMime(file.type)) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    if (!imagePreviewUrl) return;
    return () => URL.revokeObjectURL(imagePreviewUrl);
  }, [imagePreviewUrl]);

  const validateAndSet = useCallback(
    (nextFile: File | null, inputEl: HTMLInputElement | null) => {
      setLocalError(undefined);
      if (!nextFile) {
        onFile(null);
        return;
      }
      if (!ACCEPT_IMAGES.split(",").includes(nextFile.type)) {
        setLocalError("Use PNG, JPG, or WEBP only.");
        if (inputEl) inputEl.value = "";
        return;
      }
      if (nextFile.size > MAX_LOGO_BYTES) {
        setLocalError("File must be 10MB or smaller.");
        if (inputEl) inputEl.value = "";
        return;
      }
      onFile(nextFile);
    },
    [onFile],
  );

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextFile = event.target.files?.[0] ?? null;
      validateAndSet(nextFile, event.target);
    },
    [validateAndSet],
  );

  const handleDragOver = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      if (disabled) return;
      const nextFile = event.dataTransfer.files?.[0] ?? null;
      validateAndSet(nextFile, inputRef.current);
    },
    [disabled, validateAndSet],
  );

  const clearFile = useCallback(() => {
    setLocalError(undefined);
    if (inputRef.current) inputRef.current.value = "";
    onFile(null);
  }, [onFile]);

  const combinedError = error ?? localError;

  return (
    <div className={logoStyles.logoSection}>
      <span className={logoStyles.logoSectionLabel}>Business logo</span>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPT_IMAGES}
        className="hidden"
        tabIndex={-1}
        disabled={disabled}
        onChange={onChange}
      />

      {file && imagePreviewUrl ? (
        <div className={logoStyles.logoPreview}>
          <div className={logoStyles.logoPreviewImageWrap}>
            <img
              src={imagePreviewUrl}
              alt="Business logo preview"
              className={logoStyles.logoPreviewImage}
            />
          </div>
          {!disabled ? (
            <div className={logoStyles.logoPreviewActions}>
              <button
                type="button"
                className={logoStyles.logoActionBtn}
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" aria-hidden />
                Replace
              </button>
              <button
                type="button"
                className={`${logoStyles.logoActionBtn} ${logoStyles.logoActionBtnDanger}`}
                onClick={clearFile}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Remove
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <label
          htmlFor={id}
          aria-label="Upload business logo"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={onDrop}
          className={`${logoStyles.logoDrop}${disabled ? ` ${logoStyles.logoDropDisabled}` : ""}${
            isDragging ? ` ${logoStyles.logoDropDragging}` : ""
          }${combinedError ? ` ${logoStyles.logoDropError}` : ""}`}
        >
          <span className={logoStyles.logoDropIcon}>
            <ImagePlus className="h-5 w-5" strokeWidth={1.5} aria-hidden />
          </span>
          <span className={logoStyles.logoDropTitle}>
            {isDragging ? "Drop image here" : "Upload business logo"}
          </span>
          <span className={logoStyles.logoDropHint}>PNG, JPG, or WEBP up to 10MB</span>
        </label>
      )}

      {combinedError ? (
        <p className={logoStyles.fieldError}>{combinedError}</p>
      ) : null}
    </div>
  );
}

export default function RegisterBusinessForm({
  submitting,
  errorMessage,
  onSubmit,
}: RegisterBusinessFormProps) {
  const reduced = useReducedMotion();
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<RegisterBusinessFormValues>(DEFAULT_VALUES);
  const [stepError, setStepError] = useState<string | null>(null);

  const currentStep = REGISTER_BUSINESS_STEPS[stepIndex];
  const stepUi = REGISTER_BUSINESS_STEP_UI[currentStep.id as RegisterBusinessStepId];
  const progress = ((stepIndex + 1) / REGISTER_BUSINESS_STEPS.length) * 100;
  const isLastStep = stepIndex >= REGISTER_BUSINESS_STEPS.length - 1;

  const patchValues = useCallback((patch: Partial<RegisterBusinessFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
  }, []);

  const validateStep = useCallback(
    (snapshot: RegisterBusinessFormValues = values): string | null => {
      switch (currentStep.id) {
        case "basics":
          if (!snapshot.name.trim()) return "Please enter your business name.";
          if (!snapshot.phoneNumber.trim() || !isValidPhoneNumber(snapshot.phoneNumber)) {
            return "Please enter a valid phone number.";
          }
          return null;
        case "about":
          if (!isValidEmail(snapshot.email)) return "Please enter a valid email address.";
          if (!isValidOptionalUrl(snapshot.websiteUrl)) {
            return "Enter a full website URL starting with https:// (e.g. https://example.com).";
          }
          return null;
        case "location":
          return validateBusinessLocation({
            city: snapshot.city,
            state: snapshot.state,
            postalCode: snapshot.postalCode,
            country: snapshot.country,
          });
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
      await onSubmit({
        ...values,
        branchCount: 1,
        logoFile: values.logoFile ?? null,
      });
      return;
    }

    setStepIndex((index) => index + 1);
  }, [isLastStep, onSubmit, validateStep, values]);

  const goBack = useCallback(() => {
    setStepError(null);
    setStepIndex((index) => Math.max(0, index - 1));
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.shiftKey) return;
      if (currentStep.id === "about" && event.target instanceof HTMLTextAreaElement) {
        return;
      }
      event.preventDefault();
      void goNext();
    },
    [currentStep.id, goNext],
  );

  return (
    <div
      className={`landing-page ${bookStyles.shell}`}
      data-register-business-page
      onKeyDown={handleKeyDown}
    >
      <Navbar />

      <div className={bookStyles.pageContent}>
        <div className={bookStyles.pageContentGrain} aria-hidden />
        <main id="register-business-form" className={bookStyles.main}>
          <div className={bookStyles.formZone}>
            <div className={bookStyles.progressMeta}>
              <span className={bookStyles.progressLabel}>
                Step {stepIndex + 1} of {REGISTER_BUSINESS_STEPS.length}
              </span>
              <span className={bookStyles.progressPct}>{Math.round(progress)}%</span>
            </div>

            <div className={bookStyles.progressTrack} aria-hidden>
              <motion.div
                className={bookStyles.progressFill}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: easeOut }}
              />
            </div>

            <div className={bookStyles.sheet} data-book-meeting-sheet>
              <div className={bookStyles.sheetAccent} aria-hidden />
              <div className={bookStyles.sheetBody}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep.id}
                    className={bookStyles.sheetStep}
                    initial={reduced ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: easeOut }}
                  >
                    <div className={bookStyles.sheetStepContent}>
                      <span className={bookStyles.stepBadge}>{currentStep.number}</span>

                      <h2 className={bookStyles.question}>
                        {stepUi.lead}
                        <span className="landing-hero-accent-blue">{stepUi.accent}</span>
                      </h2>

                      <p className={bookStyles.hint}>{stepUi.subtitle}</p>

                      {currentStep.id === "basics" ? (
                        <div className={`${bookStyles.fields} ${bookStyles.fieldsContact}`}>
                          <label className={bookStyles.fieldFull}>
                            <span className={bookStyles.fieldLabel}>
                              Business name<span className={bookStyles.required}>*</span>
                            </span>
                            <input
                              type="text"
                              autoComplete="organization"
                              autoFocus
                              className={bookStyles.input}
                              placeholder="Your business name"
                              value={values.name}
                              onChange={(event) => {
                                patchValues({ name: event.target.value });
                                setStepError(null);
                              }}
                            />
                          </label>

                          <label className={`${bookStyles.phoneField} ${bookStyles.fieldFull}`}>
                            <span className={bookStyles.fieldLabel}>
                              Contact number<span className={bookStyles.required}>*</span>
                            </span>
                            <BookMeetingPhoneInput
                              value={values.phoneNumber}
                              onChange={(phone) => {
                                patchValues({ phoneNumber: phone });
                                setStepError(null);
                              }}
                            />
                          </label>
                        </div>
                      ) : null}

                      {currentStep.id === "about" ? (
                        <div className={`${bookStyles.fields} ${bookStyles.fieldsContact}`}>
                          <label className={bookStyles.fieldFull}>
                            <span className={bookStyles.fieldLabel}>Email address</span>
                            <input
                              type="email"
                              autoComplete="email"
                              className={bookStyles.input}
                              placeholder="you@business.com"
                              value={values.email}
                              onChange={(event) => {
                                patchValues({ email: event.target.value });
                                setStepError(null);
                              }}
                            />
                          </label>

                          <label className={bookStyles.fieldFull}>
                            <span className={bookStyles.fieldLabel}>Description</span>
                            <textarea
                              rows={4}
                              className={bookStyles.textarea}
                              placeholder="Tell customers what you do"
                              value={values.description}
                              onChange={(event) => patchValues({ description: event.target.value })}
                            />
                          </label>

                          <label className={bookStyles.fieldFull}>
                            <span className={bookStyles.fieldLabel}>Website</span>
                            <input
                              type="text"
                              inputMode="url"
                              className={bookStyles.input}
                              placeholder="https://example.com"
                              value={values.websiteUrl}
                              onChange={(event) => {
                                patchValues({ websiteUrl: event.target.value });
                                setStepError(null);
                              }}
                            />
                          </label>
                        </div>
                      ) : null}

                      {currentStep.id === "location" ? (
                        <div className={`${bookStyles.fields} ${bookStyles.fieldsContact}`}>
                          <label>
                            <span className={bookStyles.fieldLabel}>City</span>
                            <input
                              type="text"
                              className={bookStyles.input}
                              placeholder="Enter city"
                              value={values.city}
                              onChange={(event) => {
                                patchValues({ city: event.target.value });
                                setStepError(null);
                              }}
                              autoComplete="address-level2"
                            />
                          </label>

                          <label>
                            <span className={bookStyles.fieldLabel}>State / region</span>
                            <input
                              type="text"
                              className={bookStyles.input}
                              placeholder="Enter state or region"
                              value={values.state}
                              onChange={(event) => {
                                patchValues({ state: event.target.value });
                                setStepError(null);
                              }}
                              autoComplete="address-level1"
                            />
                          </label>

                          <label>
                            <span className={bookStyles.fieldLabel}>Postal / zip</span>
                            <input
                              type="text"
                              autoComplete="postal-code"
                              className={bookStyles.input}
                              placeholder="Enter postal code"
                              value={values.postalCode}
                              onChange={(event) => {
                                patchValues({ postalCode: event.target.value });
                                setStepError(null);
                              }}
                            />
                          </label>

                          <label>
                            <span className={bookStyles.fieldLabel}>Country</span>
                            <input
                              type="text"
                              autoComplete="country-name"
                              className={bookStyles.input}
                              placeholder="Enter country"
                              value={values.country}
                              onChange={(event) => {
                                patchValues({ country: event.target.value });
                                setStepError(null);
                              }}
                            />
                          </label>

                          <div className={bookStyles.fieldFull}>
                            <BusinessLogoDropField
                              id="business-logo-file"
                              disabled={submitting}
                              file={values.logoFile ?? null}
                              onFile={(logoFile) => patchValues({ logoFile })}
                            />
                          </div>
                        </div>
                      ) : null}

                      {(stepError || errorMessage) && (
                        <div className={bookStyles.error} role="alert">
                          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                          <span>{stepError ?? errorMessage}</span>
                        </div>
                      )}
                    </div>

                    <div
                      className={`${bookStyles.actions}${stepIndex > 0 ? ` ${bookStyles.actionsDuo}` : ""}`}
                      data-book-meeting-actions
                    >
                      {stepIndex > 0 ? (
                        <button
                          type="button"
                          className={bookStyles.back}
                          onClick={goBack}
                          disabled={submitting}
                        >
                          Back
                        </button>
                      ) : (
                        <span className={bookStyles.actionsSpacer} aria-hidden />
                      )}

                      <button
                        type="button"
                        className={bookStyles.nextBtn}
                        onClick={() => void goNext()}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            Adding business…
                          </>
                        ) : isLastStep ? (
                          "Add business"
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
