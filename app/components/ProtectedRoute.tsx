"use client";

import { OnboardingPageLoading } from "@/app/components/brand/OnboardingPageLoading";
import { useAuth } from "@/app/contexts/auth-context";
import {
  inviteTokenFromReturnTo,
  resolvePostAuthDestination,
} from "@/app/lib/invite-auth-links";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

function SessionVerifyError({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#f1f5f9] px-4 text-center">
      <div className="max-w-md rounded-2xl border border-[#e2e8f0] bg-white px-6 py-8 shadow-sm">
        <h1 className="m-0 text-lg font-extrabold text-[#0e182b]">
          Couldn’t verify your session
        </h1>
        <p className="m-0 mt-2 text-sm font-medium text-slate-500">
          {message?.trim() ||
            "The server could not be reached. Check your connection and try again."}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex min-w-32 cursor-pointer items-center justify-center rounded-xl bg-[#1777f2] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1569e0]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status, errorMessage, revalidateAuthSession } = useAuth();

  useEffect(() => {
    if (status !== "unauthenticated") return;
    window.location.assign("/auth/login");
  }, [status]);

  if (status === "loading") {
    return <OnboardingPageLoading />;
  }

  if (status === "error") {
    return (
      <SessionVerifyError
        message={errorMessage}
        onRetry={() => {
          void revalidateAuthSession();
        }}
      />
    );
  }

  if (status !== "authenticated") {
    return <OnboardingPageLoading />;
  }

  return <>{children}</>;
}

export function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, revalidateAuthSession } = useAuth();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (status === "loading") {
        if (!cancelled) setAllowed(false);
        return;
      }

      if (status === "error") {
        if (!cancelled) setAllowed(false);
        return;
      }

      if (status === "unauthenticated") {
        if (!cancelled) setAllowed(true);
        return;
      }

      if (!cancelled) setAllowed(false);

      const inviteToken =
        searchParams.get("inviteToken")?.trim() ||
        inviteTokenFromReturnTo(searchParams.get("returnTo"));

      if (inviteToken) {
        if (!cancelled) {
          router.replace(
            `/accept-invitation?token=${encodeURIComponent(inviteToken)}`,
          );
        }
        return;
      }

      try {
        const destination = await resolvePostAuthDestination();
        if (!cancelled) {
          router.replace(destination || "/dashboard");
        }
      } catch {
        if (!cancelled) {
          router.replace("/dashboard");
        }
      }
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams, status]);

  if (status === "loading") {
    return <OnboardingPageLoading />;
  }

  if (status === "error") {
    return (
      <SessionVerifyError
        message="We couldn’t confirm whether you’re already signed in."
        onRetry={() => {
          void revalidateAuthSession();
        }}
      />
    );
  }

  if (!allowed) {
    return <OnboardingPageLoading />;
  }

  return <>{children}</>;
}
