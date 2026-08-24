"use client";

import type { ReactNode } from "react";
import {
  BarChart3,
  Check,
  Copy,
  ExternalLink,
  Globe,
  Link2,
  MousePointerClick,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
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
  landingPreviewUrl: string;
  copyDone: boolean;
  onClose: () => void;
  onCopy: () => void;
};

const stagger = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 + i * 0.06, duration: 0.35, ease: automationEase },
  }),
};

export function FunnelTrackingLinkDialog({
  campaignTitle,
  funnelLive,
  landingTrackingUrl,
  landingPreviewUrl,
  copyDone,
  onClose,
  onCopy,
}: FunnelTrackingLinkDialogProps) {
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tracking-link-dialog-title"
      className="relative z-10 flex max-h-[min(88vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      initial={{ opacity: 0, scale: 0.94, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 16 }}
      transition={{ duration: 0.35, ease: automationEase }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative shrink-0 border-b border-slate-100 bg-white">
        <div className="relative px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5">
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg border border-transparent p-1.5 text-slate-400 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700 sm:right-4 sm:top-4"
          >
            <X className="size-4" strokeWidth={2} aria-hidden />
          </button>

          <div className="flex items-start gap-3 pr-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.4, ease: automationEase }}
              className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#1877f2] text-white shadow-sm"
            >
              <Link2 className="size-5" strokeWidth={2.25} aria-hidden />
              <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                <Check className="size-2.5" strokeWidth={3} aria-hidden />
              </span>
            </motion.div>

            <div className="min-w-0 flex-1">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                <Sparkles className="size-3 text-[#1877f2]" aria-hidden />
                Ad tracking link
              </p>
              <h2
                id="tracking-link-dialog-title"
                className="mt-2 text-lg font-bold tracking-tight text-slate-900"
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

          <motion.div
            custom={0}
            initial="hidden"
            animate="show"
            variants={stagger}
            className="mt-4 flex gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1877f2] text-white">
              <Sparkles className="size-3.5" strokeWidth={2} aria-hidden />
            </span>
            <div>
              <p className="text-[13px] font-bold text-slate-900">Why use this link?</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-slate-600">
                Click IDs tie ad clicks to signup, checkout, and purchase events.
                Your event tables only store visits that came from ads.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-4 sm:px-5 sm:py-5">
        <motion.div
          custom={1}
          initial="hidden"
          animate="show"
          variants={stagger}
          className="rounded-xl border border-slate-200 bg-white p-3"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#1877f2]/10 text-[#1877f2]">
              <Sparkles className="size-4" strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
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
                  ? "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/25"
                  : "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/25"
              }`}
            >
              {funnelLive ? (
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
              ) : null}
              {funnelLive ? "Funnel live" : "Save funnel first"}
            </span>
          </div>
        </motion.div>

        <motion.div
          custom={2}
          initial="hidden"
          animate="show"
          variants={stagger}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div className="border-b border-slate-100 bg-slate-50 px-3 py-2.5 sm:px-4">
            <label
              htmlFor="tracking-landing-url"
              className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400"
            >
              Landing URL
            </label>
          </div>
          <div className="px-3 py-3 sm:px-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <input
                id="tracking-landing-url"
                readOnly
                value={landingTrackingUrl}
                className="w-full cursor-text select-all break-all border-0 bg-transparent font-mono text-[12px] leading-relaxed text-slate-800 outline-none sm:text-[13px]"
              />
            </div>
          </div>
          <div className="flex justify-center border-t border-slate-100 bg-white px-3 py-3 sm:px-4">
            <motion.button
              type="button"
              onClick={onCopy}
              whileTap={{ scale: 0.98 }}
              className={`relative inline-flex w-auto items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${
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
            </motion.button>
          </div>
        </motion.div>

        <motion.div custom={3} initial="hidden" animate="show" variants={stagger}>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Where to use this link
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <PlatformCard
              name="Meta Ads"
              accent="meta"
              description="Website destination in Meta Ads Manager"
              logo={<MetaLogo className="size-5" />}
            />
            <PlatformCard
              name="Google Ads"
              accent="google"
              description="Final URL in your Google ad"
              logo={<GoogleAdsLogo className="size-5" />}
            />
          </div>
        </motion.div>

        <motion.div custom={4} initial="hidden" animate="show" variants={stagger}>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            How it works
          </p>
          <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
            <div className="grid gap-2 sm:grid-cols-4 sm:gap-1.5">
              <FlowStep
                step={1}
                icon={MousePointerClick}
                title="Click"
                body="Ad click"
                detail="fbclid / gclid added"
                tint="blue"
              />
              <FlowStep
                step={2}
                icon={Globe}
                title="Land"
                body="Funnel opens"
                detail="Tags load"
                tint="violet"
              />
              <FlowStep
                step={3}
                icon={Zap}
                title="Action"
                body="Signup or pay"
                detail="Conversion step"
                tint="amber"
              />
              <FlowStep
                step={4}
                icon={BarChart3}
                title="Track"
                body="Event saved"
                detail="Ad visits only"
                tint="emerald"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          custom={5}
          initial="hidden"
          animate="show"
          variants={stagger}
          className="flex gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
            <Link2 className="size-3.5" strokeWidth={2.25} aria-hidden />
          </span>
          <p className="text-[13px] leading-relaxed text-emerald-950">
            <span className="font-semibold">Organic traffic is ignored.</span> Only
            Meta ad clicks (<span className="font-medium">fbclid</span>) and Google
            ad clicks (<span className="font-medium">gclid</span>) are written to
            your event tables.
          </p>
        </motion.div>
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-w-28 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Done
          </button>
          {landingPreviewUrl ? (
            <Link
              href={landingPreviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-28 items-center justify-center gap-2 rounded-lg bg-[#1877f2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#166fe0]"
            >
              <ExternalLink className="size-4" strokeWidth={2} aria-hidden />
              Open preview
            </Link>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

function PlatformCard({
  name,
  accent,
  description,
  logo,
}: {
  name: string;
  accent: "meta" | "google";
  description: string;
  logo: ReactNode;
}) {
  const isMeta = accent === "meta";
  return (
    <div
      className={`rounded-xl border p-3 ${
        isMeta
          ? "border-[#1877f2]/20 bg-[#1877f2]/5"
          : "border-emerald-200 bg-emerald-50"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex size-8 items-center justify-center rounded-lg bg-white ring-1 ${
            isMeta ? "ring-[#1877f2]/15" : "ring-emerald-500/15"
          }`}
        >
          {logo}
        </span>
        <p
          className={`text-[13px] font-bold ${isMeta ? "text-[#1877f2]" : "text-emerald-700"}`}
        >
          {name}
        </p>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{description}</p>
    </div>
  );
}

function FlowStep({
  step,
  icon: Icon,
  title,
  body,
  detail,
  tint,
}: {
  step: number;
  icon: typeof MousePointerClick;
  title: string;
  body: string;
  detail: string;
  tint: "blue" | "violet" | "amber" | "emerald";
}) {
  const tintClass = {
    blue: "bg-[#1877f2]/10 text-[#1877f2]",
    violet: "bg-violet-100 text-violet-600",
    amber: "bg-amber-100 text-amber-600",
    emerald: "bg-emerald-100 text-emerald-600",
  }[tint];

  return (
    <div className="relative text-center">
      <span className="mb-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
        {step}
      </span>
      <span
        className={`mx-auto flex size-9 items-center justify-center rounded-lg ${tintClass}`}
      >
        <Icon className="size-4" strokeWidth={2} aria-hidden />
      </span>
      <p className="mt-2 text-xs font-bold text-slate-900">{title}</p>
      <p className="mt-0.5 text-[11px] font-medium text-slate-600">{body}</p>
      <p className="mt-0.5 text-[10px] text-slate-400">{detail}</p>
    </div>
  );
}
