"use client";

import { OnboardingPageLoading } from "@/app/components/brand/OnboardingPageLoading";
import { OwnerLandingPage } from "@/app/components/landing/OwnerLandingPage";
import { useAuth } from "@/app/contexts/auth-context";
import { hasAuthSession } from "@/app/lib/auth-session";
import { fetchAuthenticatedOnboardingDestination } from "@/app/lib/onboarding-redirect";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type GateMode = "boot" | "landing" | "app";

export function HomeLandingGate() {
  const router = useRouter();
  const { isAuthenticated, isAuthReady } = useAuth();
  const [mode, setMode] = useState<GateMode>("boot");

  useEffect(() => {
    if (hasAuthSession()) {
      setMode("app");
      return;
    }
    setMode("landing");
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    if (isAuthenticated) {
      setMode("app");
      return;
    }

    setMode("landing");
  }, [isAuthenticated, isAuthReady]);

  useEffect(() => {
    if (!isAuthReady || !isAuthenticated) return;

    let cancelled = false;

    void (async () => {
      try {
        const destination = await fetchAuthenticatedOnboardingDestination();
        if (!cancelled) {
          router.replace(destination);
        }
      } catch {
        if (!cancelled) {
          router.replace("/dashboard");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isAuthReady, router]);

  if (mode !== "landing") {
    return <OnboardingPageLoading />;
  }

  return <OwnerLandingPage />;
}
