"use client";

import { OwnerLandingPage } from "@/app/components/landing/OwnerLandingPage";
import { useAuth } from "@/app/contexts/auth-context";
import { resolvePostLoginPath } from "@/app/lib/onboarding-redirect";
import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
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
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!isAuthReady || !isAuthenticated) return;

    let cancelled = false;
    setRedirecting(true);

    void (async () => {
      try {
        const status = await getOnboardingStatus();
        if (cancelled) return;
        router.replace(resolvePostLoginPath(status));
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

  if (!isAuthReady || redirecting || isAuthenticated) {
    return <HomeRouteFallback />;
  }

  return <OwnerLandingPage />;
}
