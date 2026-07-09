"use client";

import RegisterBusinessForm, {
  type RegisterBusinessFormValues,
} from "@/app/components/RegisterBusinessForm";
import DealiooLogo from "@/app/components/brand/DealiooLogo";
import { AuthPageLoading } from "@/app/components/brand/AuthPageShell";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { prependBusinessToMyListCache } from "@/app/services/business/business-query-cache";
import { registerBusiness } from "@/app/services/business/register-business";
import type { AdminRestaurant } from "@/app/services/business/get-my-business";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function RegisterBusinessPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
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
    async (data: RegisterBusinessFormValues) => {
      setErrorMessage(null);
      setSubmitting(true);
      try {
        const result = await registerBusiness(accessToken, {
          name: data.name,
          phoneNumber: data.phoneNumber,
          email: data.email.trim() || undefined,
          cuisineType: undefined,
          description: data.description.trim() || undefined,
          websiteUrl: data.websiteUrl || undefined,
          logoFile: data.logoFile ?? null,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
          branchCount: data.branchCount,
        });

        const businessForCache: AdminRestaurant =
          result.business ?? {
            id: result.id,
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
        router.push("/dashboard");
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not add business. Try again.",
        );
        setSubmitting(false);
      }
    },
    [accessToken, queryClient, router],
  );

  if (!tokenReady) {
    return <AuthPageLoading />;
  }

  return (
    <div className="brand-onboarding-page min-h-screen px-4 py-8 sm:px-8 lg:px-12 xl:px-16">
      <header className="mx-auto mb-8 flex max-w-3xl flex-col items-center text-center">
        <DealiooLogo variant="light" className="mb-6 h-9 w-auto sm:h-10" />
        <h1 className="brand-heading">Add business</h1>
        <p className="brand-subtext mt-1">
          Set up a new business in a few quick steps.
        </p>
      </header>

      <RegisterBusinessForm
        submitting={submitting}
        errorMessage={errorMessage}
        onSubmit={onSubmit}
      />
    </div>
  );
}
