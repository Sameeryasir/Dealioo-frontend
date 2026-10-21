"use client";

import {
  isStrongEnoughPassword,
  PASSWORD_RULE_MESSAGE,
} from "@/app/lib/auth-password";
import { AlertCircle, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

type SetupView = "starting" | "newPassword" | "invalid";

export type SetPasswordFormProps = {
  token: string;
  submitting: boolean;
  onStart: (token: string) => Promise<{ maskedEmail: string }>;
  onComplete: (token: string, password: string) => Promise<void>;
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

export default function SetPasswordForm({
  token,
  submitting,
  onStart,
  onComplete,
}: SetPasswordFormProps) {
  const [view, setView] = useState<SetupView>("starting");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const startedRef = useRef(false);

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    watch: watchReset,
    formState: { errors: resetErrors },
  } = useForm<ResetPasswordFormValues>({
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onTouched",
  });

  const resetPasswordValue = watchReset("password");

  useEffect(() => {
    if (!token || startedRef.current) return;
    startedRef.current = true;
    setView("starting");
    setLocalError(null);
    void (async () => {
      try {
        const result = await onStart(token);
        setMaskedEmail(result.maskedEmail);
        setView("newPassword");
      } catch (error) {
        setLocalError(
          error instanceof Error
            ? error.message
            : "Invalid or expired setup link.",
        );
        setView("invalid");
      }
    })();
  }, [token, onStart]);

  const inputClass = (hasError: boolean) =>
    `brand-input w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-brand-navy outline-none transition ${fieldRing(hasError)}`;

  return (
    <div className="auth-signup-step flex min-h-0 flex-1 flex-col">
      <div className="auth-signup-step-scroll">
        <div className="auth-signup-step-intro">
          {view === "starting" ? (
            <>
              <h2 className="brand-landing-display auth-signup-step-title">
                Setting up your{" "}
                <span className="landing-hero-accent-pink">account</span>
              </h2>
              <p className="auth-signup-step-sub mt-1.5">
                Checking your secure link…
              </p>
            </>
          ) : view === "invalid" ? (
            <>
              <h2 className="brand-landing-display auth-signup-step-title">
                Link{" "}
                <span className="landing-hero-accent-pink">unavailable</span>
              </h2>
              <p className="auth-signup-step-sub mt-1.5">
                This setup link is invalid, expired, or already used.
              </p>
            </>
          ) : (
            <>
              <h2 className="brand-landing-display auth-signup-step-title">
                Choose your{" "}
                <span className="landing-hero-accent-pink">password</span>
              </h2>
              <p className="auth-signup-step-sub mt-1.5">
                Choose a password for {maskedEmail || "your account"}.
              </p>
            </>
          )}
        </div>

        <div className="auth-signup-step-body">
          {localError ? (
            <div
              className="auth-signup-form-alert-banner"
              role="alert"
              aria-live="polite"
            >
              <div className="auth-signup-form-alert flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{localError}</span>
              </div>
            </div>
          ) : null}

          {view === "starting" ? (
            <div className="flex items-center justify-center py-10 text-brand-muted">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              <span className="sr-only">Loading</span>
            </div>
          ) : view === "invalid" ? (
            <p className="text-sm text-brand-muted">
              Ask your admin to resend the invite, or{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-brand-primary hover:underline"
              >
                sign in
              </Link>{" "}
              if you already set a password.
            </p>
          ) : (
            <form
              id="auth-set-password-form"
              className="auth-signup-form flex flex-col"
              onSubmit={handleResetSubmit(async (data) => {
                setLocalError(null);
                try {
                  await onComplete(token, data.password);
                } catch (error) {
                  setLocalError(
                    error instanceof Error
                      ? error.message
                      : "Could not set password.",
                  );
                }
              })}
              noValidate
            >
              <div className="auth-signup-fields auth-signup-fields--profile-step">
                <div className="auth-signup-field-stack">
                  <div>
                    <label
                      htmlFor="set-password"
                      className="brand-label mb-1.5"
                    >
                      <Lock className="h-4 w-4 text-brand-muted" aria-hidden />
                      New password
                    </label>
                    <div className="relative">
                      <input
                        id="set-password"
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
                          validate: (value) =>
                            isStrongEnoughPassword(value) ||
                            PASSWORD_RULE_MESSAGE,
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        disabled={submitting}
                        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-brand-muted hover:bg-[#f8faff] hover:text-brand-navy"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
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
                      htmlFor="set-confirm-password"
                      className="brand-label mb-1.5"
                    >
                      <Lock className="h-4 w-4 text-brand-muted" aria-hidden />
                      Confirm password
                    </label>
                    <div className="relative">
                      <input
                        id="set-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        disabled={submitting}
                        aria-invalid={!!resetErrors.confirmPassword}
                        className={`${inputClass(!!resetErrors.confirmPassword)} pr-11`}
                        placeholder="Re-enter your password"
                        {...registerReset("confirmPassword", {
                          required: "Confirm your password.",
                          validate: (value) =>
                            value === resetPasswordValue ||
                            "Passwords do not match.",
                        })}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword((value) => !value)
                        }
                        disabled={submitting}
                        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-brand-muted hover:bg-[#f8faff] hover:text-brand-navy"
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <FieldError
                      message={resetErrors.confirmPassword?.message}
                    />
                  </div>
                </div>

                <div className="mt-10 flex justify-start pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="landing-btn-primary inline-flex h-10 min-w-[10.5rem] cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-sm font-bold disabled:opacity-60"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : null}
                    Set password &amp; continue
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {view === "invalid" ? (
        <div className="auth-signup-mobile-dock">
          <Link
            href="/auth/login"
            className="landing-btn-primary inline-flex h-10 w-full items-center justify-center rounded-full px-5 text-sm font-bold"
          >
            Back to login
          </Link>
        </div>
      ) : null}
    </div>
  );
}
