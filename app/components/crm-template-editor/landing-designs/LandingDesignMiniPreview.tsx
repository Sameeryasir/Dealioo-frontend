"use client";

import type { LandingDesignStyle } from "@/app/components/crm-template-editor/landing-designs/types";

/** Tiny landing-page mock, reuses design tokens (colors, CTA gradient). */
export function LandingDesignMiniPreview({
  style,
}: {
  style: LandingDesignStyle;
}) {
  const ctaGradient = `linear-gradient(135deg, ${style.primary} 0%, ${style.secondary} 100%)`;
  const heroGradient = `linear-gradient(160deg, ${style.primary}55 0%, ${style.secondary}66 100%)`;

  return (
    <div
      className="relative h-[3.25rem] w-[2.35rem] shrink-0 overflow-hidden rounded-md border border-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
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
          style={{ background: ctaGradient }}
        />
      </div>
    </div>
  );
}
