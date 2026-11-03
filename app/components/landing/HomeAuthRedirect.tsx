"use client";

import { useAuth } from "@/app/contexts/auth-context";
import { fetchAuthenticatedOnboardingDestination } from "@/app/lib/onboarding-redirect";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function HomeAuthRedirect() {
  const router = useRouter();
  const { isAuthenticated, isAuthReady } = useAuth();

  useEffect(() => {
    if (!isAuthReady || !isAuthenticated) {
      return;
    }

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

  return null;
}
