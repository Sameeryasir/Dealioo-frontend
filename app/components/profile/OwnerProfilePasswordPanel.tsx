"use client";

import {
  isStrongEnoughPassword,
  PASSWORD_RULE_MESSAGE,
} from "@/app/lib/auth-password";
import { resetPassword } from "@/app/services/auth/reset-password";
import { sendOtp } from "@/app/services/auth/send-otp";
import {
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";

type OwnerProfilePasswordPanelProps = {
  email: string;
  googleOnly: boolean;
  parentBusy: boolean;
  onBusyChange?: (busy: boolean) => void;
};

const inputClass =
  "h-11 w-full rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-sm text-[#07111f] outline-none transition placeholder:text-slate-400 hover:border-[#cbd5e1] focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/15 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "text-sm font-semibold text-[#07111f]";

export function OwnerProfilePasswordPanel({
  email,
  googleOnly,
  parentBusy,
  onBusyChange,
}: OwnerProfilePasswordPanelProps) {
  const otpId = useId();
  const passwordId = useId();
  const confirmId = useId();

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const busy = parentBusy || passwordBusy;

  useEffect(() => {
    onBusyChange?.(passwordBusy);
    return () => onBusyChange?.(false);
  }, [passwordBusy, onBusyChange]);

  const handleSendPasswordCode = async () => {
    setPasswordError(null);
    setPasswordBusy(true);
    try {
      await sendOtp(email);
      setOtpSent(true);
      toast.success("Verification code sent to your email.");
    } catch (error) {
      setPasswordError(
        error instanceof Error
          ? error.message
          : "Could not send verification code.",
      );
    } finally {
      setPasswordBusy(false);
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordError(null);

    const otpNumber = Number(otp.trim());
    if (!Number.isFinite(otpNumber) || otp.trim().length < 4) {
      setPasswordError("Enter the verification code from your email.");
      return;
    }
    if (!isStrongEnoughPassword(password)) {
      setPasswordError(PASSWORD_RULE_MESSAGE);
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordBusy(true);
    try {
      await resetPassword(email, otpNumber, password);
      setOtp("");
      setPassword("");
      setConfirmPassword("");
      setOtpSent(false);
      setShowPassword(false);
      setShowConfirm(false);
      toast.success("Password updated.");
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : "Could not update password.",
      );
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#e8edf5] bg-[#f8fafc] p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef5ff] text-[#1877f2]">
          <KeyRound className="size-4" strokeWidth={2.25} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-sm font-bold text-[#07111f]">Password</h3>
          <p className="m-0 mt-0.5 text-xs text-slate-500">
            {googleOnly
              ? "This account signs in with Google. Password changes are managed in Google."
              : "We’ll email a code to verify it’s you, then you can set a new password."}
          </p>

          {!googleOnly ? (
            <div className="mt-3 space-y-3">
              {!otpSent ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void handleSendPasswordCode();
                  }}
                  className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#dbeafe] bg-white px-3 text-sm font-semibold text-[#1877f2] transition hover:bg-[#eef5ff] disabled:opacity-60"
                >
                  {passwordBusy ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      Sending…
                    </>
                  ) : (
                    "Send verification code"
                  )}
                </button>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={otpId} className={labelClass}>
                      Verification code
                    </label>
                    <input
                      id={otpId}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      disabled={busy}
                      value={otp}
                      onChange={(event) => setOtp(event.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={passwordId} className={labelClass}>
                      New password
                    </label>
                    <div className="relative">
                      <input
                        id={passwordId}
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        disabled={busy}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className={`${inputClass} pr-11`}
                      />
                      <button
                        type="button"
                        disabled={busy}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 disabled:opacity-60"
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" aria-hidden />
                        ) : (
                          <Eye className="size-4" aria-hidden />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={confirmId} className={labelClass}>
                      Confirm password
                    </label>
                    <div className="relative">
                      <input
                        id={confirmId}
                        type={showConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        disabled={busy}
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        className={`${inputClass} pr-11`}
                      />
                      <button
                        type="button"
                        disabled={busy}
                        aria-label={
                          showConfirm
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                        onClick={() => setShowConfirm((current) => !current)}
                        className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 disabled:opacity-60"
                      >
                        {showConfirm ? (
                          <EyeOff className="size-4" aria-hidden />
                        ) : (
                          <Eye className="size-4" aria-hidden />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        void handleSendPasswordCode();
                      }}
                      className="inline-flex h-9 cursor-pointer items-center justify-center rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Resend code
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        void handleUpdatePassword();
                      }}
                      className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-3 text-sm font-bold text-white hover:bg-[#166fe0] disabled:opacity-60"
                    >
                      {passwordBusy ? (
                        <>
                          <Loader2
                            className="size-3.5 animate-spin"
                            aria-hidden
                          />
                          Updating…
                        </>
                      ) : (
                        "Update password"
                      )}
                    </button>
                  </div>
                </>
              )}

              {passwordError ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{passwordError}</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
