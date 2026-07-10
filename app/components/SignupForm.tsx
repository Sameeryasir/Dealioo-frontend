"use client";

import {
  BookMeetingPhoneInput,
  isValidPhoneNumber,
} from "@/app/components/book-meeting/BookMeetingPhoneInput";
import GoogleAuthButton from "@/app/components/auth/GoogleAuthButton";
import OtpForm from "@/app/components/OtpForm";
import { easeOut } from "@/app/components/landing/landing-motion";
import { useCredentialContext } from "@/app/contexts/credential-context";
import { hasAuthSession } from "@/app/lib/auth-session";
import {
  clearSignupProgress,
  readSignupProgress,
  resolveSignupStep,
  saveSignupProgress,
} from "@/app/lib/signup-progress-storage";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type SignupFormValues = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export type SignupRegisterValues = Omit<SignupFormValues, "confirmPassword">;

export type SignupFormProps = {
  submitting: boolean;
  errorMessage: string | null;
  loginHref?: string;
  onRegister: (values: SignupRegisterValues) => Promise<void>;
  onVerifyOtp: (otp: number) => Promise<void>;
  onResendOtp: () => Promise<void>;
};

const STEPS = [
  {
    lead: "Tell us about ",
    accent: "yourself",
    subtitle: "Just a few details to get you started.",
    accentClass: "landing-hero-accent-blue",
  },
  {
    lead: "Secure your ",
    accent: "account",
    subtitle: "Add your phone number and create a password.",
    accentClass: "landing-hero-accent-green",
  },
  {
    lead: "Verify your ",
    accent: "email",
    subtitle: "Enter the 6-digit code we sent to your inbox.",
    accentClass: "landing-hero-accent-pink",
  },
] as const;

function fieldRing(hasError: boolean) {
  return hasError
    ? "border-red-400 ring-2 ring-red-100"
    : "border-[#e8edf5] focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15";
}

function passwordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

const STRENGTH_LABELS = ["Weak", "Fair", "Good", "Strong"] as const;
const STRENGTH_COLORS = ["#ef4444", "#f97316", "#1877F2", "#34A853"] as const;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="auth-signup-field-error" role="alert" aria-live="polite">
      {message}
    </p>
  );
}

export default function SignupForm({
  submitting,
  errorMessage,
  loginHref = "/auth/login",
  onRegister,
  onVerifyOtp,
  onResendOtp,
}: SignupFormProps) {
  const router = useRouter();
  const { rememberCredentials } = useCredentialContext();
  const reduced = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(0);
  const [accountCreated, setAccountCreated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [ignoreAutofill, setIgnoreAutofill] = useState(true);
  const [otpLoading, setOtpLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const {
    register,
    control,
    watch,
    getValues,
    reset,
    trigger,
    formState: { errors },
  } = useForm<SignupFormValues>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const passwordValue = watch("password");
  const emailValue = watch("email");
  const nameValue = watch("name");
  const phoneValue = watch("phone");
  const strength = useMemo(() => passwordStrength(passwordValue ?? ""), [passwordValue]);
  const currentStep = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;
  const stepSubtitle =
    step === 2 && emailValue.trim()
      ? `Enter the 6-digit code we sent to ${emailValue.trim()}.`
      : currentStep.subtitle;

  const handleVerifyOtp = async (otp: number) => {
    await onVerifyOtp(otp);
    setEmailVerified(true);
    clearSignupProgress();
    router.push("/auth/select-plan");
  };

  useEffect(() => {
    const saved = readSignupProgress();
    if (saved) {
      const restored = resolveSignupStep(saved);

      reset({
        name: saved.name,
        email: saved.email,
        phone: saved.phone,
        password: saved.password,
        confirmPassword: saved.password,
      });

      setStep(restored.step);
      setAccountCreated(saved.accountCreated);
      setEmailVerified(restored.emailVerified);

      if (saved.email.trim()) {
        rememberCredentials(saved.email.trim(), saved.password);
      }
    } else if (hasAuthSession()) {
      setEmailVerified(true);
    }

    setHydrated(true);
  }, [rememberCredentials, reset]);

  useEffect(() => {
    if (!hydrated) return;

    saveSignupProgress({
      step,
      name: nameValue ?? "",
      email: emailValue ?? "",
      phone: phoneValue ?? "",
      password: passwordValue ?? "",
      accountCreated,
      emailVerified: emailVerified || hasAuthSession(),
      selectedPlanId: "starter",
      billing: "monthly",
    });
  }, [
    hydrated,
    step,
    nameValue,
    emailValue,
    phoneValue,
    passwordValue,
    accountCreated,
    emailVerified,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mobileQuery = window.matchMedia("(max-width: 639px)");
    const scrollFocusedField = (event: FocusEvent) => {
      if (!mobileQuery.matches) return;

      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.matches("input, textarea, select")) return;

      window.setTimeout(() => {
        target.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 320);
    };

    document.addEventListener("focusin", scrollFocusedField);
    return () => document.removeEventListener("focusin", scrollFocusedField);
  }, []);

  const goNext = async () => {
    if (step === 0) {
      const ok = await trigger(["name", "email"]);
      if (ok) setStep(1);
      return;
    }

    if (step === 1) {
      if (accountCreated) {
        setStep(2);
        return;
      }

      const ok = await trigger(["phone", "password", "confirmPassword"]);
      if (!ok) return;

      const { confirmPassword: _confirmPassword, ...data } = getValues();
      try {
        await onRegister(data);
        setAccountCreated(true);
        setStep(2);
      } catch {
      }
    }
  };

  const goBack = () => {
    if (step === 2) {
      setStep(1);
      return;
    }
    setStep((value) => Math.max(0, value - 1));
  };

  const onFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step < 2) {
      void goNext();
    }
  };

  const inputClass = (hasError: boolean) =>
    `brand-input py-3 text-sm read-only:bg-[#f8faff]/80 ${fieldRing(hasError)}`;

  if (!hydrated) {
    return (
      <div className="auth-signup-scroll-block flex min-h-[14rem] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" aria-hidden />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  return (
    <>
      <div
        className={`auth-signup-scroll-block${
          step === 2 ? " auth-signup-scroll-block--otp-step" : ""
        }`}
      >
        <div className="auth-signup-progress-block">
          <p className="auth-signup-step-meta">
            Step {step + 1} of {STEPS.length}
          </p>

          <div className="auth-signup-progress-track" aria-hidden>
            <motion.div
              className="auth-signup-progress-fill"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: easeOut }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2, ease: easeOut }}
            className="auth-signup-step-head"
          >
            <h2 className="brand-landing-display auth-signup-step-title">
              {currentStep.lead}
              <span className={currentStep.accentClass}>{currentStep.accent}</span>
            </h2>
            <p className="auth-signup-step-sub mt-1.5">{stepSubtitle}</p>
          </motion.div>
        </AnimatePresence>

        <div
          className={`auth-signup-step-body${
            step === 2 ? " auth-signup-step-body--otp-step" : ""
          }`}
        >
        {errorMessage ? (
          <div className="auth-signup-form-alert-banner" role="alert" aria-live="polite">
            <div className="auth-signup-form-alert flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{errorMessage}</span>
            </div>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="auth-signup-fields auth-signup-fields--otp-step">
            <OtpForm
              embedded
              email={emailValue.trim()}
              formId="auth-signup-otp-form"
              actionsPlacement="footer"
              onLoadingChange={setOtpLoading}
              onVerifyOtp={handleVerifyOtp}
              onResendOtp={onResendOtp}
              onBack={goBack}
            />
          </div>
        ) : (
          <form
            id="auth-signup-form"
            className="auth-signup-form flex flex-col"
            onSubmit={onFormSubmit}
            noValidate
          >
          <div
            className={`auth-signup-fields${
              step === 1
                ? " auth-signup-fields--password-step"
                : " auth-signup-fields--profile-step"
            }`}
          >
            <AnimatePresence mode="wait">
              {step === 0 ? (
                <motion.div
                  key="step-profile"
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduced ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.2, ease: easeOut }}
                  className="auth-signup-field-stack"
                >
                  <div>
                    <label htmlFor="signup-name" className="brand-label mb-1.5">
                      <User className="h-4 w-4 text-brand-muted" aria-hidden />
                      Full name
                    </label>
                    <input
                      id="signup-name"
                      type="text"
                      autoComplete="name"
                      disabled={submitting}
                      readOnly={ignoreAutofill}
                      onFocus={() => setIgnoreAutofill(false)}
                      aria-invalid={!!errors.name}
                      className={inputClass(!!errors.name)}
                      placeholder="e.g. Sarah Chen"
                      {...register("name", {
                        required: "Enter your name.",
                        minLength: {
                          value: 2,
                          message: "Name must be at least 2 characters.",
                        },
                      })}
                    />
                    <FieldError message={errors.name?.message} />
                  </div>

                  <div>
                    <label htmlFor="signup-email" className="brand-label mb-1.5">
                      <Mail className="h-4 w-4 text-brand-muted" aria-hidden />
                      Email Address
                    </label>
                    <input
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      disabled={submitting}
                      readOnly={ignoreAutofill}
                      onFocus={() => setIgnoreAutofill(false)}
                      aria-invalid={!!errors.email}
                      className={inputClass(!!errors.email)}
                      placeholder="name@company.com"
                      {...register("email", {
                        required: "Enter your email.",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Enter a valid email.",
                        },
                      })}
                    />
                    <FieldError message={errors.email?.message} />
                  </div>
                </motion.div>
              ) : null}

              {step === 1 ? (
                <motion.div
                  key="step-password"
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduced ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.2, ease: easeOut }}
                  className="auth-signup-field-stack"
                >
                  <div className="auth-signup-phone-field">
                    <label htmlFor="signup-phone" className="brand-label mb-1.5">
                      <Phone className="h-4 w-4 text-brand-muted" aria-hidden />
                      Phone number
                    </label>
                    <Controller
                      name="phone"
                      control={control}
                      rules={{
                        required: "Enter your phone number.",
                        validate: (value) =>
                          isValidPhoneNumber(value) || "Enter a valid phone number.",
                      }}
                      render={({ field }) => (
                        <BookMeetingPhoneInput
                          value={field.value}
                          onChange={field.onChange}
                          wrapClassName={
                            errors.phone ? "auth-signup-phone-field--error" : undefined
                          }
                        />
                      )}
                    />
                    <FieldError message={errors.phone?.message} />
                  </div>

                  <div>
                    <label htmlFor="signup-password" className="brand-label mb-1.5">
                      <Lock className="h-4 w-4 text-brand-muted" aria-hidden />
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        disabled={submitting}
                        readOnly={ignoreAutofill}
                        onFocus={() => setIgnoreAutofill(false)}
                        aria-invalid={!!errors.password}
                        className={`${inputClass(!!errors.password)} pr-11`}
                        placeholder="At least 8 characters"
                        {...register("password", {
                          required: "Enter a password.",
                          minLength: {
                            value: 8,
                            message: "Password must be at least 8 characters.",
                          },
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        disabled={submitting}
                        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-brand-muted hover:bg-[#f8faff] hover:text-brand-navy"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <FieldError message={errors.password?.message} />

                    <div className="auth-signup-password-meta">
                      {passwordValue ? (
                        <div className="space-y-2">
                          <div className="flex gap-1.5">
                            {[0, 1, 2, 3].map((i) => (
                              <motion.div
                                key={i}
                                className="h-1.5 flex-1 rounded-full"
                                animate={{
                                  backgroundColor:
                                    i < strength
                                      ? STRENGTH_COLORS[Math.max(strength - 1, 0)]
                                      : "#e8edf5",
                                  scaleY: i < strength && !reduced ? [1, 1.3, 1] : 1,
                                }}
                                transition={{ duration: 0.3 }}
                              />
                            ))}
                          </div>
                          <p
                            className="mt-1.5 text-[11px] font-semibold leading-none"
                            style={{ color: STRENGTH_COLORS[Math.max(strength - 1, 0)] }}
                          >
                            {STRENGTH_LABELS[Math.max(strength - 1, 0)]} password
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="signup-confirm-password" className="brand-label mb-1.5">
                      <Check className="h-4 w-4 text-brand-muted" aria-hidden />
                      Confirm password
                    </label>
                    <div className="relative">
                      <input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        disabled={submitting}
                        readOnly={ignoreAutofill}
                        onFocus={() => setIgnoreAutofill(false)}
                        aria-invalid={!!errors.confirmPassword}
                        className={`${inputClass(!!errors.confirmPassword)} pr-11`}
                        placeholder="Re-enter password"
                        {...register("confirmPassword", {
                          required: "Confirm your password.",
                          validate: (value) =>
                            value === passwordValue || "Passwords do not match.",
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((value) => !value)}
                        disabled={submitting}
                        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-brand-muted hover:bg-[#f8faff] hover:text-brand-navy"
                        aria-label={
                          showConfirmPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <FieldError message={errors.confirmPassword?.message} />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </form>
        )}
        </div>
      </div>

      <div className="auth-signup-mobile-dock">
        {step === 0 ? (
          <div className="mb-3 flex w-full flex-col gap-3">
            <GoogleAuthButton
              disabled={submitting}
              mode="signup"
              label="Sign up with Google"
            />
            <div className="flex items-center gap-3 px-1">
              <div className="h-px flex-1 bg-[#e8edf5]" />
              <span className="text-xs font-medium text-brand-muted">or</span>
              <div className="h-px flex-1 bg-[#e8edf5]" />
            </div>
          </div>
        ) : null}
        <div className="auth-signup-actions">
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              disabled={submitting || otpLoading}
              className="landing-btn-outline auth-signup-action-btn inline-flex h-11 cursor-pointer touch-manipulation items-center justify-center rounded-full px-3 text-sm font-semibold disabled:opacity-50"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/")}
              disabled={submitting}
              className="landing-btn-outline auth-signup-action-btn inline-flex h-11 cursor-pointer touch-manipulation items-center justify-center rounded-full px-3 text-sm font-semibold disabled:opacity-50"
            >
              Back to Home
            </button>
          )}

          {step < 2 ? (
            <button
              type="submit"
              form="auth-signup-form"
              disabled={submitting}
              aria-busy={submitting}
              className="landing-btn-primary auth-signup-action-btn inline-flex h-11 cursor-pointer touch-manipulation items-center justify-center rounded-full px-3 text-sm font-bold disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                "Next"
              )}
            </button>
          ) : (
            <button
              type="submit"
              form="auth-signup-otp-form"
              disabled={otpLoading || submitting}
              aria-busy={otpLoading || submitting}
              className="landing-btn-primary auth-signup-action-btn inline-flex h-11 cursor-pointer touch-manipulation items-center justify-center rounded-full px-3 text-sm font-bold disabled:opacity-50"
            >
              {otpLoading || submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                "Verify"
              )}
            </button>
          )}
        </div>

        <footer className="auth-signup-card-footer">
          Already have an account?{" "}
          <Link href={loginHref} className="font-semibold text-brand-primary hover:underline">
            Log in
          </Link>
        </footer>
      </div>
    </>
  );
}
