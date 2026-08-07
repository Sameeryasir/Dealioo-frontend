"use client";

import type { LandingDesignStyle } from "@/app/components/crm-template-editor/landing-designs/types";
import { editorTheme } from "@/app/components/crm-template-editor/editor-theme";

export function LandingDesignMiniPreview({
  style,
  large = false,
  wide = false,
}: {
  style: LandingDesignStyle;
  large?: boolean;
  /** Full-width card preview for the Browse templates gallery. */
  wide?: boolean;
}) {
  const heroGradient = `linear-gradient(135deg, ${style.primary} 0%, ${style.secondary} 100%)`;
  const softHero = `linear-gradient(160deg, ${style.primary}40 0%, ${style.secondary}55 55%, ${style.backgroundDefault} 100%)`;

  if (wide) {
    return (
      <div
        className="relative h-[7.25rem] w-full overflow-hidden rounded-[0.85rem] border border-black/[0.05]"
        style={{ backgroundColor: style.backgroundDefault }}
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-90"
          style={{ background: softHero }}
        />
        <div
          className="absolute inset-x-0 top-0 h-[52%]"
          style={{ background: heroGradient }}
        />
        <div className="absolute inset-x-3 bottom-3 flex flex-col gap-1.5 rounded-lg bg-white/95 p-2.5 shadow-[0_8px_20px_rgba(15,23,42,0.12)] ring-1 ring-black/[0.04]">
          <div
            className="h-1.5 w-16 rounded-full"
            style={{ backgroundColor: style.primary }}
          />
          <div className="h-1 w-full rounded-full bg-slate-200/90" />
          <div className="h-1 w-[70%] rounded-full bg-slate-200/70" />
          <div
            className="mt-0.5 h-5 w-full rounded-md shadow-sm"
            style={{
              background: `linear-gradient(90deg, ${style.primary}, ${style.secondary})`,
            }}
          />
        </div>
        <div
          className="absolute right-3 top-3 size-8 rounded-full opacity-30 blur-[2px]"
          style={{ backgroundColor: "#fff" }}
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div
      className={[
        "relative shrink-0 overflow-hidden rounded-md border border-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
        large ? "h-[4.1rem] w-[3rem] rounded-lg" : "h-[3.25rem] w-[2.35rem]",
      ].join(" ")}
      style={{ backgroundColor: style.backgroundDefault }}
      aria-hidden
    >
      <div className="h-[42%] w-full" style={{ background: heroGradient }} />
      <div className="flex flex-col gap-[2px] px-1 pb-1 pt-0.5">
        <div
          className="h-[2px] w-3.5 rounded-full opacity-90"
          style={{ backgroundColor: style.primary }}
        />
        <div className="h-[1.5px] w-full rounded-full bg-zinc-400/35" />
        <div
          className="mt-0.5 h-[3px] w-full rounded-[3px] shadow-sm"
          style={{ backgroundColor: style.secondary || editorTheme.primary }}
        />
      </div>
    </div>
  );
}
