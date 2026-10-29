"use client";

import { useEffect, useId, useState } from "react";
import { BookOpen, Info, Play, X } from "lucide-react";

const META_PIXEL_HELP_URL =
  "https://www.facebook.com/business/help/952192354843755";
const GOOGLE_ADS_TAG_HELP_URL =
  "https://support.google.com/google-ads/answer/6095821";

function SetupGuideDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-[#07111f]/45 p-0 backdrop-blur-[3px] sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-[#e8edf5] bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.22)] sm:rounded-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#1877f2]">
              Setup guide
            </p>
            <h2
              id={titleId}
              className="mt-1 text-lg font-bold text-[#07111f]"
            >
              Find your tracking IDs
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#07111f]"
            aria-label="Close setup guide"
          >
            <X className="size-4" strokeWidth={2.25} />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-sm leading-relaxed text-slate-600">
          <div>
            <h3 className="font-semibold text-[#07111f]">Meta Pixel ID</h3>
            <ol className="mt-2 list-decimal space-y-1.5 pl-4">
              <li>Open Meta Events Manager.</li>
              <li>Select your Pixel / Dataset.</li>
              <li>Open Settings and copy the Dataset ID (Pixel ID).</li>
              <li>Paste it into the Meta Pixel ID field on this page, then save.</li>
            </ol>
            <a
              href={META_PIXEL_HELP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex text-sm font-semibold text-[#1877f2] hover:underline"
            >
              Meta Pixel setup help
            </a>
          </div>

          <div>
            <h3 className="font-semibold text-[#07111f]">Google Ads tag ID</h3>
            <ol className="mt-2 list-decimal space-y-1.5 pl-4">
              <li>Open Google Ads → Goals → Conversions (or Google tag settings).</li>
              <li>Locate your Google tag / Ads tag ID (format AW-XXXXXXXXX).</li>
              <li>
                Paste the Ads tag ID here — not a GTM- container ID.
              </li>
              <li>Save Tracking IDs so eligible funnels can use it.</li>
            </ol>
            <a
              href={GOOGLE_ADS_TAG_HELP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex text-sm font-semibold text-[#1877f2] hover:underline"
            >
              Google tag setup help
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrackingHelpBanner() {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <>
      <section
        aria-label="Tracking setup help"
        className="flex min-w-0 flex-col gap-4 rounded-2xl border border-[#bfdbfe] bg-gradient-to-r from-[#eff6ff] via-[#f5f9ff] to-[#eaf3ff] p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5 lg:px-6 lg:py-5"
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#1877f2] shadow-sm ring-1 ring-[#bfdbfe]">
            <Info className="size-5" strokeWidth={2.25} aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#07111f] sm:text-base">
              Need help finding your tracking IDs?
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              Follow our step-by-step guides to find and configure your Meta
              Pixel and Google Ads tag ID.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#bfdbfe] bg-white px-3.5 text-sm font-semibold text-[#07111f] shadow-sm transition hover:border-[#93c5fd] hover:bg-[#f8fbff]"
          >
            <BookOpen className="size-4" strokeWidth={2.25} aria-hidden />
            View Setup Guide
          </button>
          <button
            type="button"
            disabled
            title="Video tutorial is not available yet"
            className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#1877f2]/55 px-3.5 text-sm font-semibold text-white opacity-80"
          >
            <Play className="size-4" strokeWidth={2.25} aria-hidden />
            Watch Video Tutorial
          </button>
        </div>
      </section>

      <SetupGuideDialog open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}
