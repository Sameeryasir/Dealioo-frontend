"use client";

import OtpForm from "@/app/components/OtpForm";
import DealiooLogo from "@/app/components/brand/DealiooLogo";
import { useCredentialContext } from "@/app/contexts/credential-context";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { mergeSetupUser } from "@/app/lib/setup-user";
import { generate2fa } from "@/app/services/auth/generate-2fa";
import { verify2faSetup } from "@/app/services/auth/verify-2fa-setup";
import { sendOtp } from "@/app/services/auth/send-otp";
import { Loader2 } from "lucide-react";
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
    <div className="brand-auth-card">
      <div className="mb-8 flex flex-col items-center text-center">
        <DealiooLogo variant="light" className="mb-6 h-9 w-auto sm:h-10" />
        {step === "consent" ? (
          <>
            <h1 className="brand-heading">
              Enable two-factor authentication
            </h1>
            <p className="brand-subtext mt-1.5 max-w-[300px]">
              Turn on 2FA for an extra layer of security on your account.
            </p>
          </>
        ) : step === "qr" ? (
          <>
            <h1 className="brand-heading">
              Scan QR code
            </h1>
            <p className="brand-subtext mt-1.5 max-w-[300px]">
              {qrMessage ??
                "Open your authenticator app and scan this code to add your account."}
            </p>
          </>
        ) : (
          <>
            <h1 className="brand-heading">
              Enter authenticator code
            </h1>
            <p className="brand-subtext mt-1.5 max-w-[300px]">
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
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand-border bg-brand-soft/80 p-4 transition-colors hover:border-brand-primary/30 hover:bg-brand-soft">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={generating}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-brand-primary bg-white accent-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/25 disabled:opacity-50"
            />
            <span className="text-left text-sm leading-snug text-brand-body">
              I want to enable two-factor authentication (2FA) on my account.
            </span>
          </label>

          {consentError && (
            <p className="text-center text-sm text-brand-error" role="alert">
              {consentError}
            </p>
          )}

          <button
            type="submit"
            disabled={!enabled || generating}
            aria-busy={generating}
            className="brand-btn-primary"
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
            <div className="flex justify-center rounded-xl border border-brand-border bg-white p-4">
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
              className="brand-btn-secondary sm:w-auto sm:min-w-[140px]"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep("otp")}
              className="brand-btn-primary sm:w-auto sm:min-w-[140px]"
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
