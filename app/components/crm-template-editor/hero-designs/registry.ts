import {
  heroDesignStyles,
  isGlobalHeroDesign,
  type HeroDesign,
} from "@/app/components/crm-template-editor/hero-designs/hero-design-catalog";

const DEFAULT: HeroDesign = "edge_to_edge";

export type { HeroDesign };
export {
  GLOBAL_HERO_DESIGN_IDS,
  HERO_DESIGN_OPTIONS,
  heroDesignStyles,
} from "@/app/components/crm-template-editor/hero-designs/hero-design-catalog";

export function normalizeHeroDesign(
  value?: string | null,
): HeroDesign {
  if (value && isGlobalHeroDesign(value) && value in heroDesignStyles) {
    return value as HeroDesign;
  }
  return DEFAULT;
}

export function getHeroDesignStyle(design: HeroDesign | string | undefined) {
  return heroDesignStyles[normalizeHeroDesign(design)];
}
