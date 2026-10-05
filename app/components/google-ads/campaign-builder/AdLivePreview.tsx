"use client";

import { useMemo, useState } from "react";
import {
  CTA_OPTIONS,
  type AdCreativeDraft,
  type CampaignTypeId,
} from "@/app/components/google-ads/campaign-builder/types";

type AdLivePreviewProps = {
  ad: AdCreativeDraft;
  businessName?: string;
  logoUrl?: string;
  campaignType?: CampaignTypeId;
};

type PreviewTab = "search" | "display";

type RsaCombo = {
  headlines: string[];
  description: string;
};

function displayHost(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "example.com";
  try {
    return new URL(trimmed).hostname.replace(/^www\./, "");
  } catch {
    return trimmed.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0] || "example.com";
  }
}

function buildDisplayPath(ad: AdCreativeDraft): string {
  const host = displayHost(ad.finalUrl);
  const path1 = ad.path1.trim().replace(/^\/+|\/+$/g, "");
  const path2 = ad.path2.trim().replace(/^\/+|\/+$/g, "");
  if (path1 && path2) return `${host} › ${path1} › ${path2}`;
  if (path1) return `${host} › ${path1}`;
  return host;
}

function buildRsaCombos(ad: AdCreativeDraft): RsaCombo[] {
  const headlines = ad.headlines.map((h) => h.trim()).filter(Boolean);
  const descriptions = ad.descriptions.map((d) => d.trim()).filter(Boolean);
  if (headlines.length === 0 && descriptions.length === 0) {
    return [
      {
        headlines: ["Your headline will appear here", "Second headline"],
        description:
          "Your description will appear here as customers see it on Google Search.",
      },
    ];
  }

  const combos: RsaCombo[] = [];
  const descCount = Math.max(descriptions.length, 1);
  for (let i = 0; i < Math.min(3, Math.max(1, headlines.length)); i += 1) {
    const h1 = headlines[i % headlines.length] || "Headline";
    const h2 =
      headlines[(i + 1) % headlines.length] ||
      headlines[0] ||
      "More about your offer";
    const unique = [...new Set([h1, h2])].slice(0, 2);
    combos.push({
      headlines: unique,
      description:
        descriptions[i % descCount] ||
        "Your description will appear here as customers see it on Google Search.",
    });
  }
  return combos;
}

function GoogleSearchAdCard({
  ad,
  businessName,
  combo,
}: {
  ad: AdCreativeDraft;
  businessName?: string;
  combo: RsaCombo;
}) {
  const brand = businessName?.trim() || "Your business";
  const pathLine = buildDisplayPath(ad);
  const title = combo.headlines.join(" | ");
  const cta =
    CTA_OPTIONS.find((c) => c.id === ad.callToAction)?.label ?? null;

  return (
    <div className="rounded-xl border border-[#dadce0] bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#f1f3f4] text-[10px] font-semibold text-[#5f6368]">
          {brand.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] leading-5 text-[#202124]">
            {brand}
          </p>
          <p className="truncate text-[12px] leading-4 text-[#4d5156]">
            {pathLine}
          </p>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-none text-[#70757a]">Sponsored</p>
      <a
        href={ad.finalUrl.trim() || undefined}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 block text-[16px] font-normal leading-6 text-[#1a0dab] hover:underline line-clamp-2"
        onClick={(e) => {
          if (!ad.finalUrl.trim()) e.preventDefault();
        }}
      >
        {title}
      </a>
      <p className="mt-2 text-[13px] leading-5 text-[#4d5156] line-clamp-2">
        {combo.description}
      </p>
      {cta ? (
        <p className="mt-3 text-[13px] font-medium text-[#1a73e8]">{cta}</p>
      ) : null}
    </div>
  );
}

function SearchPreview({
  ad,
  businessName,
}: {
  ad: AdCreativeDraft;
  businessName?: string;
}) {
  const headlineKey = ad.headlines.join("|");
  const descriptionKey = ad.descriptions.join("|");
  const combos = useMemo(() => buildRsaCombos(ad), [ad]);
  const [comboIndex, setComboIndex] = useState(0);
  const [copyKey, setCopyKey] = useState(`${headlineKey}::${descriptionKey}`);
  const nextCopyKey = `${headlineKey}::${descriptionKey}`;
  if (copyKey !== nextCopyKey) {
    setCopyKey(nextCopyKey);
    setComboIndex(0);
  }

  const safeIndex =
    combos.length === 0 ? 0 : Math.min(comboIndex, combos.length - 1);
  const combo = combos[safeIndex] ?? combos[0];

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Google Search · how it may look
      </p>
      <GoogleSearchAdCard ad={ad} businessName={businessName} combo={combo} />
      {combos.length > 1 ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-slate-500">
            RSA combo {safeIndex + 1} of {combos.length}
          </p>
          <button
            type="button"
            onClick={() =>
              setComboIndex((prev) => (prev + 1) % combos.length)
            }
            className="rounded-full bg-[#f4f8ff] px-3 py-1 text-[11px] font-semibold text-[#1a73e8] hover:bg-[#e8f0fe]"
          >
            Next combination
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DisplayPreview({
  ad,
  businessName,
  logoUrl,
  campaignType,
}: {
  ad: AdCreativeDraft;
  businessName?: string;
  logoUrl?: string;
  campaignType?: CampaignTypeId;
}) {
  const headline =
    ad.headlines.map((h) => h.trim()).filter(Boolean)[0] || "Your headline";
  const description =
    ad.descriptions.map((d) => d.trim()).filter(Boolean)[0] ||
    "Short supporting line";
  const cta =
    CTA_OPTIONS.find((c) => c.id === ad.callToAction)?.label ?? "Learn More";
  const brand = businessName?.trim() || "Your business";
  const label =
    campaignType === "PERFORMANCE_MAX" ? "Performance Max" : "Display";

  return (
    <div className="overflow-hidden rounded-xl border border-[#dadce0] bg-white">
      <p className="border-b border-[#eef2f7] bg-[#f8fafc] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label} · how it may look
      </p>
      <div className="relative h-36 bg-[#e8f0fe]">
        {logoUrl?.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#4285F4] to-[#34a853]">
            <span className="text-3xl font-bold text-white/90">
              {brand.slice(0, 1).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="space-y-1.5 p-3">
        <div className="flex items-center gap-2">
          {logoUrl?.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="size-7 rounded-md object-cover"
            />
          ) : (
            <span className="flex size-7 items-center justify-center rounded-md bg-[#e8f0fe] text-[10px] font-bold text-[#4285F4]">
              {brand.slice(0, 1).toUpperCase()}
            </span>
          )}
          <p className="truncate text-xs font-semibold text-[#202124]">{brand}</p>
        </div>
        <p className="text-sm font-semibold leading-snug text-[#202124] line-clamp-2">
          {headline}
        </p>
        <p className="text-xs text-[#4d5156] line-clamp-2">{description}</p>
        <button
          type="button"
          className="mt-1 w-full rounded-md bg-[#1a73e8] py-1.5 text-[11px] font-bold text-white"
        >
          {cta}
        </button>
      </div>
    </div>
  );
}

export function AdLivePreview({
  ad,
  businessName,
  logoUrl,
  campaignType = "SEARCH",
}: AdLivePreviewProps) {
  const showDisplay =
    campaignType === "DISPLAY" ||
    campaignType === "PERFORMANCE_MAX" ||
    Boolean(logoUrl?.trim());

  const tabs = useMemo<PreviewTab[]>(() => {
    const next: PreviewTab[] = ["search"];
    if (showDisplay) next.push("display");
    return next;
  }, [showDisplay]);

  const [active, setActive] = useState<PreviewTab>(
    campaignType === "SEARCH" ? "search" : showDisplay ? "display" : "search",
  );
  const tab = tabs.includes(active) ? active : tabs[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
      <div className="border-b border-[#e8edf5] bg-gradient-to-r from-[#f4f8ff] to-white px-4 py-3">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#4285F4]">
          Ad preview
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          Live preview of your Search ad copy.
        </p>
        {tabs.length > 1 ? (
          <div className="mt-3 flex gap-1.5">
            {tabs.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setActive(item)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                  tab === item
                    ? "bg-[#4285F4] text-white"
                    : "bg-[#f4f8ff] text-[#4285F4] hover:bg-[#e8f0fe]"
                }`}
              >
                {item === "search"
                  ? "Search"
                  : campaignType === "PERFORMANCE_MAX"
                    ? "PMax / Display"
                    : "Display"}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="p-4">
        {tab === "display" ? (
          <DisplayPreview
            ad={ad}
            businessName={businessName}
            logoUrl={logoUrl}
            campaignType={campaignType}
          />
        ) : (
          <SearchPreview ad={ad} businessName={businessName} />
        )}
      </div>
    </div>
  );
}
