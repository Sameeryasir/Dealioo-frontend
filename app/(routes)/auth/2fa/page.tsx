"use client";

import EnableTwoFactorForm from "@/app/components/EnableTwoFactorForm";
import AuthPageShell from "@/app/components/brand/AuthPageShell";
import { OnboardingRouteGuard } from "@/app/components/OnboardingRouteGuard";
import { resolvePostLoginPath } from "@/app/lib/onboarding-redirect";
import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export default function TwoFactorAuthPage() {
  const router = useRouter();

  const onContinue = useCallback(async () => {
    const status = await getOnboardingStatus();
    router.push(resolvePostLoginPath(status));
  }, [router]);

  return (
    <OnboardingRouteGuard step="two_factor">
      <AuthPageShell>
        <EnableTwoFactorForm onContinue={() => void onContinue()} />
      </AuthPageShell>
    </OnboardingRouteGuard>
  );
}
