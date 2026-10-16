import { buildHeroDesignStyle } from "@/app/components/crm-template-editor/hero-designs/build-hero-design";
import type { HeroDesignCatalogEntry } from "@/app/components/crm-template-editor/hero-designs/build-hero-design";
import type {
  HeroDesignOptionRow,
  HeroDesignStyle,
} from "@/app/components/crm-template-editor/hero-designs/types";

/**
 * Single source of truth, add a hero layout: pick a preset + label/description.
 * Layout CSS lives in hero-layout-presets.ts (reusable).
 */
export const HERO_DESIGN_CATALOG = [
  {
    id: "edge_to_edge",
    preset: "edge_bleed",
    label: "Edge to edge",
    description: "Full-width hero that keeps the photo clear, no bottom fade.",
  },
  {
    id: "rounded_card",
    preset: "inset_rounded",
    label: "Rounded card",
    description:
      "Inset photo with a soft blend into the page background and template colors.",
  },
  {
    id: "premium_inset",
    preset: "inset_premium",
    label: "Premium inset",
    description: "Elevated card with shadow, luxury and SaaS landing pages.",
  },
  {
    id: "wide_banner",
    preset: "cinema_wide",
    label: "Cinematic wide",
    description: "Letterbox strip, logos, panoramas, and business interiors.",
  },
  {
    id: "tall_focus",
    preset: "portrait_tall",
    label: "Portrait focus",
    description: "Taller frame for people, products, and vertical photography.",
  },
  {
    id: "clean_edge",
    preset: "sharp_cut",
    label: "Clean cut",
    description: "Full width, no fade, crisp transition into your copy.",
  },
  {
    id: "soft_frame",
    preset: "editorial_frame",
    label: "Editorial frame",
    description: "Bordered inset, magazine and hospitality editorial style.",
  },
  {
    id: "floating_hero",
    preset: "floating_card",
    label: "Floating hero",
    description:
      "Elevated card hero that gently blends the image into the funnel page.",
  },
  {
    id: "arch_curve",
    preset: "arch_hero",
    label: "Arch curve",
    description:
      "Curved bottom edge with a soft fade so the photo melts into the template.",
  },
  {
    id: "immersive_story",
    preset: "immersive_tall",
    label: "Immersive story",
    description: "Tall immersive block, storytelling and brand campaigns.",
  },
  {
    id: "product_square",
    preset: "product_square",
    label: "Product square",
    description: "Centered square crop, ecommerce and menu highlights.",
  },
  {
    id: "magazine_band",
    preset: "magazine_band",
    label: "Magazine band",
    description:
      "Wide editorial strip; image blends into the page wash under your offer copy.",
  },
  {
    id: "glass_fade",
    preset: "glass_fade",
    label: "Glass fade",
    description:
      "Soft glass-style fade so busy photos blend cleanly with the funnel template.",
  },
  {
    id: "split_margin",
    preset: "split_margin",
    label: "Split margin",
    description: "Framed with side margins, professional services and B2B.",
  },
  {
    id: "adaptive_inset",
    preset: "contain_inset",
    label: "Adaptive inset",
    description:
      "Rounded frame that fits any image ratio — square, portrait, or landscape — without cropping.",
  },
  {
    id: "adaptive_square",
    preset: "contain_square",
    label: "Adaptive square",
    description:
      "Centered square frame; logos and product shots stay fully visible.",
  },
  {
    id: "adaptive_wide",
    preset: "contain_wide",
    label: "Adaptive wide",
    description:
      "Wide letterbox frame for panoramic and landscape hero photos.",
  },
  {
    id: "adaptive_portrait",
    preset: "contain_portrait",
    label: "Adaptive portrait",
    description:
      "Tall frame for vertical photography; no top or bottom cut-off.",
  },
  {
    id: "adaptive_floating",
    preset: "contain_floating",
    label: "Adaptive floating",
    description:
      "Elevated card with padding; busy or mixed-ratio images blend cleanly.",
  },
  {
    id: "adaptive_frame",
    preset: "contain_frame",
    label: "Adaptive frame",
    description:
      "Editorial border with neutral backdrop; works with any upload size.",
  },
] as const satisfies readonly HeroDesignCatalogEntry[];

export type HeroDesign = (typeof HERO_DESIGN_CATALOG)[number]["id"];

export const heroDesignStyles = Object.fromEntries(
  HERO_DESIGN_CATALOG.map((entry) => [entry.id, buildHeroDesignStyle(entry)]),
) as Record<HeroDesign, HeroDesignStyle>;

export const GLOBAL_HERO_DESIGN_IDS = [
  "edge_to_edge",
  "glass_fade",
  "rounded_card",
  "floating_hero",
  "arch_curve",
  "magazine_band",
] as const satisfies readonly HeroDesign[];

export type GlobalHeroDesign = (typeof GLOBAL_HERO_DESIGN_IDS)[number];

const GLOBAL_HERO_ID_SET = new Set<string>(GLOBAL_HERO_DESIGN_IDS);

export function isGlobalHeroDesign(value: string | null | undefined): boolean {
  return Boolean(value && GLOBAL_HERO_ID_SET.has(value));
}

export const HERO_DESIGN_OPTIONS: HeroDesignOptionRow[] =
  HERO_DESIGN_CATALOG.filter((entry) => isGlobalHeroDesign(entry.id)).map(
    (entry) => ({
      value: entry.id,
      label: entry.label,
      description: entry.description,
    }),
  );
