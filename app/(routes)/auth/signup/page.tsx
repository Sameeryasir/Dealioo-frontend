"use client";

import SignupForm from "@/app/components/SignupForm";
import { useCredentialContext } from "@/app/contexts/credential-context";
import { registerUser } from "@/app/services/auth/register";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo, useState } from "react";

function buildAuthHref(base: string, returnTo: string | null) {
  if (returnTo != null && returnTo.trim() !== "") {
    return `${base}?returnTo=${encodeURIComponent(returnTo)}`;
  }
  return base;
}

function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCredentials } = useCredentialContext();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const returnTo = searchParams.get("returnTo");
  const loginHref = useMemo(() => buildAuthHref("/auth/login", returnTo), [returnTo]);

  const onSubmit = useCallback(
    async (values: { name: string; email: string; phone: string; password: string }) => {
      setErrorMessage(null);
      setSubmitting(true);
      try {
        await registerUser(values);
        setCredentials(values.email, values.password);

        const nextPath = buildAuthHref("/auth/verify-otp?flow=signup", returnTo);
        router.push(nextPath);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Signup failed. Please try again.";
        setErrorMessage(message);
      } finally {
        setSubmitting(false);
      }
    },
    [router, returnTo, setCredentials],
  );

  return (
    <div className="landing-page flex min-h-screen items-center justify-center bg-[#f8faff] px-4 py-10 sm:px-6">
      <SignupForm
        submitting={submitting}
        errorMessage={errorMessage}
        loginHref={loginHref}
        onSubmit={onSubmit}
      />
    </div>
  );
}

function SignupPageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8faff]">
      <p className="text-sm text-brand-muted">Loading signup…</p>
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
