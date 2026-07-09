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

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

type LoginView = "credentials" | "forgotEmail" | "otp" | "newPassword";

export type LoginFormProps = {
  submitting: boolean;
  errorMessage: string | null;
  signupHref?: string;
  onCredentialsSubmit: (email: string, password: string) => Promise<void>;
  onForgotPassword: (email: string) => Promise<void>;
  onVerifyRecoveryOtp: (email: string, otp: number) => Promise<void>;
  onResetPassword: (email: string, otp: number, password: string) => Promise<void>;
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
  onVerifyRecoveryOtp,
  onResetPassword,
  onResendOtp,
}: LoginFormProps) {
  const router = useRouter();
  const [view, setView] = useState<LoginView>("credentials");
  const [otpEmail, setOtpEmail] = useState("");
  const [recoveryOtp, setRecoveryOtp] = useState<number | null>(null);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [ignoreAutofill, setIgnoreAutofill] = useState(true);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    watch: watchReset,
    formState: { errors: resetErrors },
  } = useForm<ResetPasswordFormValues>({
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onTouched",
  });

  const {
    register: registerForgotEmail,
    handleSubmit: handleForgotEmailSubmit,
    reset: resetForgotEmailForm,
    formState: { errors: forgotEmailErrors },
  } = useForm<{ email: string }>({
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  const resetPasswordValue = watchReset("password");

  const needsSignup =
    errorMessage != null && /sign up first/i.test(errorMessage);

  const displayError =
    view === "credentials" ? errorMessage : localError;

  const inputClass = (hasError: boolean) =>
    `brand-input py-3 text-sm read-only:bg-[#f8faff]/80 ${fieldRing(hasError)}`;

  const handleStartForgotPassword = () => {
    setLocalError(null);
    resetForgotEmailForm({ email: getValues("email").trim() });
    setView("forgotEmail");
  };

  const handleSendForgotCode = handleForgotEmailSubmit(async (data) => {
    setLocalError(null);
    const email = data.email.trim();
    setForgotSubmitting(true);
    try {
      await onForgotPassword(email);
      setOtpEmail(email);
      setRecoveryOtp(null);
      setView("otp");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not send verification code.";
      setLocalError(message);
    } finally {
      setForgotSubmitting(false);
    }
  });

  const handleOtpContinue = async (otp: number) => {
    setLocalError(null);
    try {
      await onVerifyRecoveryOtp(otpEmail, otp);
      setRecoveryOtp(otp);
      setView("newPassword");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not verify code.";
      setLocalError(message);
      throw error;
    }
  };

  const handleBackFromOtp = () => {
    setView("forgotEmail");
    setRecoveryOtp(null);
    setLocalError(null);
  };

  const handleBackFromForgotEmail = () => {
    setView("credentials");
    setLocalError(null);
  };

  const handleBackFromNewPassword = () => {
    setView("otp");
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
          ) : view === "forgotEmail" ? (
            <>
              <h2 className="brand-landing-display auth-signup-step-title">
                Reset your <span className="landing-hero-accent-pink">password</span>
              </h2>
              <p className="auth-signup-step-sub mt-1.5">
                Enter your account email and we&apos;ll send you a verification code.
              </p>
            </>
          ) : view === "otp" ? (
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
          ) : (
            <>
              <h2 className="brand-landing-display auth-signup-step-title">
                Set a new <span className="landing-hero-accent-pink">password</span>
              </h2>
              <p className="auth-signup-step-sub mt-1.5">
                Choose a new password for {otpEmail || "your account"}.
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

          {view === "forgotEmail" ? (
            <form
              id="auth-forgot-email-form"
              className="auth-signup-form flex flex-col"
              onSubmit={handleSendForgotCode}
              noValidate
            >
              <div className="auth-signup-fields auth-signup-fields--profile-step">
                <div>
                  <label htmlFor="forgot-email" className="brand-label mb-1.5">
                    <Mail className="h-4 w-4 text-brand-muted" aria-hidden />
                    Email Address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    disabled={forgotSubmitting}
                    aria-invalid={!!forgotEmailErrors.email}
                    className={inputClass(!!forgotEmailErrors.email)}
                    placeholder="name@company.com"
                    {...registerForgotEmail("email", {
                      required: "Enter your email.",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email.",
                      },
                    })}
                  />
                  <FieldError message={forgotEmailErrors.email?.message} />
                </div>
              </div>
            </form>
          ) : view === "otp" ? (
            <div className="auth-signup-fields auth-signup-fields--otp-step">
              <OtpForm
                embedded
                email={otpEmail}
                formId="auth-forgot-otp-form"
                actionsPlacement="footer"
                onLoadingChange={setOtpLoading}
                onVerifyOtp={handleOtpContinue}
                onResendOtp={onResendOtp}
                onBack={handleBackFromOtp}
              />
            </div>
          ) : view === "newPassword" ? (
            <form
              id="auth-reset-password-form"
              className="auth-signup-form flex flex-col"
              onSubmit={handleResetSubmit(async (data) => {
                if (recoveryOtp == null) {
                  setLocalError("Missing verification code. Go back and try again.");
                  return;
                }
                setLocalError(null);
                try {
                  await onResetPassword(otpEmail, recoveryOtp, data.password);
                } catch (error) {
                  const message =
                    error instanceof Error
                      ? error.message
                      : "Could not reset password.";
                  setLocalError(message);
                }
              })}
              noValidate
            >
              <div className="auth-signup-fields auth-signup-fields--profile-step">
                <div className="auth-signup-field-stack">
                  <div>
                    <label htmlFor="reset-password" className="brand-label mb-1.5">
                      <Lock className="h-4 w-4 text-brand-muted" aria-hidden />
                      New password
                    </label>
                    <div className="relative">
                      <input
                        id="reset-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        disabled={submitting}
                        aria-invalid={!!resetErrors.password}
                        className={`${inputClass(!!resetErrors.password)} pr-11`}
                        placeholder="At least 8 characters"
                        {...registerReset("password", {
                          required: "Enter a new password.",
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
                    <FieldError message={resetErrors.password?.message} />
                  </div>

                  <div>
                    <label
                      htmlFor="reset-confirm-password"
                      className="brand-label mb-1.5"
                    >
                      <Lock className="h-4 w-4 text-brand-muted" aria-hidden />
                      Confirm password
                    </label>
                    <div className="relative">
                      <input
                        id="reset-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        disabled={submitting}
                        aria-invalid={!!resetErrors.confirmPassword}
                        className={`${inputClass(!!resetErrors.confirmPassword)} pr-11`}
                        placeholder="Re-enter your password"
                        {...registerReset("confirmPassword", {
                          required: "Confirm your password.",
                          validate: (value) =>
                            value === resetPasswordValue || "Passwords do not match.",
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
                    <FieldError message={resetErrors.confirmPassword?.message} />
                  </div>
                </div>
              </div>
            </form>
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
                        onClick={handleStartForgotPassword}
                        disabled={submitting || forgotSubmitting}
                        className="auth-login-forgot-link text-xs font-semibold landing-hero-accent-pink transition-opacity hover:opacity-80 disabled:opacity-50"
                      >
                        Forgot password?
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
        ) : view === "forgotEmail" ? (
          <div className="auth-signup-actions">
            <button
              type="button"
              onClick={handleBackFromForgotEmail}
              disabled={forgotSubmitting}
              className="landing-btn-outline auth-signup-action-btn inline-flex h-11 cursor-pointer touch-manipulation items-center justify-center rounded-full px-3 text-sm font-semibold disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              form="auth-forgot-email-form"
              disabled={forgotSubmitting}
              aria-busy={forgotSubmitting}
              className="landing-btn-primary auth-signup-action-btn inline-flex h-11 cursor-pointer touch-manipulation items-center justify-center rounded-full px-3 text-sm font-bold disabled:opacity-50"
            >
              {forgotSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                "Send code"
              )}
            </button>
          </div>
        ) : view === "otp" ? (
          <div className="auth-signup-actions">
            <button
              type="button"
              onClick={handleBackFromOtp}
              disabled={otpLoading || submitting}
              className="landing-btn-outline auth-signup-action-btn inline-flex h-11 cursor-pointer touch-manipulation items-center justify-center rounded-full px-3 text-sm font-semibold disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              form="auth-forgot-otp-form"
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
          </div>
        ) : view === "newPassword" ? (
          <div className="auth-signup-actions">
            <button
              type="button"
              onClick={handleBackFromNewPassword}
              disabled={submitting}
              className="landing-btn-outline auth-signup-action-btn inline-flex h-11 cursor-pointer touch-manipulation items-center justify-center rounded-full px-3 text-sm font-semibold disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              form="auth-reset-password-form"
              disabled={submitting}
              aria-busy={submitting}
              className="landing-btn-primary auth-signup-action-btn inline-flex h-11 cursor-pointer touch-manipulation items-center justify-center rounded-full px-3 text-sm font-bold disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                "Reset password"
              )}
            </button>
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
