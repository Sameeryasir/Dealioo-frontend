"use client";

import RegisterRestaurantForm, {
  type RegisterRestaurantFormValues,
} from "@/app/components/RegisterRestaurantForm";
import DealiooLogo from "@/app/components/brand/DealiooLogo";
import { AuthPageLoading } from "@/app/components/brand/AuthPageShell";
import { OnboardingRouteGuard } from "@/app/components/OnboardingRouteGuard";
import { resolvePostLoginPath } from "@/app/lib/onboarding-redirect";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import { registerRestaurant } from "@/app/services/restaurant/register-restaurant";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function RegisterRestaurantPage() {
  const router = useRouter();
  const [tokenReady, setTokenReady] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setAccessToken(getSetupAccessToken());
      setTokenReady(true);
    });
  }, []);

  const onSubmit = useCallback(
    async (data: RegisterRestaurantFormValues) => {
      setErrorMessage(null);
      setSubmitting(true);
      try {
        const created = await registerRestaurant(accessToken, {
          name: data.name,
          phoneNumber: data.phoneNumber,
          email: data.email.trim() || undefined,
          cuisineType: data.cuisineType || undefined,
          description: data.description.trim() || undefined,
          websiteUrl: data.websiteUrl || undefined,
          logoUrl: data.logoUrl,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
          branchCount: data.branchCount,
        });
        const rid = created.restaurantId ?? created.id;
        const status = await getOnboardingStatus(
          rid != null && Number.isFinite(rid) ? rid : undefined,
        );
        router.push(resolvePostLoginPath(status));
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not register restaurant. Try again.",
        );
        setSubmitting(false);
      }
    },
    [accessToken, router],
  );

  if (!tokenReady) {
    return <AuthPageLoading />;
  }

  return (
    <OnboardingRouteGuard step="restaurant_creation">
      <div className="brand-onboarding-page min-h-screen px-4 py-8 sm:px-8 lg:px-12 xl:px-16">
        <header className="mx-auto mb-8 flex max-w-3xl flex-col items-center text-center">
          <DealiooLogo variant="light" className="mb-6 h-9 w-auto sm:h-10" />
          <h1 className="brand-heading">Create Restaurant</h1>
            <p className="brand-subtext mt-1">
              Add a new restaurant to the system. Fill in the details below.
            </p>
          </header>

          <RegisterRestaurantForm
            submitting={submitting}
            errorMessage={errorMessage}
            onSubmit={onSubmit}
          />
      </div>
    </OnboardingRouteGuard>
  );
}
