"use client";

/**
 * Change summary: After business create, go to dashboard with setup checklist
 * instead of blocking optional Meta/Stripe/invite wizards.
 * Why: optional integrations must not gate access (production onboarding #7).
 */
import RegisterBusinessForm, {
  type RegisterBusinessFormValues,
} from "@/app/components/register-business/RegisterBusinessForm";
import { OnboardingPageLoading } from "@/app/components/brand/OnboardingPageLoading";
import { hasAuthSession, getSetupAccessToken } from "@/app/lib/auth-session";
import { isInvitedTeamUser } from "@/app/lib/is-invited-team-user";
import { isStarterSubscription } from "@/app/lib/plan-limits";
import { resolvePostAuthPath } from "@/app/lib/onboarding-redirect";
import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import {
  myUserSubscriptionQueryKey,
} from "@/app/hooks/use-my-user-subscription";
import { getMyUserSubscription } from "@/app/services/subscription/user-subscription";
import { prependBusinessToMyListCache } from "@/app/services/business/business-query-cache";
import { businessQueryKeys } from "@/app/services/business/business-query-keys";
import { type AdminBusiness } from "@/app/services/business/get-my-business";
import { registerBusiness } from "@/app/services/business/register-business";
import { invalidateOnboardingStatusCache } from "@/app/services/onboarding/get-onboarding-status";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

async function userCanRegisterBusiness(
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<boolean> {
  try {
    const status = await getOnboardingStatus();
    if (status.subscriptionCompleted || status.subscriptionSelected) return true;
  } catch {}

  try {
    const subscription = await queryClient.fetchQuery({
      queryKey: myUserSubscriptionQueryKey,
      queryFn: getMyUserSubscription,
      staleTime: 5 * 60_000,
    });
    return (
      subscription?.status === "active" || subscription?.status === "trialing"
    );
  } catch {
    return false;
  }
}

export default function RegisterBusinessPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [accessToken] = useState(() => getSetupAccessToken());
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gateReady, setGateReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifyAccess() {
      if (!hasAuthSession()) {
        router.replace("/auth/login");
        return;
      }

      // Manager / Staff must never enter owner onboarding.
      if (isInvitedTeamUser()) {
        router.replace("/dashboard");
        return;
      }

      try {
        const [status, subscription] = await Promise.all([
          getOnboardingStatus(),
          queryClient
            .fetchQuery({
              queryKey: myUserSubscriptionQueryKey,
              queryFn: getMyUserSubscription,
              staleTime: 5 * 60_000,
            })
            .catch(() => null),
        ]);
        if (cancelled) return;

        if (!status.subscriptionCompleted && !status.subscriptionSelected) {
          router.replace("/auth/select-plan");
          return;
        }

        // Only Starter is limited to one business. Growth AI / other plans may
        // open /business/register again to add another location.
        if (status.businessCreated && isStarterSubscription(subscription)) {
          router.replace(resolvePostAuthPath(status));
          return;
        }

        if (!cancelled) setGateReady(true);
      } catch {
        const canRegister = await userCanRegisterBusiness(queryClient);
        if (cancelled) return;
        if (!canRegister) {
          router.replace("/auth/select-plan");
          return;
        }
        setGateReady(true);
      }
    }

    void verifyAccess();

    return () => {
      cancelled = true;
    };
  }, [queryClient, router]);

  if (!gateReady) {
    return <OnboardingPageLoading />;
  }

  const onSubmit = useCallback(
    async (data: RegisterBusinessFormValues) => {
      setErrorMessage(null);
      setSubmitting(true);
      try {
        const result = await registerBusiness(accessToken, {
          name: data.name,
          phoneNumber: data.phoneNumber,
          email: data.email.trim() || undefined,
          description: data.description.trim() || undefined,
          websiteUrl: data.websiteUrl || undefined,
          logoFile: data.logoFile ?? null,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
          branchCount: data.branchCount,
        });

        const businessId =
          result.business?.id ?? result.id ?? result.businessId ?? null;

        if (businessId == null || !Number.isFinite(businessId) || businessId < 1) {
          throw new Error("Business was created, but no business id was returned.");
        }

        const businessForCache: AdminBusiness =
          result.business ?? {
            id: businessId,
            name: data.name.trim(),
            phoneNumber: data.phoneNumber.trim(),
            email: data.email.trim() || null,
            description: data.description.trim() || null,
            websiteUrl: data.websiteUrl.trim() || null,
            city: data.city.trim() || null,
            state: data.state.trim() || null,
            postalCode: data.postalCode.trim() || null,
            country: data.country.trim() || null,
            branchCount: data.branchCount,
          };

        prependBusinessToMyListCache(queryClient, businessForCache);
        await queryClient.invalidateQueries({
          queryKey: businessQueryKeys.myLists(),
        });
        invalidateOnboardingStatusCache();

        // Optional integrations move to the dashboard checklist — do not block.
        router.replace("/dashboard?setup=1");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not add business. Your form data is still here — try again.";
        setErrorMessage(message);
        setSubmitting(false);
      }
    },
    [accessToken, queryClient, router],
  );

  return (
    <RegisterBusinessForm
      submitting={submitting}
      errorMessage={errorMessage}
      onSubmit={onSubmit}
    />
  );
}
