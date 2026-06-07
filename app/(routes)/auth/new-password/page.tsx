"use client";

import SetupPasswordForm from "@/app/components/SetupPasswordForm";
import { useCredentialContext } from "@/app/contexts/credential-context";
import { resolvePostLoginPath } from "@/app/lib/onboarding-redirect";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import { setupPassword } from "@/app/services/auth/setup-password";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function NewPasswordPage() {
  const router = useRouter();
  const { password, clearPassword } = useCredentialContext();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(false);
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    setAccessToken(getSetupAccessToken());
    setTokenReady(true);
  }, []);

  useEffect(() => {
    if (!tokenReady) return;
    if (!password || !accessToken) {
      router.replace("/auth/2fa");
    }
  }, [tokenReady, password, accessToken, router]);

  const onSavePasswords = useCallback(
    async (currentPassword: string, newPassword: string) => {
      setErrorMessage(null);
      setSubmitting(true);
      try {
        await setupPassword(accessToken, currentPassword, newPassword);
        clearPassword();
        const status = await getOnboardingStatus();
        router.push(resolvePostLoginPath(status));
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not update password. Try again.";
        setErrorMessage(message);
      } finally {
        setSubmitting(false);
      }
    },
    [router, accessToken, clearPassword],
  );

  if (!tokenReady || !password || !accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

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
        <SetupPasswordForm
          currentPasswordFromLogin={password}
          submitting={submitting}
          errorMessage={errorMessage}
          onSavePasswords={onSavePasswords}
        />
      </main>
    </div>
  );
}
