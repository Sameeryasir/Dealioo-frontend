"use client";

import type {
  HeroDesignStyle,
  HeroPreviewKind,
} from "@/app/components/crm-template-editor/hero-designs/types";

const PREVIEW_LAYOUT: Record<
  HeroPreviewKind,
  { inset: boolean; heroH: string; rounded: boolean; arch: boolean }
> = {
  edge: { inset: false, heroH: "h-[48%]", rounded: false, arch: false },
  inset: { inset: true, heroH: "h-[46%]", rounded: true, arch: false },
  wide: { inset: false, heroH: "h-[30%]", rounded: false, arch: false },
  tall: { inset: false, heroH: "h-[72%]", rounded: false, arch: false },
  card: { inset: true, heroH: "h-[44%]", rounded: true, arch: false },
  frame: { inset: true, heroH: "h-[46%]", rounded: true, arch: false },
  arch: { inset: false, heroH: "h-[50%]", rounded: false, arch: true },
  immersive: { inset: false, heroH: "h-[78%]", rounded: false, arch: false },
  square: { inset: true, heroH: "h-[55%]", rounded: true, arch: false },
  band: { inset: false, heroH: "h-[38%]", rounded: false, arch: false },
  glass: { inset: false, heroH: "h-[48%]", rounded: false, arch: false },
  margin: { inset: true, heroH: "h-[42%]", rounded: true, arch: false },
};

/** Wireframe thumbnail, driven by style.previewKind from layout presets. */
export function HeroDesignMiniPreview({ style }: { style: HeroDesignStyle }) {
  const layout = PREVIEW_LAYOUT[style.previewKind];
  const showFade = style.fade !== "none";

  return (
    <div
      className={[
        "relative h-[3.25rem] w-[2.35rem] shrink-0 overflow-hidden rounded-[10px] border border-zinc-200/80 bg-white shadow-sm",
        layout.inset ? "p-0.5" : "",
      ].join(" ")}
      aria-hidden
    >
      <div
        className={[
          "relative w-full overflow-hidden bg-gradient-to-br from-sky-200 via-indigo-200 to-violet-200",
          layout.heroH,
          layout.arch
            ? "rounded-b-[6px] rounded-t-[2px]"
            : layout.rounded
              ? "rounded-[4px]"
              : "",
          layout.inset ? "mx-auto w-[86%]" : "",
        ].join(" ")}
      >
        {showFade ? (
          <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-white via-white/75 to-transparent" />
        ) : (
          <div className="absolute inset-x-0 bottom-0 h-px bg-zinc-300/70" />
        )}
      </div>
      <div
        className={[
          "flex flex-col gap-[2px] bg-white/95",
          layout.inset ? "px-0.5 pb-0.5 pt-0.5" : "px-1 pb-1 pt-0.5",
        ].join(" ")}
      >
        <div className="h-[2px] w-4 rounded-full bg-violet-300/90" />
        <div className="h-[1.5px] w-full rounded-full bg-zinc-200" />
        <div className="h-[3px] w-full rounded-[3px] bg-gradient-to-r from-violet-400 to-indigo-400" />
      </div>
    </div>
  );
}
