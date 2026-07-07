import type { HeroDesignStyle } from "@/app/components/crm-template-editor/hero-designs/types";

export type HeroLayoutPresetKey =
  | "edge_bleed"
  | "inset_rounded"
  | "inset_premium"
  | "cinema_wide"
  | "portrait_tall"
  | "sharp_cut"
  | "editorial_frame"
  | "floating_card"
  | "arch_hero"
  | "immersive_tall"
  | "product_square"
  | "magazine_band"
  | "glass_fade"
  | "split_margin";

export type HeroLayoutPreset = Pick<
  HeroDesignStyle,
  | "wrapperClass"
  | "frameClass"
  | "imageClass"
  | "fade"
  | "placeholderClass"
  | "previewKind"
>;

/** Reusable layout tokens, catalog rows pick a preset + optional overrides. */
export const HERO_LAYOUT_PRESETS: Record<HeroLayoutPresetKey, HeroLayoutPreset> = {
  edge_bleed: {
    previewKind: "edge",
    wrapperClass: "",
    frameClass:
      "relative aspect-[4/3] w-full shrink-0 overflow-hidden",
    imageClass: "h-full w-full object-cover",
    fade: "full",
    placeholderClass: "border-b border-dashed",
  },
  inset_rounded: {
    previewKind: "inset",
    wrapperClass: "px-4 pt-4",
    frameClass:
      "relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5",
    imageClass: "h-full w-full object-cover",
    fade: "soft",
    placeholderClass: "rounded-2xl border border-dashed shadow-sm",
  },
  inset_premium: {
    previewKind: "card",
    wrapperClass: "px-5 pt-5",
    frameClass:
      "relative aspect-[5/4] w-full shrink-0 overflow-hidden rounded-2xl shadow-lg ring-1 ring-zinc-200/80",
    imageClass: "h-full w-full object-cover",
    fade: "soft",
    placeholderClass: "rounded-2xl border border-dashed",
  },
  cinema_wide: {
    previewKind: "wide",
    wrapperClass: "",
    frameClass:
      "relative aspect-[21/9] w-full shrink-0 overflow-hidden",
    imageClass: "h-full w-full object-cover object-center",
    fade: "full",
    placeholderClass: "border-b border-dashed",
  },
  portrait_tall: {
    previewKind: "tall",
    wrapperClass: "",
    frameClass:
      "relative aspect-[4/5] w-full max-h-[22rem] shrink-0 overflow-hidden",
    imageClass: "h-full w-full object-cover",
    fade: "full",
    placeholderClass: "border-b border-dashed",
  },
  sharp_cut: {
    previewKind: "edge",
    wrapperClass: "",
    frameClass:
      "relative aspect-[4/3] w-full shrink-0 overflow-hidden",
    imageClass: "h-full w-full object-cover",
    fade: "none",
    placeholderClass: "border-b border-dashed",
  },
  editorial_frame: {
    previewKind: "frame",
    wrapperClass: "px-5 pt-5",
    frameClass:
      "relative aspect-[5/4] w-full shrink-0 overflow-hidden rounded-xl border border-zinc-200/90 bg-zinc-100 shadow-sm",
    imageClass: "h-full w-full object-cover",
    fade: "soft",
    placeholderClass: "rounded-xl border border-dashed",
  },
  floating_card: {
    previewKind: "card",
    wrapperClass: "px-4 pt-4 pb-1",
    frameClass:
      "relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/[0.06]",
    imageClass: "h-full w-full object-cover",
    fade: "soft",
    placeholderClass: "rounded-3xl border border-dashed shadow-md",
  },
  arch_hero: {
    previewKind: "arch",
    wrapperClass: "",
    frameClass:
      "relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-b-[2.5rem]",
    imageClass: "h-full w-full object-cover",
    fade: "full",
    placeholderClass: "border-b border-dashed rounded-b-[2.5rem]",
  },
  immersive_tall: {
    previewKind: "immersive",
    wrapperClass: "",
    frameClass:
      "relative aspect-[3/4] w-full min-h-[12rem] max-h-[28rem] shrink-0 overflow-hidden",
    imageClass: "h-full w-full object-cover",
    fade: "full",
    placeholderClass: "border-b border-dashed",
  },
  product_square: {
    previewKind: "square",
    wrapperClass: "px-6 pt-5",
    frameClass:
      "relative mx-auto aspect-square w-full max-w-[min(100%,18rem)] shrink-0 overflow-hidden rounded-2xl shadow-md ring-1 ring-zinc-200/80",
    imageClass: "h-full w-full object-cover",
    fade: "soft",
    placeholderClass: "rounded-2xl border border-dashed",
  },
  magazine_band: {
    previewKind: "band",
    wrapperClass: "",
    frameClass:
      "relative aspect-[2/1] w-full shrink-0 overflow-hidden",
    imageClass: "h-full w-full object-cover",
    fade: "soft",
    placeholderClass: "border-b border-dashed",
  },
  glass_fade: {
    previewKind: "glass",
    wrapperClass: "",
    frameClass:
      "relative aspect-[4/3] w-full shrink-0 overflow-hidden",
    imageClass: "h-full w-full object-cover",
    fade: "soft",
    placeholderClass: "border-b border-dashed",
  },
  split_margin: {
    previewKind: "margin",
    wrapperClass: "px-6 pt-4",
    frameClass:
      "relative aspect-[16/11] w-full shrink-0 overflow-hidden rounded-lg border border-zinc-200/70 shadow-sm",
    imageClass: "h-full w-full object-cover",
    fade: "full",
    placeholderClass: "rounded-lg border border-dashed",
  },
};
