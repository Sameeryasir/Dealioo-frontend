"use client";

import {
  AUTH_SESSION_CHANGED_EVENT,
  hasAuthSession,
} from "@/app/lib/auth-session";
import { OnboardingPageLoading } from "@/app/components/brand/OnboardingPageLoading";
import { fetchAuthenticatedOnboardingDestination } from "@/app/lib/onboarding-redirect";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

function currentReturnTo(pathname: string): string {
  if (typeof window === "undefined") return pathname;
  return `${pathname}${window.location.search || ""}`;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = () => {
      const authed = hasAuthSession();
      setIsAuthenticated(authed);
      if (!authed) {
        window.location.assign(
          `/auth/login?returnTo=${encodeURIComponent(currentReturnTo(pathname))}`,
        );
      }
    };

    sync();
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [pathname, router]);

  if (isAuthenticated !== true) {
    return <OnboardingPageLoading />;
  }

  return <>{children}</>;
}

export function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (!hasAuthSession()) {
        if (!cancelled) {
          setAllowed(true);
        }
        return;
      }

      if (!cancelled) {
        setAllowed(false);
      }

      const returnTo = searchParams.get("returnTo");
      try {
        const destination = await fetchAuthenticatedOnboardingDestination(
          returnTo,
        );
        if (!cancelled) {
          router.replace(destination);
        }
      } catch {
        if (!cancelled) {
          router.replace("/dashboard");
        }
      }
    }

    void resolve();

    const onSessionChange = () => {
      void resolve();
    };
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, onSessionChange);
    window.addEventListener("storage", onSessionChange);

    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, onSessionChange);
      window.removeEventListener("storage", onSessionChange);
    };
  }, [router, searchParams]);

  if (!allowed) {
    return <OnboardingPageLoading />;
  }

  return <>{children}</>;
}
