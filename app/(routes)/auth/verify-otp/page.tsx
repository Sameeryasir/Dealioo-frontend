"use client";

import OtpForm from "@/app/components/OtpForm";
import AuthPageShell, { AuthPageLoading } from "@/app/components/brand/AuthPageShell";
import { useCredentialContext } from "@/app/contexts/credential-context";
import {
  resolvePostLoginPath,
  shouldSkipPasswordSetup,
} from "@/app/lib/onboarding-redirect";
import { setAuthTokens } from "@/app/lib/auth-session";
import { setSetupUser } from "@/app/lib/setup-user";
import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import { sendOtp } from "@/app/services/auth/send-otp";
import { verifyOtp } from "@/app/services/auth/verify-otp";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect } from "react";

function VerifyOtpPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { email } = useCredentialContext();
  const returnTo = searchParams.get("returnTo");
  const isSignupFlow = searchParams.get("flow") === "signup";

  useEffect(() => {
    if (isSignupFlow) {
      router.replace(
        returnTo
          ? `/auth/signup?returnTo=${encodeURIComponent(returnTo)}`
          : "/auth/signup",
      );
    }
  }, [isSignupFlow, returnTo, router]);

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
      throw new Error(
        isSignupFlow
          ? "Missing email. Go back to sign up and try again."
          : "Missing email. Go back and try again.",
      );
    }

    await sendOtp(email);
  }, [email, isSignupFlow]);

  if (isSignupFlow) {
    return (
      <AuthPageShell>
        <p className="text-center text-sm text-brand-muted">Returning to sign up…</p>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell>
      <OtpForm
        email={email}
        onVerifyOtp={onVerifyOtp}
        onResendOtp={onResendOtp}
        onBack={() => router.push("/auth/login")}
      />
    </AuthPageShell>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<AuthPageLoading />}>
      <VerifyOtpPageInner />
    </Suspense>
  );
}
