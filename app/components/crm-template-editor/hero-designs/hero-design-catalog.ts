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
    description: "Full-width hero with a soft fade into content.",
  },
  {
    id: "rounded_card",
    preset: "inset_rounded",
    label: "Rounded card",
    description: "Inset hero with rounded corners, polished app feel.",
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
    description: "Deep shadow floating card, modern DTC and app launches.",
  },
  {
    id: "arch_curve",
    preset: "arch_hero",
    label: "Arch curve",
    description: "Rounded bottom arc, boutique brands and events.",
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
    description: "Wide editorial band, headlines over atmospheric photos.",
  },
  {
    id: "glass_fade",
    preset: "glass_fade",
    label: "Glass fade",
    description: "Soft light fade, text-friendly overlay on busy images.",
  },
  {
    id: "split_margin",
    preset: "split_margin",
    label: "Split margin",
    description: "Framed with side margins, professional services and B2B.",
  },
] as const satisfies readonly HeroDesignCatalogEntry[];

export type HeroDesign = (typeof HERO_DESIGN_CATALOG)[number]["id"];

export const heroDesignStyles = Object.fromEntries(
  HERO_DESIGN_CATALOG.map((entry) => [entry.id, buildHeroDesignStyle(entry)]),
) as Record<HeroDesign, HeroDesignStyle>;

export const HERO_DESIGN_OPTIONS: HeroDesignOptionRow[] =
  HERO_DESIGN_CATALOG.map((entry) => ({
    value: entry.id,
    label: entry.label,
    description: entry.description,
  }));
