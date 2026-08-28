"use client";

import { useEffect } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
import { MetaAdsPermissionConsent } from "@/app/components/facebook/MetaAdsPermissionConsent";
import { MetaLogo } from "@/app/components/landing/LandingIntegrationLogos";
import type { MetaSelectableScopeId } from "@/app/lib/meta-ads-permissions";

type MetaConnectPermissionsModalProps = {
  open: boolean;
  selectedScopes: MetaSelectableScopeId[];
  onChangeScopes: (scopes: MetaSelectableScopeId[]) => void;
  connecting: boolean;
  error: string | null;
  onClose: () => void;
  onContinue: () => void;
};

export function MetaConnectPermissionsModal({
  open,
  selectedScopes,
  onChangeScopes,
  connecting,
  error,
  onClose,
  onContinue,
}: MetaConnectPermissionsModalProps) {
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
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
        aria-labelledby="meta-connect-permissions-title"
        className="relative z-10 w-full max-w-[440px] overflow-hidden rounded-2xl bg-white shadow-[0_20px_50px_rgba(15,23,42,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#EEF2F7] px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#E8F1FF]">
                <MetaLogo className="size-4 text-[#1877F2]" monochrome />
              </span>
              <h2
                id="meta-connect-permissions-title"
                className="m-0 text-[16px] font-bold tracking-tight text-slate-900"
              >
                Connect Meta Ads
              </h2>
            </div>
            <p className="m-0 mt-1.5 text-[13px] leading-snug text-slate-500">
              Choose which permissions Dealioo can use, then continue. Meta login
              opens in a new tab.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={connecting}
            onClick={onClose}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
          >
            <X className="size-4" strokeWidth={2.25} />
          </button>
        </div>

        <div className="px-5 py-4">
          <MetaAdsPermissionConsent
            variant="compact"
            selectedScopes={selectedScopes}
            onChange={onChangeScopes}
            disabled={connecting}
          />
          {error ? (
            <p
              role="alert"
              className="mt-3 m-0 flex items-start gap-2 text-[12px] text-red-600"
            >
              <AlertCircle className="mt-px size-3.5 shrink-0" />
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#EEF2F7] bg-[#F8FAFC] px-5 py-3.5">
          <button
            type="button"
            disabled={connecting}
            onClick={onClose}
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={connecting}
            onClick={onContinue}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1877F2] px-4 text-xs font-semibold text-white transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {connecting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                <MetaLogo className="size-3.5 text-white" monochrome />
                Continue with Meta
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
