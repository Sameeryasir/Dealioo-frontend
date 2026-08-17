"use client";

/**
 * Change summary:
 * - Added /stripe/connect page so Integrations "Connect Stripe" no longer 404s.
 * - Starts Connect via POST /stripe/connect/:businessId, then sends the user to Stripe.
 * - Related: connect-stripe.ts, BusinessIntegrationsPanel.tsx, stripe/connect/success.
 */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { getSetupAccessToken } from "@/app/lib/auth-session";
import { connectStripe } from "@/app/services/stripe/connect-stripe";

function StripeConnectInner() {
  const searchParams = useSearchParams();
  const businessIdRaw = searchParams.get("businessId")?.trim() ?? "";
  const businessId = Number(businessIdRaw);

  const [error, setError] = useState<string | null>(null);

  const integrationsHref =
    Number.isFinite(businessId) && businessId > 0
      ? `/business/${businessId}/dashboard/settings/integrations?focus=stripe`
      : "/dashboard";

  useEffect(() => {
    let cancelled = false;

    async function startConnect() {
      // --- Validation ---
      if (!Number.isFinite(businessId) || businessId < 1) {
        setError("Missing or invalid business. Open Integrations and try again.");
        return;
      }

      const token = getSetupAccessToken().trim();
      if (!token) {
        setError("You're signed out. Sign in again, then connect Stripe.");
        return;
      }

      try {
        // Same API flow as business registration Stripe step (MCP context 7).
        const { url } = await connectStripe(token, businessId);
        if (cancelled) return;
        const width = 560;
        const height = 720;
        const left = Math.max(
          0,
          window.screenX + (window.outerWidth - width) / 2,
        );
        const top = Math.max(
          0,
          window.screenY + (window.outerHeight - height) / 2,
        );
        const popup = window.open(
          url,
          "dealioo_stripe_connect",
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`,
        );
        if (!popup) {
          window.location.assign(url);
          return;
        }
        window.location.assign(integrationsHref);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Error
            ? e.message
            : "Could not start Stripe connection. Try again.",
        );
      }
    }

    void startConnect();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  if (error) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f4f7fb] px-4">
        <div className="w-full max-w-md rounded-2xl border border-[#e8edf5] bg-white p-8 text-center shadow-[0_14px_36px_rgba(15,23,42,0.07)]">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100">
            <AlertCircle className="size-6" strokeWidth={2.25} aria-hidden />
          </span>
          <h1 className="mt-4 text-lg font-extrabold tracking-tight text-[#07111f]">
            Could not connect Stripe
          </h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
            {error}
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href={integrationsHref}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#635BFF] px-4 text-sm font-semibold text-white no-underline"
            >
              Back to Integrations
            </Link>
            <button
              type="button"
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-[#e8edf5] bg-white px-4 text-sm font-semibold text-slate-700"
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f4f7fb] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#e8edf5] bg-white p-8 text-center shadow-[0_14px_36px_rgba(15,23,42,0.07)]">
        <Loader2
          className="mx-auto size-8 animate-spin text-[#635BFF]"
          strokeWidth={2.25}
          aria-hidden
        />
        <h1 className="mt-4 text-lg font-extrabold tracking-tight text-[#07111f]">
          Connecting Stripe
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Redirecting you to Stripe to finish setup…
        </p>
      </div>
    </main>
  );
}

export default function StripeConnectPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-[#f4f7fb]">
          <Loader2
            className="size-8 animate-spin text-[#635BFF]"
            strokeWidth={2.25}
            aria-hidden
          />
        </main>
      }
    >
      <StripeConnectInner />
    </Suspense>
  );
}
