"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setAuthTokens } from "@/app/lib/auth-session";
import { setSetupUser } from "@/app/lib/setup-user";
import { resolvePostLoginPath } from "@/app/lib/onboarding-redirect";
import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";

/**
 * Receives Google OAuth tokens + user from the URL hash (set by Nest redirect),
 * stores the session, then routes into onboarding/home.
 */
function GoogleAuthCompleteInner() {
  const router = useRouter();
  const [message, setMessage] = useState("Finishing Google sign-in…");

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const hash = window.location.hash.replace(/^#/, "");
      const params = new URLSearchParams(hash);
      const accessToken = params.get("accessToken")?.trim();
      const refreshToken = params.get("refreshToken")?.trim();
      const userB64 = params.get("user")?.trim();

      window.history.replaceState(null, "", window.location.pathname);

      if (!accessToken || !refreshToken) {
        setMessage("Google sign-in failed — missing tokens. Try again.");
        router.replace("/auth/login?error=Google+sign-in+failed.");
        return;
      }

      setAuthTokens(accessToken, refreshToken);

      const user = parseGoogleUser(userB64);
      if (user) {
        setSetupUser(user);
      }

      try {
        const status = await getOnboardingStatus();
        if (!cancelled) {
          router.replace(resolvePostLoginPath(status, null));
        }
      } catch (error) {
        if (cancelled) return;
        const msg =
          error instanceof Error
            ? error.message
            : "Could not finish Google sign-in.";
        setMessage(msg);
        router.replace(`/auth/login?error=${encodeURIComponent(msg)}`);
      }
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-brand-soft">
      <p className="text-sm text-brand-muted">{message}</p>
    </main>
  );
}

function parseGoogleUser(raw: string | undefined): VerifyOtpUser | null {
  if (!raw) return null;
  try {
    const json = atob(raw.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(json) as {
      id: number;
      name: string;
      email: string;
      phone: string | null;
      emailVerified: boolean;
      phoneVerified: boolean;
      isActive: boolean;
      createdAt: string | Date;
      updatedAt: string | Date;
      role: { id: number; name: string };
    };
    if (!parsed?.id || !parsed?.email || !parsed?.role?.name) return null;
    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone ?? "",
      emailVerified: Boolean(parsed.emailVerified),
      phoneVerified: Boolean(parsed.phoneVerified),
      isActive: Boolean(parsed.isActive),
      createdAt:
        typeof parsed.createdAt === "string"
          ? parsed.createdAt
          : new Date(parsed.createdAt).toISOString(),
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date(parsed.updatedAt).toISOString(),
      role: { id: parsed.role.id, name: parsed.role.name },
    };
  } catch {
    return null;
  }
}

export default function GoogleAuthCompletePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-brand-soft">
          <p className="text-sm text-brand-muted">Loading…</p>
        </main>
      }
    >
      <GoogleAuthCompleteInner />
    </Suspense>
  );
}
