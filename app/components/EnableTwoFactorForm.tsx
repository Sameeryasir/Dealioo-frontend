"use client";

import OtpForm from "@/app/components/OtpForm";
import { useCredentialContext } from "@/app/contexts/credential-context";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { mergeSetupUser } from "@/app/lib/setup-user";
import { generate2fa } from "@/app/services/auth/generate-2fa";
import { verify2faSetup } from "@/app/services/auth/verify-2fa-setup";
import { sendOtp } from "@/app/services/auth/send-otp";
import { KeyRound, Loader2, Shield } from "lucide-react";
import { useState, type FormEvent } from "react";

type Step = "consent" | "qr" | "otp";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export type EnableTwoFactorFormProps = {
  onContinue?: () => void;
  onOtpVerify?: (otp: number) => Promise<void>;
};

export default function EnableTwoFactorForm({
  onContinue,
  onOtpVerify,
}: EnableTwoFactorFormProps) {
  const { email } = useCredentialContext();
  const [step, setStep] = useState<Step>("consent");
  const [enabled, setEnabled] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrMessage, setQrMessage] = useState<string | null>(null);

  function finishFlow() {
    onContinue?.();
  }

  async function handleOtpVerify(otp: number) {
    if (onOtpVerify) {
      await onOtpVerify(otp);
    } else {
      const result = await verify2faSetup(getSetupAccessToken(), otp);
      if (typeof result.twoFactorEnabled === "boolean") {
        mergeSetupUser({
          twoFactorEnabled: result.twoFactorEnabled,
          isTwoFactorVerified: result.twoFactorEnabled,
        });
      }
    }
    finishFlow();
  }

  async function handleResendEmailOtp() {
    if (!email) {
      throw new Error("No email on file. Sign in again.");
    }
    await sendOtp(email);
  }

  async function handleConsentSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!enabled || generating) return;
    setConsentError(null);
    const accessToken = getSetupAccessToken();
    if (!accessToken.trim()) {
      setConsentError("Session expired. Sign in again.");
      return;
    }
    setGenerating(true);
    try {
      const data = await generate2fa(accessToken);
      const nextQr =
        typeof data.qrCode === "string" ? data.qrCode.trim() : "";
      if (!nextQr) {
        setConsentError("No QR code was returned. Please try again.");
        return;
      }
      setQrCode(nextQr);
      setQrMessage(
        typeof data.message === "string" ? data.message.trim() : null,
      );
      setStep("qr");
    } catch (err) {
      setConsentError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  function handleBackFromQr() {
    setStep("consent");
    setQrCode(null);
    setQrMessage(null);
  }

  function handleBackFromOtp() {
    setStep("qr");
  }

  return (
    <div className="w-full max-w-[420px] rounded-2xl border border-zinc-200/80 bg-white/90 p-8 shadow-xl shadow-zinc-200/40 ring-1 ring-black/[0.03] backdrop-blur-sm sm:p-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 text-white shadow-lg shadow-zinc-900/25">
          {step === "otp" ? (
            <KeyRound className="h-6 w-6" strokeWidth={2} aria-hidden />
          ) : (
            <Shield className="h-6 w-6" strokeWidth={2} aria-hidden />
          )}
        </div>
        {step === "consent" ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Enable two-factor authentication
            </h1>
            <p className="mt-1.5 max-w-[300px] text-sm leading-relaxed text-zinc-500">
              Turn on 2FA for an extra layer of security on your account.
            </p>
          </>
        ) : step === "qr" ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Scan QR code
            </h1>
            <p className="mt-1.5 max-w-[300px] text-sm leading-relaxed text-zinc-500">
              {qrMessage ??
                "Open your authenticator app and scan this code to add your account."}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Enter authenticator code
            </h1>
            <p className="mt-1.5 max-w-[300px] text-sm leading-relaxed text-zinc-500">
              Enter the 6-digit code from your authenticator app to finish setup.
            </p>
          </>
        )}
      </div>

      {step === "consent" ? (
        <form
          className="flex flex-col gap-6 font-sans"
          onSubmit={(e) => void handleConsentSubmit(e)}
        >
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={generating}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-zinc-900 bg-white accent-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/25 disabled:opacity-50"
            />
            <span className="text-left text-sm leading-snug text-zinc-700">
              I want to enable two-factor authentication (2FA) on my account.
            </span>
          </label>

          {consentError && (
            <p className="text-center text-sm text-red-600" role="alert">
              {consentError}
            </p>
          )}

          <button
            type="submit"
            disabled={!enabled || generating}
            aria-busy={generating}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 text-base font-medium text-white shadow-lg shadow-zinc-900/25 transition-all hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            ) : null}
            <span>{generating ? "Loading…" : "Continue"}</span>
          </button>
        </form>
      ) : step === "qr" ? (
        <div className="flex flex-col gap-6 font-sans">
          {qrCode ? (
            <div className="flex justify-center rounded-xl border border-zinc-200 bg-white p-4">
              <img
                src={qrCode}
                alt=""
                width={210}
                height={210}
                className="h-auto max-w-full rounded-lg"
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={handleBackFromQr}
              className="flex h-12 w-full cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white px-5 text-base font-medium text-zinc-800 transition-colors hover:bg-zinc-50 sm:w-auto sm:min-w-[140px]"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep("otp")}
              className="flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-zinc-900 px-5 text-base font-medium text-white shadow-lg shadow-zinc-900/25 transition-all hover:bg-zinc-800 sm:w-auto sm:min-w-[140px]"
            >
              Continue
            </button>
          </div>
        </div>
      ) : (
        <OtpForm
          embedded
          authenticatorMode
          suppressEmailResend
          email={email}
          onVerifyOtp={handleOtpVerify}
          onResendOtp={handleResendEmailOtp}
          onBack={handleBackFromOtp}
        />
      )}
    </div>
  );
}
