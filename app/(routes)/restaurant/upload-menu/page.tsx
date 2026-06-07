"use client";

import UploadMenuForm from "@/app/components/UploadMenuForm";
import { OnboardingRouteGuard } from "@/app/components/OnboardingRouteGuard";
import { resolvePostLoginPath } from "@/app/lib/onboarding-redirect";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import { uploadRestaurantMenu } from "@/app/services/restaurant/upload-menu";
import { Upload } from "lucide-react";
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  const content = (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 sm:px-8">
      <header className="mx-auto flex max-w-2xl gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-md"
          aria-hidden
        >
          <Upload className="h-6 w-6" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Upload menu</h1>
          <p className="mt-1 text-sm text-zinc-500">Add your menu items here after creating your restaurant.</p>
        </div>
      </header>

      {defaultRestaurantId != null ? (
        <UploadMenuForm
          restaurantId={defaultRestaurantId}
          submitting={submitting}
          errorMessage={errorMessage}
          onSubmit={onSubmit}
        />
      ) : (
        <p className="mx-auto mt-8 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          This step needs a restaurant. Finish{" "}
          <a href="/restaurant/register" className="font-medium underline underline-offset-2">
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
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50">
          <p className="text-sm text-zinc-500">Loading…</p>
        </div>
      }
    >
      <UploadMenuPageInner />
    </Suspense>
  );
}
