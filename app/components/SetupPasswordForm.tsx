"use client";

import DealiooLogo from "@/app/components/brand/DealiooLogo";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const AUTH_PASSWORD_MIN = 8;

type SetupPasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirm: string;
};

export type SetupPasswordFormProps = {
  currentPasswordFromLogin: string;
  submitting: boolean;
  errorMessage: string | null;
  onSavePasswords: (currentPassword: string, newPassword: string) => Promise<void>;
};

const inputBase = "brand-input py-2";

function fieldRing(hasError: boolean) {
  return hasError ? "brand-input-error" : "";
}

export default function SetupPasswordForm({
  currentPasswordFromLogin,
  submitting,
  errorMessage,
  onSavePasswords,
}: SetupPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);

  const requireTypedCurrent =
    currentPasswordFromLogin.trim().length < AUTH_PASSWORD_MIN;

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<SetupPasswordFormValues>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirm: "",
    },
  });

  useEffect(() => {
    if (!requireTypedCurrent) {
      setValue("currentPassword", currentPasswordFromLogin, {
        shouldValidate: false,
        shouldDirty: false,
      });
    }
  }, [currentPasswordFromLogin, requireTypedCurrent, setValue]);

  return (
    <div className="brand-auth-card">
      <div className="mb-8 flex flex-col items-center text-center">
        <DealiooLogo variant="light" className="mb-6 h-9 w-auto sm:h-10" />
        <h1 className="brand-heading">Set new password</h1>
        <p className="mt-1.5 whitespace-nowrap text-sm leading-relaxed text-brand-muted">
          Enter a new password (at least {AUTH_PASSWORD_MIN} characters).
        </p>
      </div>

      <form
        method="post"
        action="/"
        className="flex w-full flex-col gap-5 font-sans"
        noValidate
        onSubmit={handleSubmit((data) => {
          const current = requireTypedCurrent
            ? data.currentPassword.trim()
            : currentPasswordFromLogin.trim();
          if (
            requireTypedCurrent &&
            current.length < AUTH_PASSWORD_MIN
          ) {
            setError("currentPassword", {
              type: "manual",
              message: `Current password must be at least ${AUTH_PASSWORD_MIN} characters.`,
            });
            return;
          }
          if (data.newPassword.length < AUTH_PASSWORD_MIN) {
            setError("newPassword", {
              type: "manual",
              message: `New password must be at least ${AUTH_PASSWORD_MIN} characters.`,
            });
            return;
          }
          if (data.newPassword !== data.confirm) {
            setError("confirm", {
              type: "manual",
              message: "New passwords do not match.",
            });
            return;
          }
          void onSavePasswords(current, data.newPassword);
        })}
      >
        {requireTypedCurrent ? (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="setup-current-password"
              className="brand-label"
            >
              <Lock className="h-4 w-4 shrink-0 text-brand-muted" aria-hidden />
              Current password
            </label>
            <div className="relative">
              <input
                id="setup-current-password"
                type={showCurrent ? "text" : "password"}
                autoComplete="current-password"
                disabled={submitting}
                aria-invalid={!!errors.currentPassword}
                className={`${inputBase} pl-4 pr-11 ${fieldRing(!!errors.currentPassword)}`}
                placeholder="Password you used to sign in"
                {...register("currentPassword")}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                disabled={submitting}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-brand-muted transition-colors hover:bg-brand-soft hover:text-brand-navy disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? (
                  <EyeOff className="h-4 w-4 shrink-0" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4 shrink-0" aria-hidden />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-sm text-brand-error">
                {errors.currentPassword.message}
              </p>
            )}
          </div>
        ) : (
          <input type="hidden" {...register("currentPassword")} />
        )}

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="setup-new-password"
            className="brand-label"
          >
            <Lock className="h-4 w-4 shrink-0 text-brand-muted" aria-hidden />
            New password
          </label>
          <div className="relative">
            <input
              id="setup-new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              disabled={submitting}
              aria-invalid={!!errors.newPassword}
              className={`${inputBase} pl-4 pr-11 ${fieldRing(!!errors.newPassword)}`}
              placeholder="Enter new password"
              {...register("newPassword")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={submitting}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-brand-muted transition-colors hover:bg-brand-soft hover:text-brand-navy disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <Eye className="h-4 w-4 shrink-0" aria-hidden />
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-sm text-brand-error">{errors.newPassword.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="setup-confirm"
            className="brand-label"
          >
            <Lock className="h-4 w-4 shrink-0 text-brand-muted" aria-hidden />
            Confirm new password
          </label>
          <input
            id="setup-confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            disabled={submitting}
            aria-invalid={!!errors.confirm}
            className={`${inputBase} px-4 ${fieldRing(!!errors.confirm)}`}
            placeholder="Confirm new password"
            {...register("confirm")}
          />
          {errors.confirm && (
            <p className="text-sm text-brand-error">{errors.confirm.message}</p>
          )}
        </div>

        {errorMessage && (
          <div
            className="brand-error-banner"
            role="alert"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-brand-error"
              aria-hidden
            />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="brand-btn-primary mt-1"
        >
          {submitting ? (
            <Loader2
              className="h-6 w-6 animate-spin text-white"
              strokeWidth={2.5}
              aria-hidden
            />
          ) : (
            "Save password"
          )}
        </button>
      </form>
    </div>
  );
}
