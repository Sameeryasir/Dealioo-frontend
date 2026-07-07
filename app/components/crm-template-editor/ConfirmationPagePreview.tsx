"use client";

import type { CSSProperties } from "react";
import { LandingFunnelStepShell } from "@/app/components/crm-template-editor/LandingFunnelStepShell";
import { textColorStyle } from "@/app/components/crm-template-editor/landing-content-colors";
import {
  getLandingDesignStyle,
  normalizeLandingDesign,
} from "@/app/components/crm-template-editor/landing-designs/registry";
import { resolveConfirmationContent } from "@/app/components/crm-template-editor/confirmation-defaults";
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
}: {
  page: TemplatePageBase & { id: "confirmation" };
  landingPage: LandingTemplatePage;
  fillViewport?: boolean;
}) {
  const landingDesign = normalizeLandingDesign(landingPage.landingDesign);
  const landingStyle = getLandingDesignStyle(landingDesign);
  const centered = landingPage.layoutType === "centered";

  const headingColorStyle = textColorStyle(landingPage.headingColor);
  const subheadingColorStyle = textColorStyle(landingPage.subheadingColor);
  const bodyColorStyle = textColorStyle(landingPage.bodyColor);
  const copy = resolveConfirmationContent(page);

  return (
    <LandingFunnelStepShell
      landingPage={landingPage}
      heroImageUrl={landingPage.imageUrl}
      heroImageScale={landingPage.imageScale}
      fillViewport={fillViewport}
    >
      <span
        className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] ${landingStyle.badgeClass} ${centered ? "mx-auto" : ""}`}
      >
        {landingStyle.eyebrow}
      </span>

      <div
        className={`mt-4 h-px w-12 ${landingStyle.dividerClass} ${centered ? "mx-auto" : ""}`}
        aria-hidden
      />

      <h1
        className={`mt-4 text-[1.65rem] font-bold leading-[1.15] ${headingColorStyle ? "" : landingStyle.headingClass} ${centered ? "mx-auto max-w-[18ch]" : ""}`}
        style={headingColorStyle}
      >
        {copy.heading}
      </h1>
      <p
        className={`mt-3 text-base font-medium leading-snug ${subheadingColorStyle ? "" : landingStyle.subheadingClass} ${centered ? "mx-auto max-w-prose" : "max-w-prose"}`}
        style={subheadingColorStyle}
      >
        {copy.subheading}
      </p>

      <ConfirmationBody
        body={copy.body}
        centered={centered}
        bodyClass={landingStyle.bodyClass}
        colorStyle={bodyColorStyle}
      />

      <p
        className={`mt-6 text-[0.65rem] ${landingStyle.trustClass} ${centered ? "text-center" : ""}`}
      >
        {landingStyle.trustLine}
      </p>
    </LandingFunnelStepShell>
  );
}
