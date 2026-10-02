"use client";

import { useEffect } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
import { GoogleAdsPermissionConsent } from "@/app/components/google-ads/GoogleAdsPermissionConsent";
import { GoogleAdsLogo } from "@/app/components/landing/LandingIntegrationLogos";

type GoogleConnectPermissionsModalProps = {
  open: boolean;
  connecting: boolean;
  error: string | null;
  onClose: () => void;
  onContinue: () => void;
};

export function GoogleConnectPermissionsModal({
  open,
  connecting,
  error,
  onClose,
  onContinue,
}: GoogleConnectPermissionsModalProps) {
  useEffect(() => {
    if (!open || connecting) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, connecting, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4 md:p-6">
      <div
        aria-hidden
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        onClick={() => {
          if (!connecting) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="google-connect-permissions-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-none flex-col overflow-hidden rounded-t-[1.25rem] border border-[#e8edf5] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)] sm:max-h-[88vh] sm:max-w-[42rem] sm:rounded-[1.25rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#eef2f7] px-5 py-5 sm:px-7 sm:py-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3.5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#ceead6] bg-[#f0faf3]">
                <GoogleAdsLogo className="size-5" />
              </span>
              <div className="min-w-0 pt-0.5">
                <h2
                  id="google-connect-permissions-title"
                  className="m-0 text-[1.125rem] font-extrabold tracking-tight text-[#07111f] sm:text-[1.2rem]"
                >
                  Connect Google Ads
                </h2>
                <p className="m-0 mt-1.5 max-w-[34rem] text-[0.875rem] leading-relaxed text-slate-500">
                  Connect your Google Ads account to manage campaigns and view
                  advertising performance in Dealioo.
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={connecting}
            onClick={onClose}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-[#f1f5f9] hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="size-4" strokeWidth={2.25} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
          <GoogleAdsPermissionConsent variant="compact" disabled={connecting} />
          {error ? (
            <p
              role="alert"
              className="mt-4 m-0 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[0.8125rem] leading-relaxed text-red-700"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2.5 border-t border-[#eef2f7] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-7">
          <button
            type="button"
            disabled={connecting}
            onClick={onClose}
            className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-[#e2e8f0] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={connecting}
            onClick={onContinue}
            className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#188038] px-5 text-sm font-semibold text-white transition hover:bg-[#137333] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-auto"
          >
            {connecting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white">
                  <GoogleAdsLogo className="size-3.5" />
                </span>
                Continue with Google
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
