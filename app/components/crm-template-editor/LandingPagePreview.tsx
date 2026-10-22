"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { getHeroDesignStyle } from "@/app/components/crm-template-editor/hero-designs/registry";
import { getLandingDesignStyle } from "@/app/components/crm-template-editor/landing-designs/registry";
import {
  imageScaleStyle,
  normalizeImageScale,
} from "@/app/components/crm-template-editor/template-image";
import type { HeroDesignStyle } from "@/app/components/crm-template-editor/hero-designs/types";
import {
  landingSectionOrder,
  type LandingContentSectionId,
} from "@/app/components/crm-template-editor/landing-sections";
import type {
  LandingTemplatePage,
  TemplatePage,
} from "@/app/components/crm-template-editor/template-types";
import {
  landingTemplateButtonStyle,
  landingTemplateCtaLayoutClass,
} from "@/app/components/crm-template-editor/landing-cta-styles";
import { resolveLandingTheme } from "@/app/components/crm-template-editor/theme-resolver";
import {
  resolveUploadImageUrl,
  spacesImageHeroLoadProps,
} from "@/app/lib/resolve-upload-image-url";

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
      ? `${fadeColor}8a 0%, ${fadeColor}33 16%, transparent 36%`
      : `${fadeColor}99 0%, ${fadeColor}40 18%, transparent 40%`;
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
  const resolvedUrl = resolveUploadImageUrl(url);
  const hasImage = Boolean(resolvedUrl.trim());

  const frameClass = [
    heroStyle.frameClass,
    !hasImage ? `${placeholderClass} ${heroStyle.placeholderClass}` : "",
  ].join(" ");

  const frameToneStyle: CSSProperties = {
    backgroundColor: fadeColor,
  };

  const placeholder = (
    <div
      className={`flex flex-col items-center justify-center gap-2 px-4 py-8 text-center ${frameClass}`}
      style={frameToneStyle}
    >
      <span className="text-xs font-semibold">Image placeholder</span>
      <span className="text-[0.65rem] opacity-80">
        Upload a hero image in Media
      </span>
    </div>
  );

  const imageBlock = (
    <div className={frameClass} style={frameToneStyle}>
      {/* Hero files can be an upload or any remote image, so the browser loads them directly. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvedUrl}
        alt=""
        width={1200}
        height={800}
        {...spacesImageHeroLoadProps}
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

  const inner = hasImage ? imageBlock : placeholder;

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
      className={`space-y-3.5 text-[0.9375rem] leading-relaxed ${colorStyle ? "" : bodyClass} ${centered ? "mx-auto max-w-prose text-center" : ""}`}
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
  labelColor,
  onButtonClick,
}: {
  label: string;
  href: string | null;
  centered: boolean;
  primary: string;
  secondary: string;
  labelColor: string;
  onButtonClick?: (elementName: string) => void;
}) {
  const className = [
    "group relative w-full",
    landingTemplateCtaLayoutClass,
    centered ? "mx-auto max-w-sm" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const style: CSSProperties = landingTemplateButtonStyle(primary, secondary, {
    labelColor,
  });

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

function SelectableSectionShell({
  sectionId,
  enabled,
  selected,
  onSelect,
  children,
}: {
  sectionId: LandingContentSectionId;
  enabled: boolean;
  selected: boolean;
  onSelect?: (sectionId: LandingContentSectionId) => void;
  children: ReactNode;
}) {
  if (!enabled) return <>{children}</>;
  return (
    <div
      role="button"
      tabIndex={0}
      data-editor-section={sectionId}
      aria-pressed={selected}
      aria-label={`Select ${sectionId}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect?.(sectionId);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(sectionId);
        }
      }}
      className={[
        "relative rounded-md transition-[box-shadow,outline-color] duration-150",
        selected
          ? "z-[2] outline outline-2 outline-offset-2 outline-[#1877f2] ring-2 ring-[#1877f2]/20"
          : "hover:outline hover:outline-1 hover:outline-offset-2 hover:outline-[#93c5fd]",
      ].join(" ")}
    >
      {selected ? (
        <span className="pointer-events-none absolute -top-2 left-0 z-[3] rounded bg-[#1877f2] px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wide text-white">
          {sectionId}
        </span>
      ) : null}
      {children}
    </div>
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
  fillViewport = false,
  editorSelectEnabled = false,
  selectedSectionId = null,
  onSelectSection,
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
  fillViewport?: boolean;
  editorSelectEnabled?: boolean;
  selectedSectionId?: LandingContentSectionId | null;
  onSelectSection?: (sectionId: LandingContentSectionId) => void;
}) {
  const template = getLandingDesignStyle(landingDesign);
  const heroStyle = getHeroDesignStyle(heroDesign);
  const landing =
    page.id === "landing" ? (page as LandingTemplatePage) : null;
  const pageRecord = page as TemplatePage & {
    ctaBackgroundColor?: string;
    ctaTextColor?: string;
    headlineColor?: string;
    subheadlineColor?: string;
  };

  const theme = resolveLandingTheme({
    template,
    overrides: {
      backgroundColor: page.backgroundColor,
      headingColor: landing?.headingColor,
      headlineColor: pageRecord.headlineColor,
      subheadingColor: landing?.subheadingColor,
      subheadlineColor: pageRecord.subheadlineColor,
      bodyColor: landing?.bodyColor,
      buttonTextColor: landing?.buttonTextColor,
      ctaTextColor: pageRecord.ctaTextColor,
      buttonBackgroundColor: landing?.buttonBackgroundColor,
      ctaBackgroundColor: pageRecord.ctaBackgroundColor,
      eyebrow: landing?.eyebrow,
    },
  });

  const headingColorStyle = theme.headlineColor
    ? { color: theme.headlineColor }
    : undefined;
  const subheadingColorStyle = theme.subheadlineColor
    ? { color: theme.subheadlineColor }
    : undefined;
  const bodyColorStyle = theme.bodyColor
    ? { color: theme.bodyColor }
    : undefined;

  const centered = layoutType === "centered";
  const align = centered ? "text-center items-center" : "text-left items-start";
  const ctaHref = landingCtaHref?.trim() ? landingCtaHref.trim() : null;

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
        className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] ${theme.badgeClass} ${centered ? "mx-auto" : ""}`}
      >
        {theme.eyebrow}
      </span>
    ),
    heading: (
      <h1
        key="heading"
        className={`text-[1.65rem] font-bold leading-[1.15] ${headingColorStyle ? "" : theme.headingClass} ${centered ? "mx-auto max-w-[18ch]" : ""}`}
        style={headingColorStyle}
      >
        {page.heading}
      </h1>
    ),
    subheading: (
      <p
        key="subheading"
        className={`text-base font-medium leading-snug ${subheadingColorStyle ? "" : theme.subheadingClass} ${centered ? "mx-auto max-w-prose" : "max-w-prose"}`}
        style={subheadingColorStyle}
      >
        {page.subheading}
      </p>
    ),
    divider: (
      <div
        key="divider"
        className={`h-px w-12 ${theme.dividerClass} ${centered ? "mx-auto" : ""}`}
        aria-hidden
      />
    ),
    body: (
      <LandingBody
        key="body"
        body={page.body}
        centered={centered}
        bodyClass={theme.bodyClass}
        colorStyle={bodyColorStyle}
      />
    ),
    cta: (
      <LandingCta
        key="cta"
        label={page.buttonText}
        href={ctaHref}
        centered={centered}
        primary={theme.ctaBackground}
        secondary={theme.ctaBackgroundEnd}
        labelColor={theme.ctaTextColor}
        onButtonClick={onButtonClick}
      />
    ),
    trust: (
      <p
        key="trust"
        className={`text-[0.65rem] ${theme.trustClass} ${centered ? "text-center" : ""}`}
      >
        {theme.trustLine}
      </p>
    ),
  };

  const hero = showTopHero ? (
    <LandingHero
      url={heroImageUrl}
      scale={heroImageScale}
      fadeColor={theme.background}
      placeholderClass={theme.heroPlaceholderClass}
      heroStyle={heroStyle}
    />
  ) : null;

  const isArchHero = heroStyle.previewKind === "arch";
  const contentPadClass = isArchHero
    ? "relative z-[1] -mt-6 px-6 pb-10 pt-8"
    : "px-6 pb-10 pt-7";

  const content = (
    <div
      className={`flex flex-col gap-5 ${align} ${contentPadClass} ${fillViewport ? "min-h-0 flex-1" : ""}`}
      style={pageBackgroundStyle(theme.background, theme.background)}
    >
      {sectionOrder.map((sectionId) => (
        <SelectableSectionShell
          key={sectionId}
          sectionId={sectionId}
          enabled={editorSelectEnabled}
          selected={selectedSectionId === sectionId}
          onSelect={onSelectSection}
        >
          {sectionNodes[sectionId]}
        </SelectableSectionShell>
      ))}
    </div>
  );

  const rootClass = "flex w-full min-w-0 flex-col overflow-x-hidden";
  const rootStyle = pageBackgroundStyle(theme.background, theme.background);

  if (layoutType === "split") {
    return (
      <div className={rootClass} style={rootStyle}>
        {hero}
        {content}
      </div>
    );
  }

  return (
    <div className={rootClass} style={rootStyle}>
      {hero}
      {content}
    </div>
  );
}
