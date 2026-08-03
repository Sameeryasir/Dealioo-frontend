"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { MetaAdsPermissionConsent } from "@/app/components/facebook/MetaAdsPermissionConsent";
import { readBusinessIdFromSearchParams } from "@/app/lib/business-id-params";
import { connectFacebookInPopup } from "@/app/lib/facebook-oauth-popup";
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
          throw new Error("You're signed out. Sign in again to connect Facebook.");
        }
        const status = await getFacebookConnectionStatus(token, businessId);
        if (!cancelled) setConnection(status);
      } catch (error) {
        if (!cancelled) {
          setConnection(null);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Could not check Facebook connection.",
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
        throw new Error("You're signed out. Sign in again to connect Facebook.");
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

      setErrorMessage(
        "Facebook connect was cancelled. You can try again or go back.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not connect Facebook. Try again.",
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
            Open Connect with Facebook from your business Integrations page.
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
          Checking Facebook connection…
        </div>
      </main>
    );
  }

  const isConnected = Boolean(connection?.connected);
  const grantedScopes = connection?.metaOauthScopes ?? [];
  const adAccountId = connection?.metaAdAccountId?.trim() || null;

  if (isConnected) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[#f0f2f5] px-4 py-12">
        <div className="w-full max-w-lg overflow-hidden rounded-xl border border-[#ccd0d5] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          <div className="border-b border-[#e4e6eb] bg-[#1877F2] px-6 py-5 text-center text-white">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white text-[#1877F2] shadow-sm">
              <FacebookLogoMark className="size-7" />
            </span>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/85">
              Connected with Facebook
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight">
              Meta Ads is already connected
            </h1>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800">
              <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check className="size-3" strokeWidth={3} aria-hidden />
              </span>
              Account connected
            </div>

            {adAccountId ? (
              <p className="m-0 text-center text-xs text-[#65676b]">
                Ad account{" "}
                <span className="font-mono font-semibold text-slate-800">
                  {adAccountId}
                </span>
              </p>
            ) : (
              <p className="m-0 text-center text-sm text-[#65676b]">
                Facebook is linked. Next, choose which ad account Dealioo should
                use.
              </p>
            )}

            {grantedScopes.length > 0 ? (
              <div>
                <p className="m-0 text-[11px] font-bold uppercase tracking-[0.12em] text-[#65676b]">
                  Granted permissions
                </p>
                <ul className="mt-2.5 divide-y divide-[#e4e6eb] overflow-hidden rounded-lg border border-[#e4e6eb] bg-[#f7f8fa]">
                  {grantedScopes.map((scopeId) => (
                    <li
                      key={scopeId}
                      className="flex items-start gap-3 bg-white px-3.5 py-3"
                    >
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#e7f3ff] text-[#1877F2]">
                        <Check className="size-3" strokeWidth={3} aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="m-0 text-sm font-semibold text-[#050505]">
                          {formatMetaScopeTitle(scopeId)}
                        </p>
                        <p className="m-0 mt-0.5 font-mono text-[11px] text-[#65676b]">
                          {scopeId}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {!adAccountId ? (
              <Link
                href={selectAdAccountHref}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1877F2] text-sm font-semibold text-white no-underline"
              >
                Select Meta Ad Account
              </Link>
            ) : null}

            <Link
              href={integrationsHref}
              className="flex h-11 w-full items-center justify-center rounded-lg border border-[#ccd0d5] bg-white text-sm font-semibold text-slate-800 no-underline"
            >
              Back to Integrations
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#f0f2f5] px-4 py-12">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-[#ccd0d5] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <div className="border-b border-[#e4e6eb] bg-[#1877F2] px-6 py-5 text-center text-white">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white text-[#1877F2] shadow-sm">
            <FacebookLogoMark className="size-7" />
          </span>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/85">
            Facebook / Meta Ads
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight">
            Connect Meta Ads
          </h1>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="m-0 text-center text-sm leading-relaxed text-[#65676b]">
            Choose the permissions Dealioo needs, then connect with Facebook.
          </p>

          <MetaAdsPermissionConsent
            selectedScopes={selectedScopes}
            onChange={setSelectedScopes}
            disabled={connecting}
          />

          {errorMessage ? (
            <p
              role="alert"
              className="m-0 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
            >
              <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
              {errorMessage}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void handleConnect()}
            disabled={connecting}
            className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1877F2] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {connecting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Connecting…
              </>
            ) : (
              "Connect with Facebook"
            )}
          </button>

          <Link
            href={integrationsHref}
            className="block text-center text-sm font-medium text-[#65676b] no-underline hover:text-[#1877F2]"
          >
            Back to Integrations
          </Link>
        </div>
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
