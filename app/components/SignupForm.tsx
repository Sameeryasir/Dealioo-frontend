"use client";

/**
 * Premium 3-step signup wizard — live funnel preview, animated transitions, password strength.
 */
import DealiooLogo from "@/app/components/brand/DealiooLogo";
import { SignupExperiencePanel, SignupPreviewCard } from "@/app/components/SignupExperiencePanel";
import { easeOut } from "@/app/components/landing/landing-motion";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  Rocket,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

type SignupFormValues = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export type SignupFormProps = {
  submitting: boolean;
  errorMessage: string | null;
  loginHref?: string;
  onSubmit: (values: Omit<SignupFormValues, "confirmPassword">) => Promise<void>;
};

const STEPS = [
  {
    title: "Who are you?",
    lead: "Who are ",
    accent: "you?",
    subtitle: "Tell us your name and work email. Your live brand card updates as you type.",
    icon: User,
    iconClass: "bg-brand-primary text-white",
    accentClass: "landing-hero-accent-blue",
  },
  {
    title: "How do we reach you?",
    lead: "How do we ",
    accent: "reach you?",
    subtitle: "Add a phone number for account alerts and guest campaign updates.",
    icon: Phone,
    iconClass: "bg-brand-convert text-white",
    accentClass: "landing-hero-accent-pink",
  },
  {
    title: "Secure your account",
    lead: "Secure ",
    accent: "your account",
    subtitle: "Create a strong password. You will verify your email with a code next.",
    icon: Lock,
    iconClass: "bg-brand-retain text-white",
    accentClass: "landing-hero-accent-green",
  },
] as const;

function fieldRing(hasError: boolean) {
  return hasError ? "border-red-400 ring-2 ring-red-100" : "border-[#e8edf5] focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15";
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

export default function SignupForm({
  submitting,
  errorMessage,
  loginHref = "/auth/login",
  onSubmit,
}: SignupFormProps) {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [ignoreAutofill, setIgnoreAutofill] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
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

  const watchName = watch("name");
  const watchEmail = watch("email");
  const passwordValue = watch("password");
  const strength = useMemo(() => passwordStrength(passwordValue ?? ""), [passwordValue]);
  const currentStep = STEPS[step];
  const StepIcon = currentStep.icon;
  const progress = ((step + 1) / STEPS.length) * 100;

  const goNext = async () => {
    if (step === 0) {
      const ok = await trigger(["name", "email"]);
      if (ok) setStep(1);
      return;
    }
    if (step === 1) {
      const ok = await trigger(["phone"]);
      if (ok) setStep(2);
    }
  };

  const goBack = () => setStep((value) => Math.max(0, value - 1));

  const inputClass = (hasError: boolean) =>
    `brand-input py-3 text-sm read-only:bg-[#f8faff]/80 ${fieldRing(hasError)}`;

  return (
    <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-[#e8edf5]/80 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.04),0_24px_56px_rgba(15,23,42,0.1)]">
      <div className="grid lg:grid-cols-[0.96fr_1.04fr] lg:items-stretch">
        <SignupExperiencePanel name={watchName ?? ""} email={watchEmail ?? ""} />

        <div className="flex flex-col bg-white p-6 sm:p-7 lg:p-8">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-[#e8edf5] pb-4">
              <Link href="/" className="shrink-0">
                <DealiooLogo variant="light" className="h-8 w-auto" priority />
              </Link>
              <p className="text-xs font-semibold text-brand-muted">
                Step {step + 1} of {STEPS.length}
              </p>
            </div>

            <div className="mb-5 h-1 overflow-hidden rounded-full bg-[#e8edf5]">
              <motion.div
                className="h-full rounded-full bg-brand-primary"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.45, ease: easeOut }}
              />
            </div>

            <div className="mb-5 flex items-start gap-3.5">
              <motion.span
                key={step}
                initial={reduced ? false : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${currentStep.iconClass}`}
              >
                <StepIcon className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
              </motion.span>
              <div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={reduced ? false : { opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduced ? undefined : { opacity: 0, x: -12 }}
                    transition={{ duration: 0.3, ease: easeOut }}
                  >
                    <h1 className="brand-landing-display text-xl font-semibold leading-snug sm:text-[1.35rem]">
                      {currentStep.lead}
                      <span className={currentStep.accentClass}>{currentStep.accent}</span>
                    </h1>
                    <p className="mt-1.5 text-sm leading-relaxed text-brand-body">{currentStep.subtitle}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <form
              method="post"
              action="/"
              className="flex flex-1 flex-col"
              onSubmit={handleSubmit(({ confirmPassword: _confirmPassword, ...data }) => onSubmit(data))}
              noValidate
            >
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  {step === 0 ? (
                    <motion.div
                      key="step-0"
                      initial={reduced ? false : { opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduced ? undefined : { opacity: 0, y: -12 }}
                      transition={{ duration: 0.35, ease: easeOut }}
                      className="space-y-3"
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
                            minLength: { value: 2, message: "Name must be at least 2 characters." },
                          })}
                        />
                        {errors.name ? <p className="mt-1 text-xs text-brand-error">{errors.name.message}</p> : null}
                      </div>

                      <div>
                        <label htmlFor="signup-email" className="brand-label mb-1.5">
                          <Mail className="h-4 w-4 text-brand-muted" aria-hidden />
                          Work email
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
                          placeholder="you@restaurant.com"
                          {...register("email", {
                            required: "Enter your email.",
                            pattern: {
                              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                              message: "Enter a valid email.",
                            },
                          })}
                        />
                        {errors.email ? <p className="mt-1 text-xs text-brand-error">{errors.email.message}</p> : null}
                      </div>

                      <SignupPreviewCard
                        name={watchName ?? ""}
                        email={watchEmail ?? ""}
                        step={step}
                      />
                    </motion.div>
                  ) : null}

                  {step === 1 ? (
                    <motion.div
                      key="step-1"
                      initial={reduced ? false : { opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduced ? undefined : { opacity: 0, y: -12 }}
                      transition={{ duration: 0.35, ease: easeOut }}
                      className="space-y-3"
                    >
                      <div>
                        <label htmlFor="signup-phone" className="brand-label mb-1.5">
                          <Phone className="h-4 w-4 text-brand-muted" aria-hidden />
                          Phone number
                        </label>
                        <input
                          id="signup-phone"
                          type="tel"
                          autoComplete="tel"
                          disabled={submitting}
                          readOnly={ignoreAutofill}
                          onFocus={() => setIgnoreAutofill(false)}
                          aria-invalid={!!errors.phone}
                          className={inputClass(!!errors.phone)}
                          placeholder="+15551234567"
                          {...register("phone", {
                            required: "Enter your phone number.",
                            pattern: {
                              value: /^\+?[1-9]\d{7,14}$/,
                              message: "Use international format, e.g. +15551234567.",
                            },
                          })}
                        />
                        {errors.phone ? <p className="mt-1 text-xs text-brand-error">{errors.phone.message}</p> : null}
                      </div>

                      <div className="rounded-xl border border-[#e8edf5] bg-[#f8faff] px-4 py-3.5">
                        <p className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
                          <Sparkles className="h-4 w-4 text-brand-primary" aria-hidden />
                          Why we ask
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-brand-muted">
                          For login alerts, campaign notifications, and quick support if a guest funnel needs attention.
                        </p>
                      </div>
                    </motion.div>
                  ) : null}

                  {step === 2 ? (
                    <motion.div
                      key="step-2"
                      initial={reduced ? false : { opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduced ? undefined : { opacity: 0, y: -12 }}
                      transition={{ duration: 0.35, ease: easeOut }}
                      className="space-y-3"
                    >
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
                              minLength: { value: 8, message: "Password must be at least 8 characters." },
                            })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            disabled={submitting}
                            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-brand-muted hover:bg-[#f8faff] hover:text-brand-navy"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.password ? <p className="mt-1 text-xs text-brand-error">{errors.password.message}</p> : null}

                        {passwordValue ? (
                          <div className="mt-3 space-y-2">
                            <div className="flex gap-1.5">
                              {[0, 1, 2, 3].map((i) => (
                                <motion.div
                                  key={i}
                                  className="h-1.5 flex-1 rounded-full"
                                  animate={{
                                    backgroundColor: i < strength ? STRENGTH_COLORS[Math.max(strength - 1, 0)] : "#e8edf5",
                                    scaleY: i < strength && !reduced ? [1, 1.3, 1] : 1,
                                  }}
                                  transition={{ duration: 0.3 }}
                                />
                              ))}
                            </div>
                          <p className="mt-1.5 text-[11px] font-semibold leading-none" style={{ color: STRENGTH_COLORS[Math.max(strength - 1, 0)] }}>
                              {STRENGTH_LABELS[Math.max(strength - 1, 0)]} password
                            </p>
                          </div>
                        ) : null}
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
                              validate: (value) => value === passwordValue || "Passwords do not match.",
                            })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((value) => !value)}
                            disabled={submitting}
                            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-brand-muted hover:bg-[#f8faff] hover:text-brand-navy"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.confirmPassword ? (
                          <p className="mt-1 text-xs text-brand-error">{errors.confirmPassword.message}</p>
                        ) : null}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {errorMessage ? (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>{errorMessage}</span>
                </div>
              ) : null}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={submitting}
                    className="landing-btn-outline inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-brand-navy disabled:opacity-50"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                    Back
                  </button>
                ) : (
                  <Link
                    href="/"
                    className="landing-btn-ghost inline-flex h-11 items-center justify-center text-sm font-medium"
                  >
                    ← Back to home
                  </Link>
                )}

                {step < 2 ? (
                  <motion.button
                    type="button"
                    onClick={() => void goNext()}
                    disabled={submitting}
                    whileHover={reduced ? undefined : { scale: 1.02 }}
                    whileTap={reduced ? undefined : { scale: 0.98 }}
                    className="landing-btn-primary inline-flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold disabled:opacity-50 sm:ml-auto"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </motion.button>
                ) : (
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    aria-busy={submitting}
                    whileHover={reduced ? undefined : { scale: 1.02 }}
                    whileTap={reduced ? undefined : { scale: 0.98 }}
                    className="landing-btn-primary inline-flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold disabled:opacity-50 sm:ml-auto"
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    ) : (
                      <>
                        Launch my account
                        <Rocket className="h-4 w-4" aria-hidden />
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </form>

            <p className="mt-5 text-center text-sm text-brand-body">
              Already have an account?{" "}
              <Link href={loginHref} className="font-semibold text-brand-primary hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
    </div>
  );
}
