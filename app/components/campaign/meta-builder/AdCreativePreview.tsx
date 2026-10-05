"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { AdSetPlacements } from "@/app/lib/meta-campaign-builder-types";

export type MetaPreviewPlacement =
  | "facebook_feed"
  | "instagram_feed"
  | "stories"
  | "reels";

type AdCreativePreviewProps = {
  placement: MetaPreviewPlacement;
  primaryText: string;
  headline: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  displayLink?: string;
  callToAction?: string;
  pageName?: string;
};

const TAB_LABELS: Record<MetaPreviewPlacement, string> = {
  facebook_feed: "Feed",
  instagram_feed: "Instagram",
  stories: "Story",
  reels: "Reels",
};

function formatCta(label?: string): string {
  if (!label) return "Learn more";
  return label
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function PreviewMedia({
  imageUrl,
  videoUrl,
  className,
}: {
  imageUrl?: string;
  videoUrl?: string;
  className: string;
}) {
  if (videoUrl?.trim()) {
    return (
      <video
        src={videoUrl}
        poster={imageUrl?.trim() || undefined}
        muted
        playsInline
        loop
        autoPlay
        preload="metadata"
        className={className}
      />
    );
  }

  if (imageUrl?.trim()) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt="" className={className} />;
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-[#1877f2] to-[#0a2540] text-xs font-semibold text-white/80 ${className}`}
    >
      Add media
    </div>
  );
}

function PhoneShell({
  dark,
  children,
}: {
  dark?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-[232px]">
      <div className="rounded-[1.85rem] border-[7px] border-[#1c1c1e] bg-[#1c1c1e] shadow-[0_18px_40px_rgba(15,23,42,0.28)]">
        <div
          className={`relative aspect-[9/19] overflow-hidden rounded-[1.35rem] ${
            dark ? "bg-black" : "bg-white"
          }`}
        >
          <div className="pointer-events-none absolute left-1/2 top-1.5 z-30 h-3.5 w-[4.25rem] -translate-x-1/2 rounded-full bg-[#1c1c1e]" />
          {children}
        </div>
      </div>
    </div>
  );
}

function PageAvatar({ name }: { name?: string }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#1877f2] text-[10px] font-bold text-white">
      {(name?.trim() || "P").slice(0, 1).toUpperCase()}
    </span>
  );
}

export function resolveMetaPreviewTabs(
  placements?: AdSetPlacements | null,
): MetaPreviewPlacement[] {
  const advantage = !placements || placements.advantagePlusPlacements;
  const ig = advantage || Boolean(placements?.publisherPlatforms.instagram);
  const fb = advantage || Boolean(placements?.publisherPlatforms.facebook);
  const tabs: MetaPreviewPlacement[] = [];

  if (advantage || (fb && (placements?.facebookPositions.feed ?? true))) {
    tabs.push("facebook_feed");
  }
  if (ig && (advantage || placements?.instagramPositions.stream !== false)) {
    tabs.push("instagram_feed");
  }
  if (
    advantage ||
    (fb && placements?.facebookPositions.story) ||
    (ig && placements?.instagramPositions.story)
  ) {
    tabs.push("stories");
  }
  if (
    advantage ||
    (fb && placements?.facebookPositions.reels) ||
    (ig && placements?.instagramPositions.reels)
  ) {
    tabs.push("reels");
  }

  return tabs.length > 0 ? tabs : ["facebook_feed"];
}

export function AdCreativePreview({
  placement,
  primaryText,
  headline,
  description,
  imageUrl,
  videoUrl,
  displayLink,
  callToAction,
  pageName,
}: AdCreativePreviewProps) {
  const cta = formatCta(callToAction);
  const brand = pageName?.trim() || "Your Page";
  const isStory = placement === "stories";
  const isReels = placement === "reels";
  const isIg = placement === "instagram_feed";

  if (isStory || isReels) {
    return (
      <div>
        <p className="mb-2 text-center text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#1877f2]">
          {TAB_LABELS[placement]}
        </p>
        <PhoneShell dark>
          <PreviewMedia
            imageUrl={imageUrl}
            videoUrl={videoUrl}
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/55 to-transparent px-3 pb-8 pt-6">
            <div className="mb-2 flex gap-1">
              <span className="h-0.5 flex-1 rounded-full bg-white" />
              <span className="h-0.5 flex-1 rounded-full bg-white/30" />
              <span className="h-0.5 flex-1 rounded-full bg-white/30" />
            </div>
            <div className="flex items-center gap-2">
              <PageAvatar name={brand} />
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-white">
                  {brand}
                </p>
                <p className="text-[9px] text-white/70">Sponsored</p>
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-4 pt-10">
            <p className="text-[11px] font-semibold leading-snug text-white line-clamp-2">
              {headline || "Headline"}
            </p>
            <p className="mt-1 text-[10px] leading-snug text-white/85 line-clamp-2">
              {primaryText || "Primary text"}
            </p>
            <button
              type="button"
              className={`mt-2 w-full rounded-lg py-1.5 text-[11px] font-bold ${
                isReels
                  ? "bg-white text-[#07111f]"
                  : "bg-[#1877f2] text-white"
              }`}
            >
              {cta}
            </button>
          </div>
        </PhoneShell>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-center text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#1877f2]">
        {isIg ? "Instagram Feed" : "Facebook Feed"}
      </p>
      <PhoneShell>
        <div className="flex h-full flex-col bg-white pt-6">
          <div className="flex items-center gap-2 px-2.5 py-2">
            <PageAvatar name={brand} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-[#07111f]">
                {brand}
              </p>
              <p className="text-[9px] text-slate-400">Sponsored</p>
            </div>
            <span className="text-slate-400">···</span>
          </div>
          <p className="px-2.5 pb-2 text-[11px] leading-snug text-[#07111f] line-clamp-3">
            {primaryText || "Primary text"}
          </p>
          <div className="relative min-h-0 flex-1 bg-slate-100">
            <PreviewMedia
              imageUrl={imageUrl}
              videoUrl={videoUrl}
              className="absolute inset-0 size-full object-cover"
            />
          </div>
          <div className="border-t border-[#eef2f7] px-2.5 py-2">
            {displayLink ? (
              <p className="text-[9px] uppercase tracking-wide text-slate-400 line-clamp-1">
                {displayLink}
              </p>
            ) : null}
            <p className="text-[11px] font-semibold text-[#07111f] line-clamp-1">
              {headline || "Headline"}
            </p>
            {description ? (
              <p className="text-[10px] text-slate-500 line-clamp-1">
                {description}
              </p>
            ) : null}
            <button
              type="button"
              className={`mt-1.5 w-full rounded-md py-1 text-[10px] font-bold ${
                isIg
                  ? "bg-[#0095f6] text-white"
                  : "bg-[#e7f3ff] text-[#1877f2]"
              }`}
            >
              {cta}
            </button>
          </div>
        </div>
      </PhoneShell>
    </div>
  );
}

export function MetaAdPreviewPanel({
  placements,
  primaryText,
  headline,
  description,
  imageUrl,
  videoUrl,
  displayLink,
  callToAction,
  pageName,
}: {
  placements?: AdSetPlacements | null;
  primaryText: string;
  headline: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  displayLink?: string;
  callToAction?: string;
  pageName?: string;
}) {
  const tabs = useMemo(() => resolveMetaPreviewTabs(placements), [placements]);
  const [active, setActive] = useState<MetaPreviewPlacement>(tabs[0]);
  const placement = tabs.includes(active) ? active : tabs[0];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-center gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(tab)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
              placement === tab
                ? "bg-[#1877f2] text-white"
                : "bg-[#f4f8ff] text-[#1877f2] hover:bg-[#e8f2ff]"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>
      <AdCreativePreview
        placement={placement}
        primaryText={primaryText}
        headline={headline}
        description={description}
        imageUrl={imageUrl}
        videoUrl={videoUrl}
        displayLink={displayLink}
        callToAction={callToAction}
        pageName={pageName}
      />
    </div>
  );
}
