"use client";

import OtpForm from "@/app/components/OtpForm";
import { useCredentialContext } from "@/app/contexts/credential-context";
import {
  resolvePostLoginPath,
  shouldSkipPasswordSetup,
} from "@/app/lib/onboarding-redirect";
import { setAuthTokens } from "@/app/lib/auth-session";
import { setSetupUser } from "@/app/lib/setup-user";
import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import { verifyOtp } from "@/app/services/auth/verify-otp";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";

function VerifyOtpPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { email } = useCredentialContext();
  const returnTo = searchParams.get("returnTo");

  const onVerifyOtp = useCallback(
    async (otp: number) => {
      const { token, refreshToken, user } = await verifyOtp(email, otp);
      setAuthTokens(token, refreshToken);
      setSetupUser(user);

      const status = await getOnboardingStatus();

      if (!shouldSkipPasswordSetup(status)) {
        router.push("/auth/new-password");
        return;
      }

      router.push(resolvePostLoginPath(status, returnTo));
    },
    [email, returnTo, router],
  );

  const onResendOtp = useCallback(async () => {
    if (!email) {
      throw new Error("Missing email. Go back to log in and try again.");
    }
  }, [email]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-100 via-white to-zinc-50 px-4 py-12 sm:px-6">
      <div
        className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-violet-200/35 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-px w-[min(100vw,48rem)] -translate-x-1/2 bg-gradient-to-r from-transparent via-zinc-200/80 to-transparent"
        aria-hidden
      />

      <main className="relative z-10 flex w-full max-w-lg flex-col items-center">
        <OtpForm
          email={email}
          onVerifyOtp={onVerifyOtp}
          onResendOtp={onResendOtp}
        />
      </main>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50">
          <p className="text-sm text-zinc-500">Loading…</p>
        </div>
      }
    >
      <VerifyOtpPageInner />
    </Suspense>
  );
}
