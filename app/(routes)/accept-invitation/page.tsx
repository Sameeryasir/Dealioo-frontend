"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { hasAuthSession, markAuthSession } from "@/app/lib/auth-session";
import { inviteLoginHref, inviteSignupHref } from "@/app/lib/invite-auth-links";
import { getSetupUser, setSetupUser } from "@/app/lib/setup-user";
import { logoutSession } from "@/app/services/auth/logout";
import {
  acceptBusinessInvitation,
  validateBusinessInvitation,
} from "@/app/services/invitation/business-invitations";

type InviteAccountChoice = {
  signedInEmail: string;
  inviteEmail: string;
  businessName: string;
  accountExists: boolean;
};

function sameEmail(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function isWrongAccountError(message: string): boolean {
  return message.toLowerCase().includes("email address this invitation was sent to");
}

function AcceptInvitationInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(
    () => searchParams.get("token")?.trim() ?? "",
    [searchParams],
  );

  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Checking invitation…");
  const [accountChoice, setAccountChoice] = useState<InviteAccountChoice | null>(
    null,
  );
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    void (async () => {
      try {
        const result = await validateBusinessInvitation(token);
        if (cancelled) return;

        if (!result.valid) {
          setError("This invitation is no longer valid.");
          return;
        }

        if (!hasAuthSession()) {
          router.replace(
            result.accountExists
              ? inviteLoginHref(token)
              : inviteSignupHref(token),
          );
          return;
        }

        const signedInEmail = getSetupUser()?.email?.trim() ?? "";
        const inviteEmail = result.email.trim();
        if (signedInEmail && inviteEmail && !sameEmail(signedInEmail, inviteEmail)) {
          setAccountChoice({
            signedInEmail,
            inviteEmail,
            businessName: result.businessName,
            accountExists: result.accountExists,
          });
          return;
        }

        setStatusMessage("Accepting your invitation…");
        const accepted = await acceptBusinessInvitation(token);
        if (cancelled) return;
        markAuthSession();
        setSetupUser(accepted.user);
        router.replace("/dashboard");
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : "This invitation link is invalid or expired.";
        if (hasAuthSession() && isWrongAccountError(message)) {
          setAccountChoice({
            signedInEmail: getSetupUser()?.email?.trim() ?? "",
            inviteEmail: "",
            businessName: "",
            accountExists: true,
          });
          return;
        }
        setError(message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, token]);

  async function switchToInvitedAccount() {
    if (!token || switching) return;
    setSwitching(true);
    try {
      await logoutSession();
      const nextHref = accountChoice?.accountExists
        ? inviteLoginHref(token)
        : inviteSignupHref(token);
      router.replace(nextHref);
    } catch {
      setSwitching(false);
      setError("Could not sign out. Try again, then open the invitation.");
    }
  }

  if (accountChoice) {
    const signedInLabel = accountChoice.signedInEmail || "another account";
    const inviteLabel = accountChoice.inviteEmail || "the invited email";
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-4 py-10">
        <div className="w-full max-w-md rounded-[1.25rem] border border-[#e8edf5] bg-white p-6 text-center shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <h1 className="text-lg font-bold text-[#07111f]">
            This invite is for a different account
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            You are signed in as <span className="font-semibold">{signedInLabel}</span>.
            This invitation
            {accountChoice.businessName
              ? ` to ${accountChoice.businessName}`
              : ""}{" "}
            is for <span className="font-semibold">{inviteLabel}</span>.
          </p>
          <button
            type="button"
            disabled={switching}
            onClick={() => {
              void switchToInvitedAccount();
            }}
            className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#1877f2] px-4 text-sm font-semibold text-white transition hover:bg-[#0d5bb8] disabled:opacity-60"
          >
            {switching ? "Signing out…" : "Switch account"}
          </button>
          <button
            type="button"
            disabled={switching}
            onClick={() => router.replace("/dashboard")}
            className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl border border-[#e8edf5] bg-white px-4 text-sm font-semibold text-[#07111f] transition hover:bg-[#f8faff] disabled:opacity-60"
          >
            Stay on this account
          </button>
        </div>
      </main>
    );
  }

  const visibleError = !token
    ? "This invitation link is invalid or missing a token."
    : error;

  if (visibleError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-4 py-10">
        <div className="w-full max-w-md rounded-[1.25rem] border border-[#e8edf5] bg-white p-6 text-center shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <AlertCircle className="mx-auto size-10 text-red-500" aria-hidden />
          <h1 className="mt-4 text-lg font-bold text-[#07111f]">
            Invitation unavailable
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{visibleError}</p>
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
