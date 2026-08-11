"use client";

import RegisterBusinessForm, {
  type RegisterBusinessFormValues,
} from "@/app/components/register-business/RegisterBusinessForm";
import RegisterBusinessCreateMetaAdAccountStep from "@/app/components/register-business/RegisterBusinessCreateMetaAdAccountStep";
import RegisterBusinessCreateStripeAccountStep from "@/app/components/register-business/RegisterBusinessCreateStripeAccountStep";
import RegisterBusinessFacebookConnectStep from "@/app/components/register-business/RegisterBusinessFacebookConnectStep";
import RegisterBusinessInviteStep from "@/app/components/register-business/RegisterBusinessInviteStep";
import RegisterBusinessMetaAdsQuestionStep from "@/app/components/register-business/RegisterBusinessMetaAdsQuestionStep";
import RegisterBusinessStripeConnectStep from "@/app/components/register-business/RegisterBusinessStripeConnectStep";
import RegisterBusinessStripeQuestionStep from "@/app/components/register-business/RegisterBusinessStripeQuestionStep";
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
import type { TwilioPhoneNumberOption } from "@/app/services/business/twilio-phone-numbers";
import {
  clearPostCreateOnboarding,
  readPostCreateOnboarding,
  writePostCreateOnboarding,
  type PostCreateStep,
} from "@/app/lib/post-create-onboarding";
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

type CreatedBusiness = {
  id: number;
  name: string;
};

export default function RegisterBusinessPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [accessToken] = useState(() => getSetupAccessToken());
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gateReady, setGateReady] = useState(false);
  const [createdBusiness, setCreatedBusiness] = useState<CreatedBusiness | null>(
    null,
  );
  const [postCreateStep, setPostCreateStep] =
    useState<PostCreateStep>("metaQuestion");

  useEffect(() => {
    let cancelled = false;

    async function verifyAccess() {
      if (!hasAuthSession()) {
        router.replace("/auth/login");
        return;
      }

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

        if (
          status.businessCreated &&
          isStarterSubscription(subscription) &&
          !readPostCreateOnboarding()
        ) {
          router.replace(resolvePostAuthPath(status));
          return;
        }

        const saved = readPostCreateOnboarding();
        if (saved && !cancelled) {
          setCreatedBusiness({
            id: saved.businessId,
            name: saved.businessName,
          });
          setPostCreateStep(saved.step);
        }

        if (!cancelled) setGateReady(true);
      } catch {
        const canRegister = await userCanRegisterBusiness(queryClient);
        if (cancelled) return;
        if (!canRegister) {
          router.replace("/auth/select-plan");
          return;
        }
        const saved = readPostCreateOnboarding();
        if (saved) {
          setCreatedBusiness({
            id: saved.businessId,
            name: saved.businessName,
          });
          setPostCreateStep(saved.step);
        }
        setGateReady(true);
      }
    }

    void verifyAccess();

    return () => {
      cancelled = true;
    };
  }, [queryClient, router]);

  const savePostCreateStep = useCallback(
    (step: PostCreateStep, business?: CreatedBusiness | null) => {
      const nextBusiness = business ?? createdBusiness;
      setPostCreateStep(step);
      if (!nextBusiness) return;
      writePostCreateOnboarding({
        businessId: nextBusiness.id,
        businessName: nextBusiness.name,
        step,
      });
    },
    [createdBusiness],
  );

  const goToDashboard = useCallback(() => {
    clearPostCreateOnboarding();
    router.replace("/dashboard?setup=1");
  }, [router]);

  const goToFacebookStep = useCallback(() => {
    savePostCreateStep("facebook");
  }, [savePostCreateStep]);

  const goToMetaQuestionStep = useCallback(() => {
    savePostCreateStep("metaQuestion");
  }, [savePostCreateStep]);

  const goToMetaCreateStep = useCallback(() => {
    savePostCreateStep("metaCreate");
  }, [savePostCreateStep]);

  const goToStripeQuestionStep = useCallback(() => {
    savePostCreateStep("stripeQuestion");
  }, [savePostCreateStep]);

  const goToStripeCreateStep = useCallback(() => {
    savePostCreateStep("stripeCreate");
  }, [savePostCreateStep]);

  const goToStripeConnectStep = useCallback(() => {
    savePostCreateStep("stripe");
  }, [savePostCreateStep]);

  const goToInviteStep = useCallback(() => {
    savePostCreateStep("invite");
  }, [savePostCreateStep]);

  const onCreateBusiness = useCallback(
    async (
      pendingForm: RegisterBusinessFormValues,
      selected: TwilioPhoneNumberOption,
    ) => {
      setErrorMessage(null);
      setSubmitting(true);
      try {
        const result = await registerBusiness(accessToken, {
          name: pendingForm.name,
          phoneNumber: pendingForm.phoneNumber,
          email: pendingForm.email.trim() || undefined,
          description: pendingForm.description.trim() || undefined,
          websiteUrl: pendingForm.websiteUrl || undefined,
          logoFile: pendingForm.logoFile ?? null,
          logoUrl: pendingForm.logoUrl ?? null,
          city: pendingForm.city,
          state: pendingForm.state,
          postalCode: pendingForm.postalCode,
          country: pendingForm.country,
          branchCount: pendingForm.branchCount,
          twilioPhoneSid: selected.sid,
          twilioPhoneNumber: selected.phoneNumber,
        });

        const businessId =
          result.business?.id ?? result.id ?? result.businessId ?? null;

        if (businessId == null || !Number.isFinite(businessId) || businessId < 1) {
          throw new Error("Business was created, but no business id was returned.");
        }

        const businessForCache: AdminBusiness =
          result.business ?? {
            id: businessId,
            name: pendingForm.name.trim(),
            phoneNumber: pendingForm.phoneNumber.trim(),
            email: pendingForm.email.trim() || null,
            description: pendingForm.description.trim() || null,
            websiteUrl: pendingForm.websiteUrl.trim() || null,
            city: pendingForm.city.trim() || null,
            state: pendingForm.state.trim() || null,
            postalCode: pendingForm.postalCode.trim() || null,
            country: pendingForm.country.trim() || null,
            branchCount: pendingForm.branchCount,
            twilioConnected: true,
            twilioPhoneNumber: selected.phoneNumber,
          };

        prependBusinessToMyListCache(queryClient, businessForCache);
        await queryClient.invalidateQueries({
          queryKey: businessQueryKeys.myLists(),
        });
        invalidateOnboardingStatusCache();

        const created = {
          id: businessId,
          name: pendingForm.name.trim(),
        };
        setCreatedBusiness(created);
        savePostCreateStep("metaQuestion", created);
        setSubmitting(false);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not add business. Your form data is still here — try again.";
        setErrorMessage(message);
        setSubmitting(false);
      }
    },
    [accessToken, queryClient, savePostCreateStep],
  );

  if (!gateReady) {
    return <OnboardingPageLoading />;
  }

  if (createdBusiness && postCreateStep === "metaQuestion") {
    return (
      <RegisterBusinessMetaAdsQuestionStep
        onHasAccount={goToFacebookStep}
        onNoAccount={goToMetaCreateStep}
        onSkip={goToStripeQuestionStep}
      />
    );
  }

  if (createdBusiness && postCreateStep === "metaCreate") {
    return (
      <RegisterBusinessCreateMetaAdAccountStep
        onContinue={goToFacebookStep}
        onBack={goToMetaQuestionStep}
        onSkip={goToStripeQuestionStep}
      />
    );
  }

  if (createdBusiness && postCreateStep === "facebook") {
    return (
      <RegisterBusinessFacebookConnectStep
        businessId={createdBusiness.id}
        businessName={createdBusiness.name}
        onContinue={goToStripeQuestionStep}
        onBack={goToMetaQuestionStep}
      />
    );
  }

  if (createdBusiness && postCreateStep === "stripeQuestion") {
    return (
      <RegisterBusinessStripeQuestionStep
        onHasAccount={goToStripeConnectStep}
        onNoAccount={goToStripeCreateStep}
        onSkip={goToInviteStep}
        onBack={goToFacebookStep}
      />
    );
  }

  if (createdBusiness && postCreateStep === "stripeCreate") {
    return (
      <RegisterBusinessCreateStripeAccountStep
        onContinue={goToStripeConnectStep}
        onBack={goToStripeQuestionStep}
        onSkip={goToInviteStep}
      />
    );
  }

  if (createdBusiness && postCreateStep === "stripe") {
    return (
      <RegisterBusinessStripeConnectStep
        businessId={createdBusiness.id}
        businessName={createdBusiness.name}
        onContinue={goToInviteStep}
        onBack={goToStripeQuestionStep}
      />
    );
  }

  if (createdBusiness) {
    return (
      <RegisterBusinessInviteStep
        businessId={createdBusiness.id}
        businessName={createdBusiness.name}
        onContinue={goToDashboard}
        onBack={goToStripeQuestionStep}
      />
    );
  }

  return (
    <RegisterBusinessForm
      submitting={submitting}
      errorMessage={errorMessage}
      onCreateBusiness={onCreateBusiness}
    />
  );
}
