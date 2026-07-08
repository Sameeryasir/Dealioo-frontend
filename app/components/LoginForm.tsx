"use client";

import OtpForm from "@/app/components/OtpForm";
import GoogleAuthButton from "@/app/components/auth/GoogleAuthButton";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

type LoginFormValues = {
  email: string;
  password: string;
};

export type LoginFormProps = {
  submitting: boolean;
  errorMessage: string | null;
  signupHref?: string;
  onCredentialsSubmit: (email: string, password: string) => Promise<void>;
  onForgotPassword: (email: string) => Promise<void>;
  onVerifyOtp: (otp: number) => Promise<void>;
  onResendOtp: () => Promise<void>;
};

function fieldRing(hasError: boolean) {
  return hasError
    ? "border-red-400 ring-2 ring-red-100"
    : "border-[#e8edf5] focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15";
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="auth-signup-field-error" role="alert" aria-live="polite">
      {message}
    </p>
  );
}

export default function LoginForm({
  submitting,
  errorMessage,
  signupHref = "/auth/signup",
  onCredentialsSubmit,
  onForgotPassword,
  onVerifyOtp,
  onResendOtp,
}: LoginFormProps) {
  const router = useRouter();
  const [view, setView] = useState<"credentials" | "otp">("credentials");
  const [otpEmail, setOtpEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [ignoreAutofill, setIgnoreAutofill] = useState(true);

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const needsSignup =
    errorMessage != null && /sign up first/i.test(errorMessage);

  const displayError = view === "credentials" ? errorMessage : localError;

  const inputClass = (hasError: boolean) =>
    `brand-input py-3 text-sm read-only:bg-[#f8faff]/80 ${fieldRing(hasError)}`;

  const handleForgotPassword = async () => {
    setLocalError(null);
    const emailOk = await trigger("email");
    if (!emailOk) return;

    const email = getValues("email").trim();
    setForgotSubmitting(true);
    try {
      await onForgotPassword(email);
      setOtpEmail(email);
      setView("otp");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not send verification code.";
      setLocalError(message);
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleBackFromOtp = () => {
    setView("credentials");
    setLocalError(null);
  };

  return (
    <>
      <div className="auth-signup-scroll-block">
        <div className="auth-signup-step-head">
          {view === "credentials" ? (
            <>
              <h2 className="brand-landing-display auth-signup-step-title">
                Welcome back
              </h2>
              <p className="auth-signup-step-sub mt-1.5">
                Enter your email and password to continue.
              </p>
            </>
          ) : (
            <>
              <h2 className="brand-landing-display auth-signup-step-title">
                Verify your <span className="landing-hero-accent-pink">email</span>
              </h2>
              <p className="auth-signup-step-sub mt-1.5">
                {otpEmail
                  ? `Enter the 6-digit code we sent to ${otpEmail}.`
                  : "Enter the 6-digit code we sent to your inbox."}
              </p>
            </>
          )}
        </div>

        <div className="auth-signup-step-body">
          {displayError ? (
            <div className="auth-signup-form-alert-banner" role="alert" aria-live="polite">
              <div className="auth-signup-form-alert flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <div className="space-y-2">
                  <span>{displayError}</span>
                  {needsSignup && view === "credentials" ? (
                    <Link
                      href={signupHref}
                      className="inline-flex font-semibold text-brand-primary hover:underline"
                    >
                      Create your free account
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {view === "otp" ? (
            <div className="auth-signup-fields auth-signup-fields--otp-step">
              <OtpForm
                embedded
                email={otpEmail}
                onVerifyOtp={onVerifyOtp}
                onResendOtp={onResendOtp}
                onBack={handleBackFromOtp}
              />
            </div>
          ) : (
            <form
              id="auth-login-form"
              className="auth-signup-form flex flex-col"
              onSubmit={handleSubmit((data) =>
                onCredentialsSubmit(data.email, data.password),
              )}
              noValidate
            >
              <div className="auth-signup-fields auth-signup-fields--profile-step">
                <div className="auth-signup-field-stack">
                  <div>
                    <label htmlFor="login-email" className="brand-label mb-1.5">
                      <Mail className="h-4 w-4 text-brand-muted" aria-hidden />
                      Email Address
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      disabled={submitting || forgotSubmitting}
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

                  <div>
                    <label htmlFor="login-password" className="brand-label mb-1.5">
                      <Lock className="h-4 w-4 text-brand-muted" aria-hidden />
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        disabled={submitting || forgotSubmitting}
                        readOnly={ignoreAutofill}
                        onFocus={() => setIgnoreAutofill(false)}
                        aria-invalid={!!errors.password}
                        className={`${inputClass(!!errors.password)} pr-11`}
                        placeholder="Enter your password"
                        {...register("password", {
                          required: "Enter your password.",
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        disabled={submitting || forgotSubmitting}
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
                    <p className="auth-login-forgot-wrap mt-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => void handleForgotPassword()}
                        disabled={submitting || forgotSubmitting}
                        className="auth-login-forgot-link text-xs font-semibold landing-hero-accent-pink transition-opacity hover:opacity-80 disabled:opacity-50"
                      >
                        {forgotSubmitting ? "Sending code…" : "Forgot password?"}
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="auth-signup-mobile-dock">
        {view === "credentials" ? (
          <div className="flex w-full flex-col gap-3">
            <GoogleAuthButton
              disabled={submitting || forgotSubmitting}
              mode="login"
              label="Continue with Google"
            />
            <div className="flex items-center gap-3 px-1">
              <div className="h-px flex-1 bg-[#e8edf5]" />
              <span className="text-xs font-medium text-brand-muted">or</span>
              <div className="h-px flex-1 bg-[#e8edf5]" />
            </div>
            <div className="auth-signup-actions">
              <button
                type="button"
                onClick={() => router.push("/")}
                disabled={submitting || forgotSubmitting}
                className="landing-btn-outline auth-signup-action-btn inline-flex h-11 cursor-pointer touch-manipulation items-center justify-center rounded-full px-3 text-sm font-semibold disabled:opacity-50"
              >
                Back to Home
              </button>

              <button
                type="submit"
                form="auth-login-form"
                disabled={submitting || forgotSubmitting}
                aria-busy={submitting}
                className="landing-btn-primary auth-signup-action-btn inline-flex h-11 cursor-pointer touch-manipulation items-center justify-center rounded-full px-3 text-sm font-bold disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </div>
        ) : null}

        <footer className="auth-signup-card-footer">
          Don&apos;t have an account?{" "}
          <Link href={signupHref} className="font-semibold text-brand-primary hover:underline">
            Sign up free
          </Link>
        </footer>
      </div>
    </>
  );
}
