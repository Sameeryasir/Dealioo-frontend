"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { getHeroDesignStyle } from "@/app/components/crm-template-editor/hero-designs/registry";
import { getLandingDesignStyle } from "@/app/components/crm-template-editor/landing-designs/registry";
import {
  imageScaleStyle,
  normalizeImageScale,
} from "@/app/components/crm-template-editor/template-image";
import { textColorStyle } from "@/app/components/crm-template-editor/landing-content-colors";
import type { HeroDesignStyle } from "@/app/components/crm-template-editor/hero-designs/types";
import {
  landingSectionOrder,
  type LandingContentSectionId,
} from "@/app/components/crm-template-editor/landing-sections";
import type {
  LandingTemplatePage,
  TemplatePage,
} from "@/app/components/crm-template-editor/template-types";

export function pageBackgroundStyle(
  color: string | undefined,
  fallback: string,
): CSSProperties {
  const value = color?.trim();
  return { backgroundColor: value || fallback };
}

function heroFadeStyle(
  fadeColor: string,
  mode: HeroDesignStyle["fade"],
): CSSProperties | undefined {
  if (mode === "none") return undefined;
  const stops =
    mode === "soft"
      ? `${fadeColor} 0%, ${fadeColor}cc 28%, transparent 85%`
      : `${fadeColor} 0%, ${fadeColor}99 40%, transparent 100%`;
  return {
    backgroundImage: `linear-gradient(to top, ${stops})`,
  };
}

export function LandingHero({
  url,
  scale,
  fadeColor,
  placeholderClass,
  heroStyle,
}: {
  url: string;
  scale: number;
  fadeColor: string;
  placeholderClass: string;
  heroStyle: HeroDesignStyle;
}) {
  const frameClass = [
    heroStyle.frameClass,
    !url?.trim() ? `${placeholderClass} ${heroStyle.placeholderClass}` : "",
  ].join(" ");

  const placeholder = (
    <div
      className={`flex flex-col items-center justify-center gap-2 px-4 py-10 text-center ${frameClass}`}
    >
      <span className="text-xs font-semibold">Image placeholder</span>
      <span className="text-[0.65rem] opacity-80">
        Upload a hero image in Media
      </span>
    </div>
  );

  const imageBlock = (
    <div className={frameClass}>
      <img
        src={url}
        alt=""
        className={heroStyle.imageClass}
        style={imageScaleStyle(normalizeImageScale(scale))}
      />
      {heroStyle.fade !== "none" ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={heroFadeStyle(fadeColor, heroStyle.fade)}
          aria-hidden
        />
      ) : null}
    </div>
  );

  const inner = !url?.trim() ? placeholder : imageBlock;

  if (!heroStyle.wrapperClass) {
    return inner;
  }

  return <div className={heroStyle.wrapperClass}>{inner}</div>;
}

function LandingBody({
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
      className={`mt-5 space-y-3.5 text-[0.9375rem] leading-relaxed ${colorStyle ? "" : bodyClass} ${centered ? "mx-auto max-w-prose text-center" : ""}`}
      style={colorStyle}
    >
      {paras.map((p, i) => (
        <p key={i}>{p.trim()}</p>
      ))}
    </div>
  );
}

function LandingCta({
  label,
  href,
  centered,
  primary,
  secondary,
  ctaShadow,
  labelColorStyle,
  onButtonClick,
}: {
  label: string;
  href: string | null;
  centered: boolean;
  primary: string;
  secondary: string;
  ctaShadow: string;
  labelColorStyle?: CSSProperties;
  onButtonClick?: (elementName: string) => void;
}) {
  const className = [
    "group relative mt-8 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-6 py-3.5 text-sm font-semibold transition hover:brightness-105 active:scale-[0.99]",
    labelColorStyle ? "" : "text-white",
    ctaShadow,
    centered ? "mx-auto max-w-sm" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const style: CSSProperties = {
    background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
    ...labelColorStyle,
  };

  const inner = (
    <>
      <span className="relative z-[1]">{label}</span>
      <span
        className="relative z-[1] text-lg leading-none opacity-90 transition group-hover:translate-x-0.5"
        aria-hidden
      >
        →
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={className}
        style={style}
        onClick={() => onButtonClick?.(label)}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={() => onButtonClick?.(label)}
    >
      {inner}
    </button>
  );
}

export function LandingPagePreview({
  page,
  layoutType,
  landingDesign,
  heroDesign,
  heroImageUrl,
  heroImageScale,
  landingCtaHref,
  showTopHero,
  onButtonClick,
}: {
  page: TemplatePage;
  layoutType: string;
  landingDesign: string;
  heroDesign: string;
  heroImageUrl: string;
  heroImageScale: number;
  landingCtaHref: string | null;
  showTopHero: boolean;
  onButtonClick?: (elementName: string) => void;
}) {
  const style = getLandingDesignStyle(landingDesign);
  const heroStyle = getHeroDesignStyle(heroDesign);
  const landing =
    page.id === "landing" ? (page as LandingTemplatePage) : null;
  const headingColorStyle = textColorStyle(landing?.headingColor);
  const subheadingColorStyle = textColorStyle(landing?.subheadingColor);
  const bodyColorStyle = textColorStyle(landing?.bodyColor);
  const buttonTextColorStyle = textColorStyle(landing?.buttonTextColor);
  const centered = layoutType === "centered";
  const align = centered ? "text-center items-center" : "text-left items-start";
  const ctaHref = landingCtaHref?.trim() ? landingCtaHref.trim() : null;
  const contentBg =
    page.backgroundColor?.trim() || style.backgroundDefault;

  const sectionOrder =
    landing != null
      ? landingSectionOrder(landing)
      : ([
          "eyebrow",
          "heading",
          "subheading",
          "divider",
          "body",
          "cta",
          "trust",
        ] as LandingContentSectionId[]);

  const sectionNodes: Record<LandingContentSectionId, ReactNode> = {
    eyebrow: (
      <span
        key="eyebrow"
        className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] ${style.badgeClass} ${centered ? "mx-auto" : ""}`}
      >
        {style.eyebrow}
      </span>
    ),
    heading: (
      <h1
        key="heading"
        className={`text-[1.65rem] font-bold leading-[1.15] sm:text-3xl ${headingColorStyle ? "" : style.headingClass} ${centered ? "mx-auto max-w-[18ch]" : ""}`}
        style={headingColorStyle}
      >
        {page.heading}
      </h1>
    ),
    subheading: (
      <p
        key="subheading"
        className={`text-base font-medium leading-snug ${subheadingColorStyle ? "" : style.subheadingClass} ${centered ? "mx-auto max-w-prose" : "max-w-prose"}`}
        style={subheadingColorStyle}
      >
        {page.subheading}
      </p>
    ),
    divider: (
      <div
        key="divider"
        className={`h-px w-12 ${style.dividerClass} ${centered ? "mx-auto" : ""}`}
        aria-hidden
      />
    ),
    body: (
      <LandingBody
        key="body"
        body={page.body}
        centered={centered}
        bodyClass={style.bodyClass}
        colorStyle={bodyColorStyle}
      />
    ),
    cta: (
      <LandingCta
        key="cta"
        label={page.buttonText}
        href={ctaHref}
        centered={centered}
        primary={style.primary}
        secondary={style.secondary}
        ctaShadow={style.ctaShadow}
        labelColorStyle={buttonTextColorStyle}
        onButtonClick={onButtonClick}
      />
    ),
    trust: (
      <p
        key="trust"
        className={`text-[0.65rem] ${style.trustClass} ${centered ? "text-center" : ""}`}
      >
        {style.trustLine}
      </p>
    ),
  };

  const content = (
    <div
      className={`flex flex-col gap-4 ${align} px-5 pb-8 pt-6 sm:px-6`}
      style={pageBackgroundStyle(page.backgroundColor, style.backgroundDefault)}
    >
      {sectionOrder.map((sectionId) => sectionNodes[sectionId])}
    </div>
  );

  const hero = showTopHero ? (
    <LandingHero
      url={heroImageUrl}
      scale={heroImageScale}
      fadeColor={contentBg}
      placeholderClass={style.heroPlaceholderClass}
      heroStyle={heroStyle}
    />
  ) : null;

  if (layoutType === "split") {
    return (
      <div className="flex min-h-0 flex-col overflow-hidden">
        {hero}
        {content}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col overflow-hidden">
      {hero}
      {content}
    </div>
  );
}
