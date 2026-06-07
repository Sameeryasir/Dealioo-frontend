"use client";

import EnableTwoFactorForm from "@/app/components/EnableTwoFactorForm";
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
          <EnableTwoFactorForm onContinue={() => void onContinue()} />
        </main>
      </div>
    </OnboardingRouteGuard>
  );
}
