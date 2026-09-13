"use client";

import { LoginPageShell } from "@/app/components/auth/LoginPageShell";
import LoginForm from "@/app/components/LoginForm";
import { OnboardingPageLoading } from "@/app/components/brand/OnboardingPageLoading";
import { GuestOnlyRoute } from "@/app/components/ProtectedRoute";
import { useCredentialContext } from "@/app/contexts/credential-context";
import { isEmailNotVerifiedError } from "@/app/lib/auth-api-error";
import { normalizeAuthEmail } from "@/app/lib/auth-password";
import { setAuthTokens } from "@/app/lib/auth-session";
import {
  resolveInviteAuthHrefs,
  resolvePostAuthDestination,
} from "@/app/lib/invite-auth-links";
import { setSetupUser } from "@/app/lib/setup-user";
import {
  readSignupProgress,
  saveSignupProgress,
} from "@/app/lib/signup-progress-storage";
import { login } from "@/app/services/auth/login";
import { resetPassword } from "@/app/services/auth/reset-password";
import { sendOtp } from "@/app/services/auth/send-otp";
import { validateOtp } from "@/app/services/auth/validate-otp";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { rememberCredentials, setCredentials } = useCredentialContext();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recoveryEmailRef = useRef("");

  const oauthError = searchParams.get("error");
  const inviteTokenParam = searchParams.get("inviteToken");
  const legacyReturnTo = searchParams.get("returnTo");
  const inviteNotice = searchParams.get("inviteNotice");
  const { inviteToken, loginHref, signupHref } = useMemo(
    () =>
      resolveInviteAuthHrefs({
        inviteToken: inviteTokenParam,
        returnTo: legacyReturnTo,
      }),
    [inviteTokenParam, legacyReturnTo],
  );

  useEffect(() => {
    if (!legacyReturnTo?.trim()) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("returnTo");
    const qs = params.toString();
    router.replace(qs ? `/auth/login?${qs}` : "/auth/login");
  }, [legacyReturnTo, router, searchParams]);

  useEffect(() => {
    if (oauthError?.trim()) {
      setErrorMessage(oauthError.trim());
    } else if (inviteNotice === "account-exists") {
      setErrorMessage(
        "You already have an account for this invitation. Sign in below to join the team.",
      );
    }
  }, [oauthError, inviteNotice]);

  const onCredentialsSubmit = useCallback(
    async (email: string, password: string) => {
      setErrorMessage(null);
      setSubmitting(true);
      const normalizedEmail = normalizeAuthEmail(email);
      try {
        const { token, refreshToken, user } = await login(
          normalizedEmail,
          password,
        );
        setAuthTokens(token, refreshToken);
        setSetupUser(user);
        rememberCredentials(normalizedEmail, password);

        const destination = await resolvePostAuthDestination(inviteToken);
        router.push(destination);
      } catch (error) {
        if (isEmailNotVerifiedError(error)) {
          const previous = readSignupProgress();
          saveSignupProgress({
            step: 2,
            name: previous?.name ?? "",
            email: normalizedEmail,
            phone: previous?.phone ?? "",
            password,
            accountCreated: true,
            emailVerified: false,
            selectedPlanId: previous?.selectedPlanId ?? "starter",
            billing: previous?.billing ?? "annual",
          });
          setCredentials(normalizedEmail, password);
          router.push(signupHref);
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Login failed. Please try again.";
        setErrorMessage(message);
      } finally {
        setSubmitting(false);
      }
    },
    [inviteToken, rememberCredentials, router, setCredentials, signupHref],
  );

  const onForgotPassword = useCallback(
    async (email: string) => {
      setErrorMessage(null);
      const normalizedEmail = normalizeAuthEmail(email);
      recoveryEmailRef.current = normalizedEmail;
      setCredentials(normalizedEmail, "");
      await sendOtp(normalizedEmail);
    },
    [setCredentials],
  );

  const onVerifyRecoveryOtp = useCallback(async (email: string, otp: number) => {
    setErrorMessage(null);
    await validateOtp(normalizeAuthEmail(email), otp);
  }, []);

  const onResetPassword = useCallback(
    async (email: string, otp: number, password: string) => {
      setErrorMessage(null);
      setSubmitting(true);
      const normalizedEmail = normalizeAuthEmail(email);
      try {
        const { token, refreshToken, user } = await resetPassword(
          normalizedEmail,
          otp,
          password,
        );
        setAuthTokens(token, refreshToken);
        setSetupUser(user);
        rememberCredentials(normalizedEmail, password);

        const destination = await resolvePostAuthDestination(inviteToken);
        router.push(destination);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not reset password.";
        setErrorMessage(message);
        throw new Error(message);
      } finally {
        setSubmitting(false);
      }
    },
    [inviteToken, rememberCredentials, router],
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
        onVerifyRecoveryOtp={onVerifyRecoveryOtp}
        onResetPassword={onResetPassword}
        onResendOtp={onResendOtp}
      />
    </LoginPageShell>
  );
}

function LoginPageLoading() {
  return <OnboardingPageLoading />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageLoading />}>
      <GuestOnlyRoute>
        <LoginPageInner />
      </GuestOnlyRoute>
    </Suspense>
  );
}
