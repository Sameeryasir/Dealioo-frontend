import type { CSSProperties } from "react";
import { getFormDesignStyle } from "@/app/components/crm-template-editor/form-designs/registry";
import type { FormDesign } from "@/app/components/crm-template-editor/form-designs/types";
import {
  blendFormDesignWithLanding,
  isLandingDesignDark,
} from "@/app/components/crm-template-editor/landing-blended-form-styles";

export type CheckoutFormStyles = {
  labelClass: string;
  fieldClass: string;
  rowClass: string;
  fieldsContainerClass: string;
  shellClass: string;
  isDark: boolean;
  cssVars: CSSProperties;
};

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (full.length !== 6) return `rgba(24, 24, 27, ${alpha})`;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return `rgba(24, 24, 27, ${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function stripNeutralBorders(className: string): string {
  return className
    .replace(/\bborder-zinc-200\/\d+\b/g, "")
    .replace(/\bborder-zinc-300\/\d+\b/g, "")
    .replace(/\bborder-zinc-200\b/g, "")
    .replace(/\bborder-zinc-300\b/g, "")
    .replace(/\bborder-white\/\d+\b/g, "")
    .replace(/\bring-zinc-950\/\[\d+\.?\d*\]\b/g, "")
    .replace(/\bring-white\/\d+\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function withLandingAccentBorders(className: string): string {
  return [
    stripNeutralBorders(className),
    "border-[color:var(--cf-accent-muted)]",
  ]
    .filter(Boolean)
    .join(" ");
}

export function getCheckoutFormStyles(
  formDesign: FormDesign,
  options?: {
    landingDesignId?: string | null;
    blendWithLanding?: boolean;
  },
): CheckoutFormStyles {
  const blend = Boolean(options?.blendWithLanding && options.landingDesignId);

  if (blend) {
    const style = blendFormDesignWithLanding(
      formDesign,
      options!.landingDesignId!,
    );
    const isDark = isLandingDesignDark(options!.landingDesignId!);
    const fieldTinted = withLandingAccentBorders(style.fieldClass);
    const shellBase = style.shellClass.trim()
      ? withLandingAccentBorders(style.shellClass)
      : "rounded-2xl border p-4 shadow-sm";
    const shellClass = [
      shellBase,
      "border-[color:var(--cf-accent-muted)]",
      "bg-[color:var(--cf-surface)]",
      "ring-1 ring-[color:var(--cf-accent-soft)]",
    ].join(" ");

    const fieldBase = `${fieldTinted} w-full text-left outline-none px-3 text-sm bg-[color:var(--cf-field-bg)]`;
    const fieldClass = isDark
      ? `${fieldBase} text-white placeholder:text-white/45 focus-visible:ring-2 focus-visible:ring-[color:var(--cf-accent)] focus-visible:border-[color:var(--cf-accent)]`
      : `${fieldBase} text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-[color:var(--cf-accent)] focus-visible:border-[color:var(--cf-accent)]`;

    const labelClass = [
      stripNeutralBorders(style.labelClass),
      "w-full text-left",
      "text-[color:var(--cf-accent)]",
    ].join(" ");

    return {
      labelClass,
      fieldClass,
      rowClass: style.rowClass,
      fieldsContainerClass: style.fieldsContainerClass,
      shellClass,
      isDark,
      cssVars: {
        ["--cf-accent" as string]: style.primary,
        ["--cf-accent-muted" as string]: hexToRgba(style.primary, 0.45),
        ["--cf-accent-soft" as string]: hexToRgba(style.primary, 0.22),
        ["--cf-surface" as string]: isDark
          ? hexToRgba(style.primary, 0.22)
          : hexToRgba(style.primary, 0.14),
        ["--cf-field-bg" as string]: isDark
          ? hexToRgba("#ffffff", 0.08)
          : hexToRgba("#ffffff", 0.92),
        ["--cf-secondary" as string]: style.secondary,
      },
    };
  }

  const style = getFormDesignStyle(formDesign);
  const isDark = formDesign === "dark_mode_form";
  const fieldBase = `${style.fieldClass} w-full text-left outline-none px-3 text-sm`;
  const fieldClass = isDark
    ? `${fieldBase} text-white placeholder:text-white/45 focus-visible:ring-2 focus-visible:ring-white/20`
    : `${fieldBase} text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-900/10`;

  return {
    labelClass: `${style.labelClass} w-full text-left`,
    fieldClass,
    rowClass: style.rowClass,
    fieldsContainerClass: style.fieldsContainerClass,
    shellClass: style.shellClass,
    isDark,
    cssVars: {},
  };
}

export function checkoutPreviewFieldShell(formStyles: CheckoutFormStyles): string {
  return [
    formStyles.fieldClass,
    "flex min-h-11 items-center gap-2",
    formStyles.isDark ? "text-zinc-400" : "text-zinc-500",
  ].join(" ");
}

export function checkoutStripeFieldShell(formStyles: CheckoutFormStyles): string {
  return [
    checkoutPreviewFieldShell(formStyles),
    "py-2.5 [&_.StripeElement]:w-full [&_.StripeElement]:min-w-0",
  ].join(" ");
}
