"use client";

import SetupPasswordForm from "@/app/components/SetupPasswordForm";
import AuthPageShell, { AuthPageLoading } from "@/app/components/brand/AuthPageShell";
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
    return <AuthPageLoading />;
  }

  return (
    <AuthPageShell>
      <SetupPasswordForm
        currentPasswordFromLogin={password}
        submitting={submitting}
        errorMessage={errorMessage}
        onSavePasswords={onSavePasswords}
      />
    </AuthPageShell>
  );
}
