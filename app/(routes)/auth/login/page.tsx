"use client";

import { LoginPageShell } from "@/app/components/auth/LoginPageShell";
import LoginForm from "@/app/components/LoginForm";
import { useCredentialContext } from "@/app/contexts/credential-context";
import {
  resolvePostLoginPath,
} from "@/app/lib/onboarding-redirect";
import { setAuthTokens } from "@/app/lib/auth-session";
import { setSetupUser } from "@/app/lib/setup-user";
import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import { login } from "@/app/services/auth/login";
import { sendOtp } from "@/app/services/auth/send-otp";
import { verifyOtp } from "@/app/services/auth/verify-otp";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

function buildAuthHref(base: string, returnTo: string | null) {
  if (returnTo != null && returnTo.trim() !== "") {
    return `${base}?returnTo=${encodeURIComponent(returnTo)}`;
  }
  return base;
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { rememberCredentials, setCredentials } = useCredentialContext();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recoveryEmailRef = useRef("");

  const returnTo = searchParams.get("returnTo");
  const oauthError = searchParams.get("error");
  const loginHref = useMemo(() => buildAuthHref("/auth/login", returnTo), [returnTo]);
  const signupHref = useMemo(() => buildAuthHref("/auth/signup", returnTo), [returnTo]);

  useEffect(() => {
    if (oauthError?.trim()) {
      setErrorMessage(oauthError.trim());
    }
  }, [oauthError]);

  const onCredentialsSubmit = useCallback(
    async (email: string, password: string) => {
      setErrorMessage(null);
      setSubmitting(true);
      try {
        const { token, refreshToken, user } = await login(email, password);
        setAuthTokens(token, refreshToken);
        setSetupUser(user);
        rememberCredentials(email, password);

        const status = await getOnboardingStatus();

        router.push(resolvePostLoginPath(status, returnTo));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Login failed. Please try again.";
        setErrorMessage(message);
      } finally {
        setSubmitting(false);
      }
    },
    [rememberCredentials, returnTo, router],
  );

  const onForgotPassword = useCallback(
    async (email: string) => {
      setErrorMessage(null);
      recoveryEmailRef.current = email.trim();
      setCredentials(email.trim(), "");
      await sendOtp(email.trim());
    },
    [setCredentials],
  );

  const onVerifyOtp = useCallback(
    async (otp: number) => {
      const email = recoveryEmailRef.current;
      if (!email) {
        throw new Error("Missing email. Go back and try again.");
      }

      setErrorMessage(null);
      setSubmitting(true);
      try {
        const { token, refreshToken, user } = await verifyOtp(email, otp);
        setAuthTokens(token, refreshToken);
        setSetupUser(user);
        rememberCredentials(email, "");

        const status = await getOnboardingStatus();

        router.push(resolvePostLoginPath(status, returnTo));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not verify code. Try again.";
        throw new Error(message);
      } finally {
        setSubmitting(false);
      }
    },
    [rememberCredentials, returnTo, router],
  );

  const onResendOtp = useCallback(async () => {
    const email = recoveryEmailRef.current;
    if (!email) {
      throw new Error("Missing email. Go back and try again.");
    }

    await sendOtp(email);
  }, []);

  return (
    <LoginPageShell loginHref={loginHref} signupHref={signupHref}>
      <LoginForm
        submitting={submitting}
        errorMessage={errorMessage}
        signupHref={signupHref}
        onCredentialsSubmit={onCredentialsSubmit}
        onForgotPassword={onForgotPassword}
        onVerifyOtp={onVerifyOtp}
        onResendOtp={onResendOtp}
      />
    </LoginPageShell>
  );
}

function LoginPageLoading() {
  return (
    <div className="landing-page auth-signup-page flex min-h-screen items-center justify-center bg-white">
      <p className="text-sm text-brand-muted">Loading login…</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageLoading />}>
      <LoginPageInner />
    </Suspense>
  );
}
