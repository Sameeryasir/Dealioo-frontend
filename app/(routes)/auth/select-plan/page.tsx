"use client";

import { SignupSelectPlanPanel } from "@/app/components/SignupSelectPlanPanel";
import { AuthPageLoading } from "@/app/components/brand/AuthPageShell";
import {
  AUTH_SESSION_CHANGED_EVENT,
  clearAuthSession,
  hasAuthSession,
} from "@/app/lib/auth-session";
import { isInvitedTeamUser } from "@/app/lib/is-invited-team-user";
import { fetchAuthenticatedOnboardingDestination } from "@/app/lib/onboarding-redirect";
import {
  clearSetupUser,
  getSetupUser,
  syncAuthUserBroadcast,
} from "@/app/lib/setup-user";
import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import { getMyUserSubscription } from "@/app/services/subscription/user-subscription";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function SelectPlanPageInner() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [presetPlanId, setPresetPlanId] = useState<string | null>(null);
  const [presetBillingCycle, setPresetBillingCycle] = useState<
    "monthly" | "annual" | null
  >(null);
  const [autoCheckout, setAutoCheckout] = useState(false);
  const [sessionConflict, setSessionConflict] = useState<string | null>(null);

  useEffect(() => {
    const current = getSetupUser();
    if (current?.id) {
      syncAuthUserBroadcast(current.id, current.email);
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== "dealioo_auth_user_id") return;
      const nextId = event.newValue?.trim() || "";
      const localId = current?.id != null ? String(current.id) : "";
      if (!nextId) {
        clearAuthSession();
        clearSetupUser();
        router.replace("/auth/login");
        return;
      }
      if (localId && nextId !== localId) {
        setSessionConflict(
          "Another account signed in on a different tab. Refresh or sign in again to continue checkout for the correct account.",
        );
      }
    };

    const onAuthChanged = () => {
      const latest = getSetupUser();
      if (!latest) {
        router.replace("/auth/login");
        return;
      }
      if (current?.id && latest.id !== current.id) {
        setSessionConflict(
          `You are now signed in as ${latest.email}. Reload this page to continue checkout for that account.`,
        );
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, onAuthChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, onAuthChanged);
    };
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!hasAuthSession()) {
        router.replace("/auth/signup");
        return;
      }

      if (isInvitedTeamUser()) {
        router.replace("/dashboard");
        return;
      }

      // Keep the URL clean — plan comes from the signed-in user on the server.
      if (typeof window !== "undefined" && window.location.search) {
        router.replace("/auth/select-plan");
      }

      try {
        const status = await getOnboardingStatus();
        if (cancelled) return;

        if (status.pendingPlanSlug) {
          setPresetPlanId(status.pendingPlanSlug);
          setAutoCheckout(Boolean(status.forcePlanCheckout));
        }
        if (
          status.pendingBillingCycle === "monthly" ||
          status.pendingBillingCycle === "annual"
        ) {
          setPresetBillingCycle(status.pendingBillingCycle);
        }

        if (status.forcePlanCheckout && status.pendingPlanSlug) {
          if (!cancelled) setReady(true);
          return;
        }

        const destination = await fetchAuthenticatedOnboardingDestination();
        if (cancelled) return;

        if (!destination.startsWith("/auth/select-plan")) {
          router.replace(destination);
          return;
        }
      } catch {
        if (cancelled) return;

        try {
          const subscription = await getMyUserSubscription();
          if (cancelled) return;

          if (
            subscription?.status === "active" ||
            subscription?.status === "trialing"
          ) {
            router.replace("/business/register");
            return;
          }
        } catch {
          if (cancelled) return;
        }
      }

      if (!cancelled) {
        setReady(true);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return <AuthPageLoading />;
  }

  return (
    <>
      {sessionConflict ? (
        <div
          className="mx-auto mt-4 flex max-w-3xl items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          <span className="min-w-0 flex-1">{sessionConflict}</span>
          <button
            type="button"
            className="shrink-0 font-semibold text-amber-950 underline"
            onClick={() => window.location.assign("/auth/select-plan")}
          >
            Reload
          </button>
        </div>
      ) : null}
      <SignupSelectPlanPanel
        presetPlanId={presetPlanId}
        presetBillingCycle={presetBillingCycle}
        autoCheckout={autoCheckout && !sessionConflict}
        checkoutOnBillingChange={Boolean(presetPlanId)}
      />
    </>
  );
}

export default function SelectPlanPage() {
  return (
    <Suspense fallback={<AuthPageLoading />}>
      <SelectPlanPageInner />
    </Suspense>
  );
}
