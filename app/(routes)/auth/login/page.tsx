"use client";

import LoginForm from "@/app/components/LoginForm";
import { useCredentialContext } from "@/app/contexts/credential-context";
import {
  resolvePostLoginPath,
  shouldSkipPasswordSetup,
} from "@/app/lib/onboarding-redirect";
import { setAuthTokens } from "@/app/lib/auth-session";
import { setSetupUser } from "@/app/lib/setup-user";
import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import { login } from "@/app/services/auth/login";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo, useState } from "react";

function buildAuthHref(base: string, returnTo: string | null) {
  if (returnTo != null && returnTo.trim() !== "") {
    return `${base}?returnTo=${encodeURIComponent(returnTo)}`;
  }
  return base;
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { rememberCredentials } = useCredentialContext();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const returnTo = searchParams.get("returnTo");
  const signupHref = useMemo(() => buildAuthHref("/auth/signup", returnTo), [returnTo]);

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

        if (!shouldSkipPasswordSetup(status)) {
          router.push("/auth/new-password");
          return;
        }

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

  return (
    <div className="landing-page flex min-h-screen items-center justify-center bg-[#f8faff] px-4 py-10 sm:px-6">
      <LoginForm
        submitting={submitting}
        errorMessage={errorMessage}
        signupHref={signupHref}
        onCredentialsSubmit={onCredentialsSubmit}
      />
    </div>
  );
}

function LoginPageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8faff]">
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
