"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { hasAuthSession, setAuthTokens } from "@/app/lib/auth-session";
import { setSetupUser } from "@/app/lib/setup-user";
import {
  acceptBusinessInvitation,
  validateBusinessInvitation,
} from "@/app/services/invitation/business-invitations";

function AcceptInvitationInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(
    () => searchParams.get("token")?.trim() ?? "",
    [searchParams],
  );

  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Checking invitation…");

  useEffect(() => {
    if (!token) {
      setError("This invitation link is invalid or missing a token.");
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const result = await validateBusinessInvitation(token);
        if (cancelled) return;

        if (!result.valid) {
          setError("This invitation is no longer valid.");
          return;
        }

        if (!result.accountExists) {
          router.replace(
            `/auth/signup?inviteToken=${encodeURIComponent(token)}`,
          );
          return;
        }

        if (!hasAuthSession()) {
          const returnTo = encodeURIComponent(
            `/accept-invitation?token=${token}`,
          );
          router.replace(`/auth/login?returnTo=${returnTo}`);
          return;
        }

        setStatusMessage("Accepting your invitation…");
        const accepted = await acceptBusinessInvitation(token);
        if (cancelled) return;
        setAuthTokens(accepted.token, accepted.refreshToken);
        setSetupUser(accepted.user);
        router.replace("/dashboard");
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "This invitation link is invalid or expired.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, token]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-4 py-10">
        <div className="w-full max-w-md rounded-[1.25rem] border border-[#e8edf5] bg-white p-6 text-center shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <AlertCircle className="mx-auto size-10 text-red-500" aria-hidden />
          <h1 className="mt-4 text-lg font-bold text-[#07111f]">
            Invitation unavailable
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{error}</p>
          <Link
            href="/auth/login"
            className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#1877f2] px-4 text-sm font-semibold text-white no-underline transition hover:bg-[#0d5bb8]"
          >
            Go to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-4 py-10">
      <div className="w-full max-w-md rounded-[1.25rem] border border-[#e8edf5] bg-white p-6 text-center shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
        <Loader2
          className="mx-auto size-10 animate-spin text-[#1877f2]"
          aria-hidden
        />
        <h1 className="mt-4 text-lg font-bold text-[#07111f]">
          {statusMessage}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Please wait while we verify your invite…
        </p>
      </div>
    </main>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
          <Loader2 className="size-8 animate-spin text-[#1877f2]" aria-hidden />
        </main>
      }
    >
      <AcceptInvitationInner />
    </Suspense>
  );
}
