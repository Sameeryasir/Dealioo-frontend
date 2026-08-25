"use client";

import OtpForm from "@/app/components/OtpForm";
import AuthPageShell, { AuthPageLoading } from "@/app/components/brand/AuthPageShell";
import { useCredentialContext } from "@/app/contexts/credential-context";
import { fetchAuthenticatedOnboardingDestination } from "@/app/lib/onboarding-redirect";
import { setAuthTokens } from "@/app/lib/auth-session";
import { setSetupUser } from "@/app/lib/setup-user";
import { sendOtp } from "@/app/services/auth/send-otp";
import { verifyOtp } from "@/app/services/auth/verify-otp";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect } from "react";

function VerifyOtpPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { email } = useCredentialContext();
  const isSignupFlow = searchParams.get("flow") === "signup";
  const legacyReturnTo = searchParams.get("returnTo");

  useEffect(() => {
    if (isSignupFlow) {
      router.replace("/auth/signup");
    }
  }, [isSignupFlow, router]);

  useEffect(() => {
    if (!legacyReturnTo?.trim()) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("returnTo");
    const qs = params.toString();
    router.replace(qs ? `/auth/verify-otp?${qs}` : "/auth/verify-otp");
  }, [legacyReturnTo, router, searchParams]);

  const onVerifyOtp = useCallback(
    async (otp: number) => {
      const { token, refreshToken, user } = await verifyOtp(email, otp);
      setAuthTokens(token, refreshToken);
      setSetupUser(user);

      const destination = await fetchAuthenticatedOnboardingDestination();
      router.push(destination);
    },
    [email, router],
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
    return <AuthPageLoading />;
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
