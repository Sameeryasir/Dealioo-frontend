"use client";

import { SignupPageShell } from "@/app/components/auth/SignupPageShell";
import SignupForm from "@/app/components/SignupForm";
import { OnboardingPageLoading } from "@/app/components/brand/OnboardingPageLoading";
import { GuestOnlyRoute } from "@/app/components/ProtectedRoute";
import { useCredentialContext } from "@/app/contexts/credential-context";
import { setAuthTokens } from "@/app/lib/auth-session";
import { resolveInviteAuthHrefs } from "@/app/lib/invite-auth-links";
import {
  trackProductCompleteRegistration,
  trackProductLead,
} from "@/app/lib/product-meta-pixel";
import { setSetupUser } from "@/app/lib/setup-user";
import { registerUser } from "@/app/services/auth/register";
import { sendOtp } from "@/app/services/auth/send-otp";
import { verifyOtp } from "@/app/services/auth/verify-otp";
import {
  registerWithInvitation,
  validateBusinessInvitation,
} from "@/app/services/invitation/business-invitations";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

function SignupPageInner() {
  const router = useRouter();
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

  const legacyReturnTo = searchParams.get("returnTo");
  const oauthError = searchParams.get("error");
  const inviteTokenParam = searchParams.get("inviteToken");
  const { inviteToken, loginHref, signupHref } = useMemo(
    () =>
      resolveInviteAuthHrefs({
        inviteToken: inviteTokenParam,
        returnTo: legacyReturnTo,
      }),
    [inviteTokenParam, legacyReturnTo],
  );

  useEffect(() => {
    if (!legacyReturnTo?.trim()) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("returnTo");
    const qs = params.toString();
    router.replace(qs ? `/auth/signup?${qs}` : "/auth/signup");
  }, [legacyReturnTo, router, searchParams]);

  useEffect(() => {
    if (!inviteToken) return;
    if (inviteTokenParam?.trim() === inviteToken) return;
    router.replace(signupHref);
  }, [inviteToken, inviteTokenParam, router, signupHref]);

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
          const inviteResult = await registerWithInvitation({
            token: invitation.token,
            name: values.name,
            password: values.password,
            phone: values.phone,
          });
          setCredentials(values.email, values.password);
          if (inviteResult.isNewCustomer) {
            trackProductLead("signup_form_invite", {
              email: values.email,
              phone: values.phone,
            });
            trackProductCompleteRegistration({
              email: values.email,
              phone: values.phone,
              externalId: String(inviteResult.user.id),
              isNewCustomer: true,
            });
          }
          return { skipOtp: true as const, redirectToLogin: true as const };
        }

        const registerResult = await registerUser(values);
        setCredentials(values.email, values.password);
        if (registerResult.isNewCustomer) {
          trackProductLead("signup_form", {
            email: values.email,
            phone: values.phone,
          });
        }
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
        const { token, refreshToken, user, isNewCustomer } = await verifyOtp(
          email,
          otp,
        );
        trackProductCompleteRegistration({
          email: user.email || email,
          phone: user.phone || undefined,
          externalId: String(user.id),
          isNewCustomer,
        });
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
  return <OnboardingPageLoading />;
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
