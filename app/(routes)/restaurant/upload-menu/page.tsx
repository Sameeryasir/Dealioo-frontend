"use client";

import UploadMenuForm from "@/app/components/UploadMenuForm";
import DealiooLogo from "@/app/components/brand/DealiooLogo";
import { AuthPageLoading } from "@/app/components/brand/AuthPageShell";
import { OnboardingRouteGuard } from "@/app/components/OnboardingRouteGuard";
import { resolvePostLoginPath } from "@/app/lib/onboarding-redirect";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import { uploadRestaurantMenu } from "@/app/services/restaurant/upload-menu";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

function UploadMenuPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRestaurantId = useMemo(() => {
    const raw = searchParams.get("restaurantId");
    if (raw == null || !/^\d+$/.test(raw)) return undefined;
    const n = parseInt(raw, 10);
    return n >= 1 ? n : undefined;
  }, [searchParams]);

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
    async (payload: Parameters<typeof uploadRestaurantMenu>[1]) => {
      setErrorMessage(null);
      setSubmitting(true);
      try {
        await uploadRestaurantMenu(accessToken, payload);
        const status = await getOnboardingStatus(payload.restaurantId);
        router.push(resolvePostLoginPath(status));
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not upload menu. Try again.",
        );
        setSubmitting(false);
      }
    },
    [accessToken, router],
  );

  if (!tokenReady) {
    return <AuthPageLoading />;
  }

  const content = (
    <div className="min-h-screen brand-page-soft px-4 py-10 sm:px-8">
      <header className="mx-auto mb-8 flex max-w-2xl flex-col items-center text-center">
        <DealiooLogo variant="light" className="mb-6 h-9 w-auto sm:h-10" />
        <h1 className="brand-heading">Upload menu</h1>
          <p className="brand-subtext mt-1">
            Add your menu items here after creating your restaurant.
          </p>
        </header>

      {defaultRestaurantId != null ? (
        <UploadMenuForm
          restaurantId={defaultRestaurantId}
          submitting={submitting}
          errorMessage={errorMessage}
          onSubmit={onSubmit}
        />
      ) : (
        <p className="mx-auto mt-8 max-w-2xl rounded-xl border border-brand-offer/30 bg-brand-offer/10 px-4 py-3 text-sm text-brand-navy">
          This step needs a restaurant. Finish{" "}
          <a href="/restaurant/register" className="brand-link">
            create restaurant
          </a>{" "}
          first (you will be sent here automatically), or open this page with{" "}
          <span className="font-mono text-xs">?restaurantId=</span> in the URL.
        </p>
      )}
    </div>
  );

  if (defaultRestaurantId == null) {
    return content;
  }

  return (
    <OnboardingRouteGuard step="menu_setup" restaurantId={defaultRestaurantId}>
      {content}
    </OnboardingRouteGuard>
  );
}

export default function UploadMenuPage() {
  return (
    <Suspense fallback={<AuthPageLoading />}>
      <UploadMenuPageInner />
    </Suspense>
  );
}
