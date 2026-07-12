"use client";

import { getFormDesignStyle } from "@/app/components/crm-template-editor/form-designs/registry";
import type { FormDesign } from "@/app/components/crm-template-editor/form-designs/types";

export function FormDesignSwatch({
  design,
  selected,
}: {
  design: FormDesign;
  selected?: boolean;
}) {
  const ring = selected
    ? "ring-2 ring-[#1877f2] ring-offset-2 ring-offset-[#e8f2ff]"
    : "ring-1 ring-zinc-200/80";

  const wrap = `flex h-11 w-[4.25rem] shrink-0 items-stretch overflow-hidden rounded-lg border border-zinc-200/70 bg-zinc-50 shadow-inner ${ring}`;


  const cardSwatch = (
    <div className={`${wrap} bg-white p-1`}>
      <div className="flex w-full flex-col justify-center gap-1 rounded-md border border-zinc-200/50 bg-white p-1">
        <div className="h-1 w-full rounded-sm bg-zinc-200/90" />
        <div className="h-1 w-4/5 rounded-sm bg-zinc-100" />
      </div>
    </div>
  );

  const roundedSwatch = (
    <div
      className={`${wrap} rounded-xl border-zinc-200/50 bg-gradient-to-br from-white to-zinc-100 p-1`}
    >
      <div className="flex h-full w-full flex-col justify-center gap-1 rounded-lg bg-white/95 px-0.5 shadow-sm ring-1 ring-zinc-100">
        <div className="mx-auto h-1 w-[88%] rounded-full bg-zinc-200" />
        <div className="mx-auto h-1 w-[70%] rounded-full bg-zinc-100" />
      </div>
    </div>
  );

  const pillSwatch = (
    <div className={`${wrap} rounded-full bg-white p-1`}>
      <div className="mx-auto my-auto h-2 w-[85%] rounded-full bg-zinc-200" />
    </div>
  );

  switch (getFormDesignStyle(design).swatchKind) {
    case "split":
      return cardSwatch;
    case "dark":
      return (
        <div
          className={`${wrap} border-zinc-700 bg-gradient-to-b from-zinc-800 to-zinc-950 p-1 shadow-none`}
        >
          <div className="mt-auto h-1.5 w-full rounded bg-zinc-500/80" />
        </div>
      );
    case "neon":
      return (
        <div
          className={`${wrap} border-cyan-500/50 bg-gradient-to-b from-zinc-900 to-zinc-950 p-1 shadow-[0_0_12px_rgba(34,211,238,0.35)]`}
        >
          <div className="mt-auto h-1 w-full rounded bg-cyan-400/90" />
        </div>
      );
    case "underline":
      return (
        <div
          className={`flex h-11 w-[4.25rem] shrink-0 items-stretch overflow-hidden rounded-lg border-0 bg-transparent p-0 shadow-none ${selected ? "ring-2 ring-[#1877f2] ring-offset-2 ring-offset-[#e8f2ff]" : "ring-1 ring-zinc-200/80"}`}
        >
          <div className="flex h-full w-full flex-col justify-center gap-1.5 border-b-2 border-zinc-300 pb-0.5">
            <div className="h-px w-full bg-zinc-300" />
            <div className="h-px w-full bg-zinc-200" />
          </div>
        </div>
      );
    case "glass":
      return (
        <div className={`${wrap} border-white/60 bg-white/30 p-1 backdrop-blur-sm`}>
          <div className="h-1 w-full rounded-full bg-white/80" />
        </div>
      );
    case "gold":
      return (
        <div
          className={`${wrap} border-amber-200/80 bg-gradient-to-br from-amber-100 to-white p-1`}
        >
          <div className="h-1 w-full rounded bg-amber-300/80" />
        </div>
      );
    case "pill":
      return pillSwatch;
    case "card":
      return cardSwatch;
    case "rounded":
    default:
      return roundedSwatch;
  }
}
