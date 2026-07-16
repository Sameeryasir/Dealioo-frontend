"use client";

import { SignupPageShell } from "@/app/components/auth/SignupPageShell";
import SignupForm from "@/app/components/SignupForm";
import { GuestOnlyRoute } from "@/app/components/ProtectedRoute";
import { useCredentialContext } from "@/app/contexts/credential-context";
import { setAuthTokens } from "@/app/lib/auth-session";
import { setSetupUser } from "@/app/lib/setup-user";
import { registerUser } from "@/app/services/auth/register";
import { sendOtp } from "@/app/services/auth/send-otp";
import { verifyOtp } from "@/app/services/auth/verify-otp";
import {
  registerWithInvitation,
  validateBusinessInvitation,
} from "@/app/services/invitation/business-invitations";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

function buildAuthHref(base: string, returnTo: string | null) {
  if (returnTo != null && returnTo.trim() !== "") {
    return `${base}?returnTo=${encodeURIComponent(returnTo)}`;
  }
  return base;
}

function SignupPageInner() {
  const searchParams = useSearchParams();
  const { email, setCredentials } = useCredentialContext();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inviteReady, setInviteReady] = useState(false);
  const [invitation, setInvitation] = useState<{
    token: string;
    email: string;
    businessName: string;
    role: string;
  } | null>(null);

  const returnTo = searchParams.get("returnTo");
  const oauthError = searchParams.get("error");
  const inviteToken = searchParams.get("inviteToken")?.trim() || "";
  const loginHref = useMemo(() => {
    if (inviteToken) {
      return `/auth/login?returnTo=${encodeURIComponent(`/accept-invitation?token=${inviteToken}`)}`;
    }
    return buildAuthHref("/auth/login", returnTo);
  }, [inviteToken, returnTo]);
  const signupHref = useMemo(() => {
    if (inviteToken) {
      return `/auth/signup?inviteToken=${encodeURIComponent(inviteToken)}`;
    }
    return buildAuthHref("/auth/signup", returnTo);
  }, [inviteToken, returnTo]);

  useEffect(() => {
    if (oauthError?.trim()) {
      setErrorMessage(oauthError.trim());
    }
  }, [oauthError]);

  useEffect(() => {
    if (!inviteToken) {
      setInvitation(null);
      setInviteReady(true);
      return;
    }

    let cancelled = false;
    setInviteReady(false);

    void (async () => {
      try {
        const result = await validateBusinessInvitation(inviteToken);
        if (cancelled) return;

        if (!result.valid || result.accountExists) {
          setErrorMessage(
            result.accountExists
              ? "An account already exists for this invitation. Please sign in."
              : "This invitation is no longer valid.",
          );
          setInvitation(null);
          setInviteReady(true);
          return;
        }

        setInvitation({
          token: inviteToken,
          email: result.email,
          businessName: result.businessName,
          role: result.role,
        });
        setInviteReady(true);
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "This invitation link is invalid or expired.",
        );
        setInvitation(null);
        setInviteReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [inviteToken]);

  const onRegister = useCallback(
    async (values: {
      name: string;
      email: string;
      phone: string;
      password: string;
    }) => {
      setErrorMessage(null);
      setSubmitting(true);
      try {
        if (invitation) {
          // Create the invited account, then send them to login (do not auto-sign-in).
          await registerWithInvitation({
            token: invitation.token,
            name: values.name,
            password: values.password,
            phone: values.phone,
          });
          setCredentials(values.email, values.password);
          return { skipOtp: true as const, redirectToLogin: true as const };
        }

        await registerUser(values);
        setCredentials(values.email, values.password);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Signup failed. Please try again.";
        setErrorMessage(message);
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [invitation, setCredentials],
  );

  const onVerifyOtp = useCallback(
    async (otp: number) => {
      if (!email) {
        throw new Error("Missing email. Go back and try again.");
      }

      setErrorMessage(null);
      setSubmitting(true);
      try {
        const { token, refreshToken, user } = await verifyOtp(email, otp);
        setAuthTokens(token, refreshToken);
        setSetupUser(user);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not verify code. Try again.";
        setErrorMessage(message);
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [email],
  );

  const onResendOtp = useCallback(async () => {
    if (!email) {
      throw new Error("Missing email. Go back and try again.");
    }

    await sendOtp(email);
  }, [email]);

  if (!inviteReady) {
    return (
      <SignupPageShell loginHref={loginHref} signupHref={signupHref}>
        <div className="flex min-h-[14rem] items-center justify-center">
          <p className="text-sm text-brand-muted">Checking invitation…</p>
        </div>
      </SignupPageShell>
    );
  }

  return (
    <SignupPageShell loginHref={loginHref} signupHref={signupHref}>
      <SignupForm
        submitting={submitting}
        errorMessage={errorMessage}
        loginHref={loginHref}
        invitation={invitation}
        onRegister={onRegister}
        onVerifyOtp={onVerifyOtp}
        onResendOtp={onResendOtp}
      />
    </SignupPageShell>
  );
}

function SignupPageLoading() {
  return (
    <div className="landing-page flex min-h-screen items-center justify-center bg-white">
      <p className="text-sm text-brand-muted">Loading…</p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupPageLoading />}>
      <GuestOnlyRoute>
        <SignupPageInner />
      </GuestOnlyRoute>
    </Suspense>
  );
}
