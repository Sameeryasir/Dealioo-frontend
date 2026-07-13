"use client";

type AdCreativePreviewProps = {
  placement: "facebook_feed" | "instagram_feed" | "stories" | "reels";
  primaryText: string;
  headline: string;
  description?: string;
  imageUrl?: string;
  displayLink?: string;
  callToAction?: string;
};

const PLACEMENT_LABELS: Record<AdCreativePreviewProps["placement"], string> = {
  facebook_feed: "Facebook Feed",
  instagram_feed: "Instagram Feed",
  stories: "Stories",
  reels: "Reels",
};

function formatCta(label?: string): string {
  if (!label) return "Learn more";
  return label.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function AdCreativePreview({
  placement,
  primaryText,
  headline,
  description,
  imageUrl,
  displayLink,
  callToAction,
}: AdCreativePreviewProps) {
  const isStory = placement === "stories" || placement === "reels";
  const isReels = placement === "reels";

  return (
    <div className="rounded-xl border border-[#e8edf5] bg-white p-3 shadow-[0_4px_14px_rgba(24,119,242,0.08)]">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[#1877f2]">
        {PLACEMENT_LABELS[placement]}
      </p>
      <div
        className={`overflow-hidden rounded-lg bg-[#f4f8ff] ${
          isStory ? "aspect-[9/16] max-h-48" : ""
        }`}
      >
        {isStory ? (
          <div className="relative flex h-full min-h-[12rem] flex-col justify-end overflow-hidden bg-[#07111f] p-3">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-[#1877f2]/70 to-[#07111f]" />
            )}
            <div className="relative z-10 space-y-1 text-white drop-shadow">
              <p className="text-xs font-semibold line-clamp-2">
                {headline || "Headline"}
              </p>
              <p className="text-[10px] opacity-90 line-clamp-2">
                {primaryText || "Primary text"}
              </p>
              {isReels ? (
                <span className="inline-block rounded bg-[#1877f2] px-2 py-0.5 text-[10px] font-semibold">
                  {formatCta(callToAction)}
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="p-3">
            <p className="text-xs text-slate-600 line-clamp-2">
              {primaryText || "Primary text"}
            </p>
            <div className="mt-2 overflow-hidden rounded-lg border border-[#e8edf5] bg-white">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt=""
                  className="max-h-24 w-full object-cover"
                />
              ) : (
                <div className="flex h-20 items-center justify-center bg-[#e8f2ff] text-xs text-[#1877f2]">
                  Media preview
                </div>
              )}
              <div className="space-y-0.5 p-2">
                {displayLink ? (
                  <p className="text-[10px] uppercase text-slate-500 line-clamp-1">
                    {displayLink}
                  </p>
                ) : null}
                <p className="text-xs font-semibold text-[#07111f] line-clamp-1">
                  {headline || "Headline"}
                </p>
                {description ? (
                  <p className="text-[10px] text-slate-500 line-clamp-2">
                    {description}
                  </p>
                ) : null}
                <button
                  type="button"
                  className="mt-1 w-full rounded bg-[#e8f2ff] py-1 text-[10px] font-semibold text-[#1877f2]"
                >
                  {formatCta(callToAction)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
