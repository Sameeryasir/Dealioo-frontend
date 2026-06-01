"use client";

import type { CSSProperties, FormEvent } from "react";
import Link from "next/link";
import { SignupFormFields } from "@/app/components/crm-template-editor/form-designs/SignupFormFields";
import { LandingFunnelStepShell } from "@/app/components/crm-template-editor/LandingFunnelStepShell";
import { isLandingDesignDark } from "@/app/components/crm-template-editor/landing-blended-form-styles";
import {
  getLandingDesignStyle,
  normalizeLandingDesign,
} from "@/app/components/crm-template-editor/landing-designs/registry";
import { textColorStyle } from "@/app/components/crm-template-editor/landing-content-colors";
import type {
  LandingTemplatePage,
  SignUpTemplatePage,
} from "@/app/components/crm-template-editor/template-types";

function SignupBody({
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

export function SignupPagePreview({
  signupPage,
  landingPage,
  heroImageUrl,
  heroImageScale,
  signupBackHref,
  signupNextHref,
  interactiveForms = false,
  signupSubmitFlow = false,
  signupSubmitting = false,
  onSignupSubmit,
  onButtonClick,
}: {
  signupPage: SignUpTemplatePage;
  landingPage: LandingTemplatePage;
  heroImageUrl: string;
  heroImageScale: number;
  signupBackHref: string | null;
  signupNextHref: string | null;
  interactiveForms?: boolean;
  signupSubmitFlow?: boolean;
  signupSubmitting?: boolean;
  onSignupSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  onButtonClick?: (elementName: string) => void;
}) {
  const landingDesign = normalizeLandingDesign(landingPage.landingDesign);
  const landingStyle = getLandingDesignStyle(landingDesign);
  const isDark = isLandingDesignDark(landingDesign);
  const layoutType = landingPage.layoutType;
  const centered = layoutType === "centered";

  const bodyColorStyle = textColorStyle(landingPage.bodyColor);

  const signupBackAsLink = signupBackHref?.trim() ? signupBackHref.trim() : null;
  const signupNextAsLink = signupNextHref?.trim() ? signupNextHref.trim() : null;

  const secondaryClass = isDark
    ? "inline-flex min-w-[8.5rem] flex-1 items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition hover:bg-white/15 active:scale-[0.99] sm:flex-none sm:min-w-36"
    : "inline-flex min-w-[8.5rem] flex-1 items-center justify-center rounded-2xl border border-zinc-200/90 bg-white/80 px-5 py-3 text-sm font-semibold text-zinc-800 shadow-sm ring-1 ring-zinc-950/5 transition hover:bg-white active:scale-[0.99] sm:flex-none sm:min-w-36";

  const primaryClass = [
    "inline-flex min-w-[8.5rem] flex-1 items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105 active:scale-[0.99] sm:flex-none sm:min-w-36",
    landingStyle.ctaShadow,
    signupSubmitting ? "cursor-not-allowed opacity-60" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const primaryStyle: CSSProperties = {
    background: `linear-gradient(135deg, ${landingStyle.primary} 0%, ${landingStyle.secondary} 100%)`,
  };

  const back =
    signupBackAsLink != null ? (
      <Link
        href={signupBackAsLink}
        className={secondaryClass}
        onClick={() => onButtonClick?.(signupPage.navBackLabel)}
      >
        {signupPage.navBackLabel}
      </Link>
    ) : (
      <button
        type="button"
        className={secondaryClass}
        onClick={() => onButtonClick?.(signupPage.navBackLabel)}
      >
        {signupPage.navBackLabel}
      </button>
    );

  const next = signupSubmitFlow ? (
    <button
      type="submit"
      disabled={signupSubmitting}
      className={primaryClass}
      style={primaryStyle}
      onClick={() => onButtonClick?.(signupPage.navNextLabel)}
    >
      {signupPage.navNextLabel}
    </button>
  ) : signupNextAsLink != null ? (
    <Link
      href={signupNextAsLink}
      className={primaryClass}
      style={primaryStyle}
      onClick={() => onButtonClick?.(signupPage.navNextLabel)}
    >
      {signupPage.navNextLabel}
    </Link>
  ) : (
    <button
      type="button"
      className={primaryClass}
      style={primaryStyle}
      onClick={() => onButtonClick?.(signupPage.navNextLabel)}
    >
      {signupPage.navNextLabel}
    </button>
  );

  const inner = (
    <>
      <span
        className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] ${landingStyle.badgeClass} ${centered ? "mx-auto" : ""}`}
      >
        {landingStyle.eyebrow}
      </span>

      <div
        className={`mt-4 h-px w-12 ${landingStyle.dividerClass} ${centered ? "mx-auto" : ""}`}
        aria-hidden
      />

      <SignupBody
        body={signupPage.body}
        centered={centered}
        bodyClass={landingStyle.bodyClass}
        colorStyle={bodyColorStyle}
      />

      <div className="mt-6 w-full min-w-0">
        <SignupFormFields
          fieldIds={signupPage.formFieldIds}
          design={signupPage.formDesign}
          interactive={interactiveForms}
          omitInteractiveForm={signupSubmitFlow}
          blendWithLandingDesign={landingDesign}
        />
      </div>

      <div className="mt-8 flex w-full flex-wrap justify-center gap-2.5">
        {back}
        {next}
      </div>

      <p
        className={`mt-4 text-[0.65rem] ${landingStyle.trustClass} ${centered ? "text-center" : ""}`}
      >
        {landingStyle.trustLine}
      </p>
    </>
  );

  const content = signupSubmitFlow ? (
    <form className="contents" onSubmit={onSignupSubmit}>
      {inner}
    </form>
  ) : (
    inner
  );

  return (
    <LandingFunnelStepShell
      landingPage={landingPage}
      heroImageUrl={heroImageUrl}
      heroImageScale={heroImageScale}
    >
      {content}
    </LandingFunnelStepShell>
  );
}
