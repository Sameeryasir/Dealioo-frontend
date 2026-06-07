"use client";

import LoginForm from "@/app/components/LoginForm";
import { useCredentialContext } from "@/app/contexts/credential-context";
import { login } from "@/app/services/auth/login";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCredentials } = useCredentialContext();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onCredentialsSubmit = useCallback(
    async (email: string, password: string) => {
      setErrorMessage(null);
      setSubmitting(true);
      try {
        await login(email, password);
        setCredentials(email, password);
        const returnTo = searchParams.get("returnTo");
        const nextPath =
          returnTo != null && returnTo.trim() !== ""
            ? `/auth/verify-otp?returnTo=${encodeURIComponent(returnTo)}`
            : "/auth/verify-otp";
        router.push(nextPath);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Login failed. Please try again.";
        setErrorMessage(message);
      } finally {
        setSubmitting(false);
      }
    },
    [router, searchParams, setCredentials],
  );

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
        <LoginForm
          submitting={submitting}
          errorMessage={errorMessage}
          onCredentialsSubmit={onCredentialsSubmit}
        />
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50">
          <p className="text-sm text-zinc-500">Loading…</p>
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
