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
import { hasAuthSession, getSetupAccessToken } from "@/app/lib/auth-session";
import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import { getMyUserSubscription } from "@/app/services/subscription/user-subscription";
import { prependBusinessToMyListCache } from "@/app/services/business/business-query-cache";
import { businessQueryKeys } from "@/app/services/business/business-query-keys";
import { type AdminBusiness } from "@/app/services/business/get-my-business";
import { registerBusiness } from "@/app/services/business/register-business";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

async function userCanRegisterBusiness(): Promise<boolean> {
  try {
    const status = await getOnboardingStatus();
    if (status.subscriptionSelected) return true;
  } catch {}

  try {
    const subscription = await getMyUserSubscription();
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

type PostCreateStep =
  | "metaQuestion"
  | "metaCreate"
  | "facebook"
  | "stripeQuestion"
  | "stripeCreate"
  | "stripe"
  | "invite";

export default function RegisterBusinessPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [accessToken] = useState(() => getSetupAccessToken());
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

      // Still require an active/trialing plan — but no starter “one business” cap.
      const canRegister = await userCanRegisterBusiness();
      if (cancelled) return;

      if (!canRegister) {
        router.replace("/auth/select-plan");
        return;
      }
    }

    void verifyAccess();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const goToDashboard = useCallback(() => {
    router.replace("/dashboard");
  }, [router]);

  const goToFacebookStep = useCallback(() => {
    setPostCreateStep("facebook");
  }, []);

  const goToMetaQuestionStep = useCallback(() => {
    setPostCreateStep("metaQuestion");
  }, []);

  const goToMetaCreateStep = useCallback(() => {
    setPostCreateStep("metaCreate");
  }, []);

  const goToStripeQuestionStep = useCallback(() => {
    setPostCreateStep("stripeQuestion");
  }, []);

  const goToStripeCreateStep = useCallback(() => {
    setPostCreateStep("stripeCreate");
  }, []);

  const goToStripeConnectStep = useCallback(() => {
    setPostCreateStep("stripe");
  }, []);

  const goToInviteStep = useCallback(() => {
    setPostCreateStep("invite");
  }, []);

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

        setCreatedBusiness({
          id: businessId,
          name: data.name.trim(),
        });
        setPostCreateStep("metaQuestion");
        setSubmitting(false);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not add business. Try again.";
        setErrorMessage(message);
        setSubmitting(false);
      }
    },
    [accessToken, queryClient],
  );

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
      onSubmit={onSubmit}
    />
  );
}
