"use client";

/**
 * Login form — split layout matching signup (brand panel + form side).
 */
import DealiooLogo from "@/app/components/brand/DealiooLogo";
import { LoginBrandCopy, LoginExperiencePanel, LoginPreviewCard } from "@/app/components/SignupExperiencePanel";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
} from "lucide-react";
import Link from "next/link";
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
};

function fieldRing(hasError: boolean) {
  return hasError
    ? "border-red-400 ring-2 ring-red-100"
    : "border-[#e8edf5] focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15";
}

export default function LoginForm({
  submitting,
  errorMessage,
  signupHref = "/auth/signup",
  onCredentialsSubmit,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [ignoreAutofill, setIgnoreAutofill] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const watchEmail = watch("email");

  const inputClass = (hasError: boolean) =>
    `brand-input py-3 text-sm read-only:bg-[#f8faff]/80 ${fieldRing(hasError)}`;

  return (
    <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-[#e8edf5]/80 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.04),0_24px_56px_rgba(15,23,42,0.1)]">
      <div className="grid lg:grid-cols-[0.96fr_1.04fr] lg:items-stretch">
        <LoginExperiencePanel email={watchEmail ?? ""} />

        <div className="flex flex-col bg-white p-6 sm:p-7 lg:p-8">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-[#e8edf5] pb-4">
            <Link href="/" className="shrink-0">
              <DealiooLogo variant="light" className="h-8 w-auto" priority />
            </Link>
            <Link
              href={signupHref}
              className="text-xs font-semibold text-brand-primary transition-colors hover:text-brand-primary-hover"
            >
              Sign up free
            </Link>
          </div>

          <div className="mb-5 lg:hidden">
            <LoginBrandCopy />
            <div className="mt-5">
              <LoginPreviewCard email={watchEmail ?? ""} />
            </div>
          </div>

          <div className="mb-5 hidden items-start gap-3.5 lg:flex">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-white shadow-sm">
              <LogIn className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
            </span>
            <div>
              <h1 className="brand-landing-display text-xl font-semibold leading-snug">
                Sign in to your{" "}
                <span className="landing-hero-accent-blue">dashboard</span>
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-brand-body">
                Enter your email and password to continue.
              </p>
            </div>
          </div>

          <form
            method="post"
            action="/"
            className="flex flex-1 flex-col"
            onSubmit={handleSubmit((data) => onCredentialsSubmit(data.email, data.password))}
            noValidate
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="login-email" className="brand-label mb-1.5">
                  <Mail className="h-4 w-4 text-brand-muted" aria-hidden />
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
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
                {errors.email ? (
                  <p className="mt-1 text-xs text-brand-error">{errors.email.message}</p>
                ) : null}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label htmlFor="login-password" className="brand-label !mb-0">
                    <Lock className="h-4 w-4 text-brand-muted" aria-hidden />
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-xs font-medium text-brand-muted transition-colors hover:text-brand-primary"
                    onClick={(e) => e.preventDefault()}
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    disabled={submitting}
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
                    disabled={submitting}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-brand-muted hover:bg-[#f8faff] hover:text-brand-navy"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password ? (
                  <p className="mt-1 text-xs text-brand-error">{errors.password.message}</p>
                ) : null}
              </div>
            </div>

            {errorMessage ? (
              <div
                className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{errorMessage}</span>
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/"
                className="landing-btn-ghost inline-flex h-11 items-center justify-center text-sm font-medium"
              >
                ← Back to home
              </Link>

              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                className="landing-btn-primary inline-flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold disabled:opacity-50 sm:ml-auto"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="mt-5 text-center text-sm text-brand-body">
            Don&apos;t have an account?{" "}
            <Link href={signupHref} className="font-semibold text-brand-primary hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
