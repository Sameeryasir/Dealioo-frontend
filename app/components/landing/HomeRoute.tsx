"use client";

import { OwnerLandingPage } from "@/app/components/landing/OwnerLandingPage";
import { useAuth } from "@/app/contexts/auth-context";
import { hasAuthSession } from "@/app/lib/auth-session";
import { fetchAuthenticatedOnboardingDestination } from "@/app/lib/onboarding-redirect";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function HomeRouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-soft">
      <p className="text-sm text-brand-muted">Loading…</p>
    </div>
  );
}

export function HomeRoute() {
  const router = useRouter();
  const { isAuthenticated, isAuthReady } = useAuth();
  const [redirecting, setRedirecting] = useState(() => hasAuthSession());

  useEffect(() => {
    if (!isAuthReady) return;

    if (!isAuthenticated) {
      setRedirecting(false);
      return;
    }

    let cancelled = false;
    setRedirecting(true);

    void (async () => {
      try {
        const destination = await fetchAuthenticatedOnboardingDestination();
        if (!cancelled) router.replace(destination);
      } catch {
        if (!cancelled) router.replace("/dashboard");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isAuthReady, router]);

  if (isAuthenticated || redirecting) {
    return <HomeRouteFallback />;
  }

  return <OwnerLandingPage />;
}
