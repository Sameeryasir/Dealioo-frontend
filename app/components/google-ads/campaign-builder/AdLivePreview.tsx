"use client";

import {
  CTA_OPTIONS,
  type AdCreativeDraft,
} from "@/app/components/google-ads/campaign-builder/types";

type AdLivePreviewProps = {
  ad: AdCreativeDraft;
  businessName?: string;
};

function displayDestinationUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "Add a destination URL";
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
    const search = parsed.search || "";
    return `${host}${path}${search}`;
  } catch {
    return trimmed.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  }
}

export function AdLivePreview({ ad, businessName }: AdLivePreviewProps) {
  const headlines = ad.headlines.map((h) => h.trim()).filter(Boolean);
  const descriptions = ad.descriptions.map((d) => d.trim()).filter(Boolean);
  const title =
    headlines.slice(0, 3).join(" | ") || "Your headline will appear here";
  const description =
    descriptions[0] || "Your description will appear here as customers see it.";
  const cta =
    CTA_OPTIONS.find((c) => c.id === ad.callToAction)?.label ?? "Learn More";
  const destinationDisplay = displayDestinationUrl(ad.finalUrl);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
      <div className="border-b border-[#e8edf5] bg-gradient-to-r from-[#f4f8ff] to-white px-4 py-3">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#4285F4]">
          Google ad preview
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          How customers may see your ad
        </p>
      </div>
      <div className="space-y-2 p-5">
        <p className="text-xs text-slate-500">Sponsored</p>
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-[#f1f3f4] text-[10px] font-bold text-slate-600">
            {(businessName?.trim() || "B").slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[#07111f]">
              {businessName?.trim() || "Your business"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {destinationDisplay}
            </p>
          </div>
        </div>
        <p className="text-lg font-medium leading-snug text-[#1a0dab]">
          {title}
        </p>
        <p className="text-sm leading-relaxed text-slate-600">{description}</p>
        <p className="pt-1 text-xs font-semibold text-[#4285F4]">{cta}</p>
      </div>
    </div>
  );
}
