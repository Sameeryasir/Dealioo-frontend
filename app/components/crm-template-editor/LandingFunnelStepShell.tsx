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
import type { LandingTemplatePage } from "@/app/components/crm-template-editor/template-types";

export function LandingFunnelStepShell({
  landingPage,
  heroImageUrl,
  heroImageScale,
  fillViewport = false,
  children,
}: {
  landingPage: LandingTemplatePage;
  heroImageUrl: string;
  heroImageScale: number;
  fillViewport?: boolean;
  children: ReactNode;
}) {
  const landingDesign = normalizeLandingDesign(landingPage.landingDesign);
  const landingStyle = getLandingDesignStyle(landingDesign);
  const heroStyle = getHeroDesignStyle(normalizeHeroDesign(landingPage.heroDesign));
  const centered = landingPage.layoutType === "centered";
  const contentBg =
    landingPage.backgroundColor?.trim() || landingStyle.backgroundDefault;

  return (
    <div
      className={
        fillViewport
          ? "flex min-h-full flex-1 flex-col overflow-hidden"
          : "flex min-h-0 flex-col overflow-hidden"
      }
    >
      <LandingHero
        url={heroImageUrl}
        scale={normalizeImageScale(heroImageScale)}
        fadeColor={contentBg}
        placeholderClass={landingStyle.heroPlaceholderClass}
        heroStyle={heroStyle}
      />
      <div
        className={`flex w-full flex-col items-stretch px-5 pb-8 pt-6 ${fillViewport ? "flex-1" : ""} ${centered ? "text-center" : "text-left"}`}
        style={pageBackgroundStyle(
          landingPage.backgroundColor,
          landingStyle.backgroundDefault,
        )}
      >
        <div className={`w-full min-w-0 ${fillViewport ? "flex-1" : ""}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
