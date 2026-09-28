"use client";

/**
 * Modal shown before Google Ads OAuth from Settings → Integrations.
 * What: displays Google permission wording, then Continue opens Google login.
 * Why: match Meta connect UX so users see “See, edit, create, and delete…” first.
 * Related: BusinessIntegrationsPanel, GoogleAdsPermissionConsent
 * MCP context 7: accessible dialog, escape to close when not connecting.
 */

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
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        onClick={() => {
          if (!connecting) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="google-connect-permissions-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-none flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_20px_50px_rgba(15,23,42,0.22)] sm:max-h-[90vh] sm:max-w-[640px] sm:rounded-2xl md:max-w-[720px] lg:max-w-[760px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#EEF2F7] px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#E6F4EA] sm:size-10">
                <GoogleAdsLogo className="size-4 sm:size-5" />
              </span>
              <h2
                id="google-connect-permissions-title"
                className="m-0 text-[17px] font-bold tracking-tight text-slate-900 sm:text-[18px]"
              >
                Connect Google Ads
              </h2>
            </div>
            <p className="m-0 mt-1.5 text-[13px] leading-relaxed text-slate-500 sm:text-[14px]">
              Connect your Google Ads account to manage campaigns and view
              advertising performance in Dealioo.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={connecting}
            onClick={onClose}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed sm:size-8"
          >
            <X className="size-4" strokeWidth={2.25} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          <GoogleAdsPermissionConsent variant="compact" disabled={connecting} />
          {error ? (
            <p
              role="alert"
              className="mt-3 m-0 flex items-start gap-2 text-[12px] text-red-600 sm:text-[13px]"
            >
              <AlertCircle className="mt-px size-3.5 shrink-0" />
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#EEF2F7] bg-[#F8FAFC] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-end sm:gap-2.5 sm:px-6 sm:py-4">
          <button
            type="button"
            disabled={connecting}
            onClick={onClose}
            className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:h-9 sm:w-auto sm:rounded-lg sm:px-3.5 sm:text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={connecting}
            onClick={onContinue}
            className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#34A853] px-4 text-sm font-semibold text-white transition hover:bg-[#2d8e47] disabled:cursor-not-allowed disabled:opacity-60 sm:h-9 sm:w-auto sm:rounded-lg sm:text-xs"
          >
            {connecting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                <GoogleAdsLogo className="size-3.5" />
                Continue with Google
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
