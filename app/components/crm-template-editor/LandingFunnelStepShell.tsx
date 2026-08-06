"use client";

import type { ReactNode } from "react";
import {
  LandingHero,
  pageBackgroundStyle,
} from "@/app/components/crm-template-editor/LandingPagePreview";
import { getHeroDesignStyle } from "@/app/components/crm-template-editor/hero-designs/registry";
import { normalizeHeroDesign } from "@/app/components/crm-template-editor/hero-designs/registry";
import {
  getLandingDesignStyle,
  normalizeLandingDesign,
} from "@/app/components/crm-template-editor/landing-designs/registry";
import { normalizeImageScale } from "@/app/components/crm-template-editor/template-image";
import { resolveLandingTheme } from "@/app/components/crm-template-editor/theme-resolver";
import type { LandingTemplatePage } from "@/app/components/crm-template-editor/template-types";

export function LandingFunnelStepShell({
  landingPage,
  heroImageUrl,
  heroImageScale,
  fillViewport = false,
  minHeight,
  children,
}: {
  landingPage: LandingTemplatePage;
  heroImageUrl: string;
  heroImageScale: number;
  fillViewport?: boolean;
  minHeight?: number | null;
  children: ReactNode;
}) {
  const landingDesign = normalizeLandingDesign(landingPage.landingDesign);
  const template = getLandingDesignStyle(landingDesign);
  const theme = resolveLandingTheme({
    template,
    overrides: {
      backgroundColor: landingPage.backgroundColor,
      headingColor: landingPage.headingColor,
      subheadingColor: landingPage.subheadingColor,
      bodyColor: landingPage.bodyColor,
      buttonTextColor: landingPage.buttonTextColor,
      buttonBackgroundColor: landingPage.buttonBackgroundColor,
    },
  });
  const heroStyle = getHeroDesignStyle(normalizeHeroDesign(landingPage.heroDesign));
  const centered = landingPage.layoutType === "centered";

  return (
    <div
      className={
        fillViewport
          ? "flex h-full min-h-full flex-1 flex-col overflow-hidden"
          : "flex w-full flex-col"
      }
      style={
        !fillViewport && minHeight != null && minHeight > 0
          ? { minHeight }
          : undefined
      }
    >
      <LandingHero
        url={heroImageUrl}
        scale={normalizeImageScale(heroImageScale)}
        fadeColor={theme.background}
        placeholderClass={theme.heroPlaceholderClass}
        heroStyle={heroStyle}
      />
      <div
        className={`flex w-full flex-1 flex-col items-stretch px-5 pb-8 pt-6 ${fillViewport ? "min-h-0 flex-1" : ""} ${centered ? "text-center" : "text-left"}`}
        style={pageBackgroundStyle(theme.background, theme.background)}
      >
        <div className={`w-full min-w-0 ${fillViewport ? "flex min-h-0 flex-1 flex-col" : ""}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
