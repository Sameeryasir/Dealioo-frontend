"use client";

import type { CSSProperties } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { LandingFunnelStepShell } from "@/app/components/crm-template-editor/LandingFunnelStepShell";
import { LandingPagePreview } from "@/app/components/crm-template-editor/LandingPagePreview";
import { normalizeHeroDesign } from "@/app/components/crm-template-editor/hero-designs/registry";
import {
  getLandingDesignStyle,
  normalizeLandingDesign,
} from "@/app/components/crm-template-editor/landing-designs/registry";
import { resolveLandingTheme } from "@/app/components/crm-template-editor/theme-resolver";
import { resolveConfirmationContent } from "@/app/components/crm-template-editor/confirmation-defaults";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import type {
  LandingTemplatePage,
  TemplatePageBase,
} from "@/app/components/crm-template-editor/template-types";

function ConfirmationBody({
  body,
  centered,
  bodyClass,
  colorStyle,
}: {
  body: string;
  centered: boolean;
  bodyClass: string;
  colorStyle?: CSSProperties;
}) {
  const trimmed = body.trim();
  if (!trimmed) return null;
  const paras = trimmed.split(/\n\n+/).filter(Boolean);
  return (
    <div
      className={`mt-4 space-y-3 text-[0.9375rem] leading-relaxed ${colorStyle ? "" : bodyClass} ${centered ? "mx-auto max-w-prose text-center" : ""}`}
      style={colorStyle}
    >
      {paras.map((p, i) => (
        <p key={i}>{p.trim()}</p>
      ))}
    </div>
  );
}

export function ConfirmationPagePreview({
  page,
  landingPage,
  fillViewport = false,
  campaignType = null,
}: {
  page: TemplatePageBase & { id: "confirmation" };
  landingPage: LandingTemplatePage;
  fillViewport?: boolean;
  campaignType?: "prepaid" | "postpaid" | null;
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
  const centered = landingPage.layoutType === "centered";
  const headingColorStyle = theme.headlineColor
    ? { color: theme.headlineColor }
    : undefined;
  const subheadingColorStyle = theme.subheadlineColor
    ? { color: theme.subheadlineColor }
    : undefined;
  const bodyColorStyle = theme.bodyColor
    ? { color: theme.bodyColor }
    : undefined;
  const copy = resolveConfirmationContent(page, campaignType);

  const measureRef = useRef<HTMLDivElement | null>(null);
  const [landingHeight, setLandingHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (fillViewport) {
      setLandingHeight(null);
      return;
    }
    const el = measureRef.current;
    if (!el) return;

    const measure = () => {
      const height = Math.max(el.offsetHeight, el.scrollHeight);
      if (height > 0) setLandingHeight(height);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [
    fillViewport,
    landingPage.id,
    landingPage.layoutType,
    landingPage.landingDesign,
    landingPage.heroDesign,
    landingPage.imageUrl,
    landingPage.imageScale,
    landingPage.heading,
    landingPage.subheading,
    landingPage.body,
    landingPage.buttonText,
    landingPage.backgroundColor,
  ]);

  return (
    <div className="relative w-full">
      {!fillViewport ? (
        <div
          className="pointer-events-none absolute left-0 top-0 h-0 w-full overflow-hidden"
          aria-hidden
        >
          <div ref={measureRef} className="w-full">
            <LandingPagePreview
              page={landingPage}
              layoutType={landingPage.layoutType}
              landingDesign={landingDesign}
              heroDesign={normalizeHeroDesign(landingPage.heroDesign)}
              heroImageUrl={resolveUploadImageUrl(landingPage.imageUrl)}
              heroImageScale={landingPage.imageScale}
              landingCtaHref={null}
              showTopHero
              fillViewport={false}
            />
          </div>
        </div>
      ) : null}

      <LandingFunnelStepShell
        landingPage={landingPage}
        heroImageUrl={resolveUploadImageUrl(landingPage.imageUrl)}
        heroImageScale={landingPage.imageScale}
        fillViewport={fillViewport}
        minHeight={landingHeight}
      >
        <span
          className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] ${theme.badgeClass} ${centered ? "mx-auto" : ""}`}
        >
          {theme.eyebrow}
        </span>

        <div
          className={`mt-4 h-px w-12 ${theme.dividerClass} ${centered ? "mx-auto" : ""}`}
          aria-hidden
        />

        <h1
          className={`mt-4 text-[1.65rem] font-bold leading-[1.15] ${headingColorStyle ? "" : theme.headingClass} ${centered ? "mx-auto max-w-[18ch]" : ""}`}
          style={headingColorStyle}
        >
          {copy.heading}
        </h1>
        <p
          className={`mt-3 text-base font-medium leading-snug ${subheadingColorStyle ? "" : theme.subheadingClass} ${centered ? "mx-auto max-w-prose" : "max-w-prose"}`}
          style={subheadingColorStyle}
        >
          {copy.subheading}
        </p>

        <ConfirmationBody
          body={copy.body}
          centered={centered}
          bodyClass={theme.bodyClass}
          colorStyle={bodyColorStyle}
        />

        <p
          className={`mt-6 text-[0.65rem] ${theme.trustClass} ${centered ? "text-center" : ""}`}
        >
          {theme.trustLine}
        </p>
      </LandingFunnelStepShell>
    </div>
  );
}
