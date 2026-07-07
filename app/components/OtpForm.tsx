"use client";

import DealiooLogo from "@/app/components/brand/DealiooLogo";
import {
  AlertCircle,
  Loader2,
  LogIn,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useForm } from "react-hook-form";

type OtpFormValues = {
  code: string;
};

const OTP_LENGTH = 6;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export type OtpFormProps = {
  onVerifyOtp: (otp: number) => Promise<void>;
  email?: string;
  onResendOtp?: () => Promise<void>;
  embedded?: boolean;
  authenticatorMode?: boolean;
  onBack?: () => void;
  suppressEmailResend?: boolean;
  actionsPlacement?: "inline" | "footer";
  formId?: string;
  onLoadingChange?: (loading: boolean) => void;
};

const cellBase =
  "brand-input auth-otp-cell text-center text-lg font-semibold tabular-nums";

function cellRing(hasError: boolean) {
  return hasError ? "brand-input-error" : "";
}

export default function OtpForm({
  email = "",
  onVerifyOtp,
  onResendOtp,
  embedded = false,
  authenticatorMode = false,
  onBack,
  suppressEmailResend = false,
  actionsPlacement = "inline",
  formId,
  onLoadingChange,
}: OtpFormProps) {
  const showEmailResend = !suppressEmailResend && !!onResendOtp;

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length: OTP_LENGTH }, () => ""),
  );
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError: setFieldError,
    clearErrors,
    formState: { errors },
  } = useForm<OtpFormValues>({
    defaultValues: { code: "" },
  });

  useEffect(() => {
    setValue("code", digits.join(""), { shouldValidate: false });
  }, [digits, setValue]);

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  const focusInput = useCallback((index: number) => {
    const el = inputRefs.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  const handleChange = useCallback(
    (index: number, raw: string) => {
      const onlyDigits = raw.replace(/\D/g, "");
      if (onlyDigits.length > 1) {
        const spread = onlyDigits.slice(0, OTP_LENGTH).split("");
        setDigits((prev) => {
          const next = [...prev];
          for (let i = 0; i < spread.length; i++) {
            if (index + i < OTP_LENGTH) next[index + i] = spread[i] ?? "";
          }
          return next;
        });
        const nextIndex = Math.min(index + spread.length, OTP_LENGTH - 1);
        focusInput(nextIndex);
        return;
      }

      const digit = onlyDigits.slice(-1);
      setDigits((prev) => {
        const next = [...prev];
        next[index] = digit;
        return next;
      });
      if (digit && index < OTP_LENGTH - 1) {
        focusInput(index + 1);
      }
    },
    [focusInput],
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        e.preventDefault();
        focusInput(index - 1);
      }
      if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        focusInput(index - 1);
      }
      if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
        e.preventDefault();
        focusInput(index + 1);
      }
    },
    [digits, focusInput],
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLFormElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
      if (!text) return;
      const chars = text.split("");
      setDigits((prev) => {
        const next = [...prev];
        chars.forEach((c, i) => {
          if (i < OTP_LENGTH) next[i] = c;
        });
        return next;
      });
      focusInput(Math.min(chars.length, OTP_LENGTH - 1));
    },
    [focusInput],
  );

  const onValidCode = async (values: OtpFormValues) => {
    if (loading) return;
    if (!authenticatorMode && !email) {
      setError("Missing email. Go back to log in and try again.");
      return;
    }

    const code = values.code.trim();
    if (!/^\d{6}$/.test(code)) {
      setFieldError("code", {
        type: "manual",
        message: code.length === 0 ? "Enter all 6 digits." : "Use digits only.",
      });
      return;
    }
    clearErrors("code");

    setError(null);
    setLoading(true);
    const otp = Number.parseInt(code, 10);
    try {
      await onVerifyOtp(otp);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  function onSubmitForm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void handleSubmit(onValidCode)(e);
  }

  async function handleResend() {
    if (suppressEmailResend || !onResendOtp || resendLoading || loading) return;
    if (!email) {
      setError("Missing email. Go back to log in and try again.");
      return;
    }

    setError(null);
    setResendLoading(true);
    try {
      await onResendOtp();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResendLoading(false);
    }
  }

  const codeInvalid = !!errors.code;

  const showInlineEmbeddedActions =
    embedded && onBack && actionsPlacement === "inline";

  const embeddedActionButtons = showInlineEmbeddedActions ? (
    <div className="auth-signup-actions">
      <button
        type="button"
        onClick={onBack}
        disabled={loading}
        className="landing-btn-outline auth-signup-action-btn inline-flex h-11 cursor-pointer touch-manipulation items-center justify-center rounded-full px-3 text-sm font-semibold disabled:opacity-50"
      >
        Back
      </button>
      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        aria-label={loading ? "Verifying" : "Verify"}
        className="landing-btn-primary auth-signup-action-btn inline-flex h-11 cursor-pointer touch-manipulation items-center justify-center gap-1.5 rounded-full px-3 text-sm font-bold disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          <>
            <span>Verify</span>
            <LogIn className="h-4 w-4 opacity-90" strokeWidth={2} aria-hidden />
          </>
        )}
      </button>
    </div>
  ) : null;

  const formInner = (
    <form
      id={formId}
      method="post"
      action="/"
      autoComplete="off"
      className="flex w-full flex-col gap-5 font-sans"
      onSubmit={onSubmitForm}
      onPaste={handlePaste}
      noValidate
    >
      <input type="hidden" {...register("code")} />

      <div className="flex flex-col gap-1.5">
        <label className="brand-label auth-otp-label justify-center">
          <span>
            {authenticatorMode ? "Authenticator code" : "One-time password"}
          </span>
        </label>

        <div className="auth-otp-grid mx-auto flex w-full justify-center gap-2.5 sm:gap-3">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              id={`otp-${index}`}
              name={`otp-${index}`}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={digit}
              disabled={loading}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
              aria-invalid={codeInvalid}
              className={`${cellBase} ${cellRing(codeInvalid)}`}
            />
          ))}
        </div>
        {errors.code && (
          <p className="text-center text-sm text-brand-error">{errors.code.message}</p>
        )}
      </div>

      {error && (
        <div className="brand-error-banner" role="alert">
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-brand-error"
            aria-hidden
          />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      {!embedded ? (
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          aria-label={loading ? "Verifying" : "Verify"}
          className="brand-btn-primary group mt-1"
        >
          {loading ? (
            <Loader2
              className="h-6 w-6 animate-spin text-white"
              strokeWidth={2.5}
              aria-hidden
            />
          ) : (
            <>
              <span>Verify</span>
              <LogIn
                className="h-5 w-5 opacity-90 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2}
                aria-hidden
              />
            </>
          )}
        </button>
      ) : null}
    </form>
  );

  const resendBlock =
    showEmailResend ? (
      <>
        <p className="mt-6 text-center text-sm">
          <button
            type="button"
            className="brand-link disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading || resendLoading}
            onClick={() => void handleResend()}
          >
            {resendLoading ? "Sending…" : "Resend code"}
          </button>
        </p>

        <p className="mt-6 text-center text-xs text-brand-muted">
          Didn&apos;t receive a code? Check spam or request a new one above.
        </p>
      </>
    ) : null;

  if (embedded) {
    return (
      <div className="auth-signup-otp-embedded flex flex-col font-sans">
        {formInner}
        {resendBlock}
        {embeddedActionButtons}
      </div>
    );
  }

  return (
    <div className="brand-auth-card">
      <div className="mb-8 flex flex-col items-center text-center">
        <DealiooLogo variant="light" className="mb-6 h-9 w-auto sm:h-10" />
        <h1 className="brand-heading">Verification code</h1>
        <p className="brand-subtext mt-1.5 max-w-[280px]">
          Enter the {OTP_LENGTH}-digit code we sent you to continue.
        </p>
      </div>

      {formInner}
      {resendBlock}
      {onBack && !embedded ? (
        <p className="mt-4 text-center text-sm">
          <button type="button" onClick={onBack} className="brand-link font-medium">
            ← Back
          </button>
        </p>
      ) : null}
    </div>
  );
}
