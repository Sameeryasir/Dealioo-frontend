"use client";

import { SignupPageShell } from "@/app/components/auth/SignupPageShell";
import SignupForm from "@/app/components/SignupForm";
import { useCredentialContext } from "@/app/contexts/credential-context";
import {
  resolvePostLoginPath,
} from "@/app/lib/onboarding-redirect";
import { saveSelectedSignupPlan } from "@/app/lib/selected-plan-storage";
import { clearSignupProgress } from "@/app/lib/signup-progress-storage";
import type { BillingCycle } from "@/app/components/landing/pricing-plans";
import { setAuthTokens } from "@/app/lib/auth-session";
import { setSetupUser } from "@/app/lib/setup-user";
import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import { registerUser } from "@/app/services/auth/register";
import { sendOtp } from "@/app/services/auth/send-otp";
import { verifyOtp } from "@/app/services/auth/verify-otp";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

function buildAuthHref(base: string, returnTo: string | null) {
  if (returnTo != null && returnTo.trim() !== "") {
    return `${base}?returnTo=${encodeURIComponent(returnTo)}`;
  }
  return base;
}

function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { email, setCredentials } = useCredentialContext();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const returnTo = searchParams.get("returnTo");
  const oauthError = searchParams.get("error");
  const loginHref = useMemo(() => buildAuthHref("/auth/login", returnTo), [returnTo]);
  const signupHref = useMemo(() => buildAuthHref("/auth/signup", returnTo), [returnTo]);

  useEffect(() => {
    if (oauthError?.trim()) {
      setErrorMessage(oauthError.trim());
    }
  }, [oauthError]);

  const onRegister = useCallback(
    async (values: {
      name: string;
      email: string;
      phone: string;
      password: string;
    }) => {
      setErrorMessage(null);
      setSubmitting(true);
      try {
        await registerUser(values);
        setCredentials(values.email, values.password);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Signup failed. Please try again.";
        setErrorMessage(message);
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [setCredentials],
  );

  const onVerifyOtp = useCallback(
    async (otp: number) => {
      if (!email) {
        throw new Error("Missing email. Go back and try again.");
      }

      setErrorMessage(null);
      setSubmitting(true);
      try {
        const { token, refreshToken, user } = await verifyOtp(email, otp);
        setAuthTokens(token, refreshToken);
        setSetupUser(user);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not verify code. Try again.";
        setErrorMessage(message);
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [email],
  );

  const onFinishSignup = useCallback(
    async (selection: { planId: string; billing: BillingCycle }) => {
      setErrorMessage(null);
      setSubmitting(true);
      try {
        saveSelectedSignupPlan(selection);
        clearSignupProgress();

        const status = await getOnboardingStatus();

        router.push(resolvePostLoginPath(status, returnTo));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not finish signup. Try again.";
        setErrorMessage(message);
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [returnTo, router],
  );

  const onResendOtp = useCallback(async () => {
    if (!email) {
      throw new Error("Missing email. Go back and try again.");
    }

    await sendOtp(email);
  }, [email]);

  return (
    <SignupPageShell loginHref={loginHref} signupHref={signupHref}>
      <SignupForm
        submitting={submitting}
        errorMessage={errorMessage}
        loginHref={loginHref}
        onRegister={onRegister}
        onVerifyOtp={onVerifyOtp}
        onResendOtp={onResendOtp}
        onFinishSignup={onFinishSignup}
      />
    </SignupPageShell>
  );
}

function SignupPageLoading() {
  return (
    <div className="landing-page flex min-h-screen items-center justify-center bg-white">
      <p className="text-sm text-brand-muted">Loading…</p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupPageLoading />}>
      <SignupPageInner />
    </Suspense>
  );
}
