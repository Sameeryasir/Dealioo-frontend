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
    <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
      <p className="mb-2 text-xs font-semibold text-zinc-500">
        {PLACEMENT_LABELS[placement]}
      </p>
      <div
        className={`overflow-hidden rounded-lg bg-zinc-100 ${
          isStory ? "aspect-[9/16] max-h-48" : ""
        }`}
      >
        {isStory ? (
          <div className="relative flex h-full min-h-[12rem] flex-col justify-end overflow-hidden bg-zinc-800 p-3">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-400 to-zinc-600" />
            )}
            <div className="relative z-10 space-y-1 text-white drop-shadow">
              <p className="text-xs font-semibold line-clamp-2">
                {headline || "Headline"}
              </p>
              <p className="text-[10px] opacity-90 line-clamp-2">
                {primaryText || "Primary text"}
              </p>
              {isReels ? (
                <span className="inline-block rounded bg-white/20 px-2 py-0.5 text-[10px]">
                  {formatCta(callToAction)}
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="p-3">
            <p className="text-xs text-zinc-700 line-clamp-2">
              {primaryText || "Primary text"}
            </p>
            <div className="mt-2 overflow-hidden rounded-lg border border-zinc-200 bg-white">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt=""
                  className="max-h-24 w-full object-cover"
                />
              ) : (
                <div className="flex h-20 items-center justify-center bg-zinc-200 text-xs text-zinc-500">
                  Media preview
                </div>
              )}
              <div className="space-y-0.5 p-2">
                {displayLink ? (
                  <p className="text-[10px] uppercase text-zinc-500 line-clamp-1">
                    {displayLink}
                  </p>
                ) : null}
                <p className="text-xs font-semibold text-zinc-900 line-clamp-1">
                  {headline || "Headline"}
                </p>
                {description ? (
                  <p className="text-[10px] text-zinc-600 line-clamp-2">
                    {description}
                  </p>
                ) : null}
                <button
                  type="button"
                  className="mt-1 w-full rounded bg-zinc-200 py-1 text-[10px] font-semibold text-zinc-800"
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
