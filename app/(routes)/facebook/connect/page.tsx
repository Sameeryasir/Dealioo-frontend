"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Check, Loader2 } from "lucide-react";
import { MetaAdsPermissionConsent } from "@/app/components/facebook/MetaAdsPermissionConsent";
import { MetaLogo } from "@/app/components/landing/LandingIntegrationLogos";
import { readBusinessIdFromSearchParams } from "@/app/lib/business-id-params";
import { connectFacebookInPopup } from "@/app/lib/facebook-oauth-popup";
import { abortFacebookConnect } from "@/app/services/facebook/abort-facebook-connect";
import {
  formatMetaScopeTitle,
  getDefaultSelectedMetaScopes,
  type MetaSelectableScopeId,
} from "@/app/lib/meta-ads-permissions";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import {
  getFacebookConnectionStatus,
  type MetaConnectionStatus,
} from "@/app/services/facebook/get-facebook-connection-status";

function FacebookLogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden
      className={className}
    >
      <path
        fill="currentColor"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

function FacebookConnectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = readBusinessIdFromSearchParams(searchParams) ?? null;

  const [statusLoading, setStatusLoading] = useState(true);
  const [connection, setConnection] = useState<MetaConnectionStatus | null>(
    null,
  );
  const [selectedScopes, setSelectedScopes] = useState<MetaSelectableScopeId[]>(
    () => getDefaultSelectedMetaScopes(),
  );
  const [connecting, setConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const integrationsHref =
    businessId != null
      ? `/business/${businessId}/dashboard/settings/integrations`
      : "/dashboard";

  const selectAdAccountHref =
    businessId != null
      ? `/facebook/select-ad-account?businessId=${businessId}`
      : "/dashboard";

  useEffect(() => {
    if (businessId == null) {
      setStatusLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      setStatusLoading(true);
      setErrorMessage(null);
      try {
        const token = getSetupAccessToken().trim();
        if (!token) {
          throw new Error("You're signed out. Sign in again to connect Meta.");
        }
        const status = await getFacebookConnectionStatus(token, businessId);
        if (!cancelled) setConnection(status);
      } catch (error) {
        if (!cancelled) {
          setConnection(null);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Could not check Meta connection.",
          );
        }
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const handleConnect = useCallback(async () => {
    setErrorMessage(null);

    if (businessId == null) {
      setErrorMessage("Business is missing. Open Connect from Integrations again.");
      return;
    }

    if (selectedScopes.length === 0) {
      setErrorMessage("Select at least one permission before connecting.");
      return;
    }

    setConnecting(true);

    try {
      const token = getSetupAccessToken().trim();
      if (!token) {
        throw new Error("You're signed out. Sign in again to connect Meta.");
      }

      const result = await connectFacebookInPopup(
        token,
        businessId,
        selectedScopes,
      );

      if (result.status === "connected") {
        router.replace(
          `/facebook/select-ad-account?businessId=${businessId}`,
        );
        return;
      }

      await abortFacebookConnect(businessId);
      setErrorMessage(
        "Meta connect was cancelled. You can try again or go back.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not connect Meta. Try again.",
      );
    } finally {
      setConnecting(false);
    }
  }, [businessId, router, selectedScopes]);

  if (businessId == null) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f0f2f5] px-4 py-12">
        <div className="w-full max-w-md rounded-xl border border-[#ccd0d5] bg-white p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          <AlertCircle className="mx-auto size-10 text-red-600" aria-hidden />
          <h1 className="mt-4 text-lg font-semibold text-zinc-900">
            Business required
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Open Connect with Meta from your business Integrations page.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-[#1877F2] px-4 text-sm font-semibold text-white no-underline"
          >
            Go to dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (statusLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f0f2f5]">
        <div className="flex items-center gap-2 text-sm text-[#65676b]">
          <Loader2 className="size-5 animate-spin text-[#1877F2]" aria-hidden />
          Checking Meta connection…
        </div>
      </main>
    );
  }

  const isConnected = Boolean(connection?.connected);
  const grantedScopes = connection?.metaOauthScopes ?? [];
  const adAccountId = connection?.metaAdAccountId?.trim() || null;

  if (isConnected) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[#f0f2f5] px-4 py-12 font-[Helvetica,Arial,'Segoe_UI',sans-serif]">
        <div className="w-full max-w-[400px] overflow-hidden rounded-xl bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.1)]">
          <div className="flex flex-col items-center px-6 pt-7 pb-2">
            <span className="flex size-14 items-center justify-center rounded-full bg-[#1877F2] text-white">
              <FacebookLogoMark className="size-8" />
            </span>
            <h1 className="mt-4 text-center text-[20px] font-bold leading-tight text-[#1c1e21]">
              Already connected to Meta
            </h1>
            <p className="mt-2 text-center text-[15px] leading-snug text-[#65676b]">
              Your Meta account is linked to Dealioo for Meta Ads.
            </p>
          </div>

          <div className="space-y-3 px-6 pb-6 pt-4">
            <div className="flex items-center gap-2 rounded-lg bg-[#e7f3ff] px-3 py-2.5 text-[13px] font-semibold text-[#1877F2]">
              <span className="flex size-5 items-center justify-center rounded-full bg-[#1877F2] text-white">
                <Check className="size-3" strokeWidth={3} aria-hidden />
              </span>
              Connected with Meta
            </div>

            {adAccountId ? (
              <p className="m-0 text-center text-[13px] text-[#65676b]">
                Ad account{" "}
                <span className="font-mono font-semibold text-[#1c1e21]">
                  {adAccountId}
                </span>
              </p>
            ) : (
              <p className="m-0 text-center text-[15px] text-[#65676b]">
                Next, choose which ad account Dealioo should use.
              </p>
            )}

            {grantedScopes.length > 0 ? (
              <ul className="m-0 divide-y divide-[#e4e6eb] overflow-hidden rounded-lg border border-[#dadde1] p-0">
                {grantedScopes.map((scopeId) => (
                  <li
                    key={scopeId}
                    className="flex items-center gap-3 px-3.5 py-3"
                  >
                    <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#e7f3ff] text-[#1877F2]">
                      <Check className="size-2.5" strokeWidth={3} aria-hidden />
                    </span>
                    <span className="text-[14px] font-semibold text-[#1c1e21]">
                      {formatMetaScopeTitle(scopeId)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            {!adAccountId ? (
              <Link
                href={selectAdAccountHref}
                className="flex h-11 w-full items-center justify-center rounded-lg bg-[#1877F2] text-[17px] font-bold text-white no-underline hover:bg-[#166fe5]"
              >
                Choose Ad Account
              </Link>
            ) : null}

            <Link
              href={integrationsHref}
              className="flex h-10 w-full items-center justify-center text-[15px] font-semibold text-[#1877F2] no-underline hover:underline"
            >
              Back to Integrations
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#f5f6f8] px-4 py-12">
      <div className="w-full max-w-[440px] overflow-hidden rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.08)] sm:p-7">
        <MetaAdsPermissionConsent
          selectedScopes={selectedScopes}
          onChange={setSelectedScopes}
          disabled={connecting}
        />

        {errorMessage ? (
          <p
            role="alert"
            className="mt-4 m-0 flex items-start gap-2 rounded-xl bg-[#fff8f8] px-3 py-2.5 text-[13px] text-[#b32d2e]"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {errorMessage}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => void handleConnect()}
          disabled={connecting || selectedScopes.length === 0}
          className="mt-5 flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-[#1877F2] text-[16px] font-bold text-white transition hover:bg-[#166fe5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2]/40 disabled:cursor-not-allowed disabled:bg-[#e4e6eb] disabled:text-[#bcc0c4]"
        >
            {connecting ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden />
                Connecting Meta account…
              </>
            ) : (
              <>
                <MetaLogo className="size-5 text-white" monochrome />
                Connect with Meta
              </>
            )}
        </button>

        <Link
          href={integrationsHref}
          className="mt-4 flex items-center justify-center gap-1.5 text-[14px] font-semibold text-[#1877F2] no-underline hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to Integrations
        </Link>
      </div>
    </main>
  );
}

export default function FacebookConnectPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-[#f0f2f5]">
          <Loader2 className="size-6 animate-spin text-[#1877F2]" aria-hidden />
        </main>
      }
    >
      <FacebookConnectInner />
    </Suspense>
  );
}
