"use client";

import { LoginPageShell } from "@/app/components/auth/LoginPageShell";
import SetPasswordForm from "@/app/components/auth/SetPasswordForm";
import { OnboardingPageLoading } from "@/app/components/brand/OnboardingPageLoading";
import { GuestOnlyRoute } from "@/app/components/ProtectedRoute";
import { useCredentialContext } from "@/app/contexts/credential-context";
import { markAuthSession } from "@/app/lib/auth-session";
import {
  resolveInviteAuthHrefs,
  resolvePostAuthDestination,
} from "@/app/lib/invite-auth-links";
import { setSetupUser } from "@/app/lib/setup-user";
import {
  completePasswordSetup,
  startPasswordSetup,
} from "@/app/services/auth/password-setup";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo, useState } from "react";

function SetPasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { rememberCredentials } = useCredentialContext();
  const [submitting, setSubmitting] = useState(false);

  const rawToken = searchParams.get("token")?.trim() ?? "";
  const inviteTokenParam = searchParams.get("inviteToken");
  const { inviteToken, loginHref, signupHref } = useMemo(
    () =>
      resolveInviteAuthHrefs({
        inviteToken: inviteTokenParam,
      }),
    [inviteTokenParam],
  );

  const onStart = useCallback(async (token: string) => {
    return startPasswordSetup(token);
  }, []);

  const onComplete = useCallback(
    async (token: string, password: string) => {
      setSubmitting(true);
      try {
        const { user } = await completePasswordSetup(token, password);
        markAuthSession();
        setSetupUser(user);
        rememberCredentials(user.email, password);

        const destination = await resolvePostAuthDestination(inviteToken);
        router.push(destination);
      } finally {
        setSubmitting(false);
      }
    },
    [inviteToken, rememberCredentials, router],
  );

  return (
    <LoginPageShell loginHref={loginHref} signupHref={signupHref}>
      {!rawToken ? (
        <div className="auth-signup-step flex flex-1 flex-col justify-center gap-3 p-2">
          <h2 className="brand-landing-display auth-signup-step-title">
            Missing setup link
          </h2>
          <p className="auth-signup-step-sub">
            Open the link from your email, or ask your admin to resend it.
          </p>
          <a
            href={loginHref}
            className="brand-btn-primary auth-signup-cta inline-flex w-full items-center justify-center"
          >
            Back to login
          </a>
        </div>
      ) : (
        <SetPasswordForm
          token={rawToken}
          submitting={submitting}
          onStart={onStart}
          onComplete={onComplete}
        />
      )}
    </LoginPageShell>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<OnboardingPageLoading />}>
      <GuestOnlyRoute>
        <SetPasswordPageInner />
      </GuestOnlyRoute>
    </Suspense>
  );
}
