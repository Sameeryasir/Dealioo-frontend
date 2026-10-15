"use client";

import {
  Check,
  Copy,
  ExternalLink,
  Link2,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  GoogleAdsLogo,
  MetaLogo,
} from "@/app/components/landing/LandingIntegrationLogos";
import { automationEase } from "@/app/lib/motion";

type FunnelTrackingLinkDialogProps = {
  campaignTitle: string;
  funnelLive: boolean;
  landingTrackingUrl: string;
  funnelId?: number | null;
  copyDone: boolean;
  onClose: () => void;
  onCopy: () => void;
};

export function FunnelTrackingLinkDialog({
  campaignTitle,
  funnelLive,
  landingTrackingUrl,
  funnelId,
  copyDone,
  onClose,
  onCopy,
}: FunnelTrackingLinkDialogProps) {
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tracking-link-dialog-title"
      className="relative z-10 flex max-h-[min(88vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      initial={{ opacity: 0, scale: 0.94, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 16 }}
      transition={{ duration: 0.35, ease: automationEase }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative bg-white px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 sm:right-4 sm:top-4"
        >
          <X className="size-4" strokeWidth={2} aria-hidden />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <span className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#1877f2] text-white">
            <Link2 className="size-5" strokeWidth={2.25} aria-hidden />
            <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
              <Check className="size-2.5" strokeWidth={3} aria-hidden />
            </span>
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Ad tracking link
            </p>
            <h2
              id="tracking-link-dialog-title"
              className="mt-1 text-lg font-bold tracking-tight text-slate-900"
            >
              Your tracking link is ready!
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">
              Paste into Meta or Google Ads.{" "}
              <span className="font-semibold text-slate-800">businessId</span>{" "}
              loads your pixels —{" "}
              <span className="font-semibold text-[#1877f2]">fbclid</span> /{" "}
              <span className="font-semibold text-emerald-600">gclid</span>{" "}
              arrive on ad clicks.
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-white px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Campaign
            </p>
            <p className="mt-0.5 truncate text-sm font-bold text-slate-900">
              {campaignTitle}
            </p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${
              funnelLive
                ? "bg-emerald-500/10 text-emerald-700"
                : "bg-amber-500/10 text-amber-700"
            }`}
          >
            {funnelLive ? (
              <span className="size-2 rounded-full bg-emerald-500" />
            ) : null}
            {funnelLive ? "Funnel live" : "Save funnel first"}
          </span>
        </div>

        <button
          type="button"
          onClick={onCopy}
          aria-label={
            copyDone
              ? "Tracking link copied"
              : `Copy tracking link for ${campaignTitle}`
          }
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${
            copyDone
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-[#1877f2] hover:bg-[#166fe0]"
          }`}
        >
          {copyDone ? (
            <>
              <Check className="size-4" strokeWidth={2.5} aria-hidden />
              Copied to clipboard
            </>
          ) : (
            <>
              <Copy className="size-4" strokeWidth={2} aria-hidden />
              Copy tracking link
            </>
          )}
        </button>

        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Where to use this link
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2">
              <MetaLogo className="size-4" />
              Meta Ads — website destination
            </span>
            <span className="inline-flex items-center gap-2">
              <GoogleAdsLogo className="size-4" />
              Google Ads — final URL
            </span>
          </div>
        </div>
      </div>

      <div className="shrink-0 bg-white px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-w-28 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Done
          </button>
          {funnelId != null && funnelId > 0 ? (
            <button
              type="button"
              onClick={() => {
                void import("@/app/lib/funnel-public-path").then(
                  ({ openFunnelDesignPreview }) =>
                    openFunnelDesignPreview(funnelId, "landing"),
                );
              }}
              className="inline-flex min-w-28 items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#166fe0]"
            >
              <ExternalLink className="size-4" strokeWidth={2} aria-hidden />
              Open preview
            </button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
