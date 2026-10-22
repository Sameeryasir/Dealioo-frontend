"use client";

import { getFormDesignStyle } from "@/app/components/crm-template-editor/form-designs/registry";
import type { FormDesign } from "@/app/components/crm-template-editor/form-designs/types";

/** Gallery-style form thumbnail — same visual language as template cards. */
export function FormDesignMiniPreview({
  design,
  wide = false,
}: {
  design: FormDesign;
  wide?: boolean;
}) {
  const style = getFormDesignStyle(design);
  const isDark =
    style.swatchKind === "dark" || style.swatchKind === "neon";
  const isUnderline = style.swatchKind === "underline";
  const isGlass = style.swatchKind === "glass";
  const isGold = style.swatchKind === "gold";
  const isPill = style.swatchKind === "pill";

  const pageBg = isDark
    ? "#0f172a"
    : isGold
      ? "#fffbeb"
      : isGlass
        ? "#e0f2fe"
        : "#f8fafc";
  const panelBg = isDark ? "#1e293b" : "#ffffff";
  const fieldBorder = isDark
    ? "rgba(148,163,184,0.35)"
    : "rgba(148,163,184,0.45)";
  const fieldFill = isDark ? "rgba(15,23,42,0.65)" : "#f8fafc";
  const labelColor = isDark ? "#94a3b8" : "#94a3b8";
  const ctaBg = isDark
    ? "#22d3ee"
    : isGold
      ? "#d97706"
      : "#1877f2";
  const ctaText = isDark ? "#0f172a" : "#ffffff";

  const fieldRadius = isPill
    ? "999px"
    : isUnderline
      ? "0"
      : style.swatchKind === "rounded"
        ? "10px"
        : "8px";

  if (!wide) {
    return (
      <div
        className="relative h-11 w-[4.25rem] shrink-0 overflow-hidden rounded-lg border border-black/[0.06]"
        style={{ backgroundColor: pageBg }}
        aria-hidden
      >
        <div
          className="absolute inset-x-1 bottom-1 top-1.5 rounded-md p-1"
          style={{ backgroundColor: panelBg }}
        >
          <div
            className="mb-1 h-1.5 w-full"
            style={{
              borderRadius: fieldRadius,
              backgroundColor: fieldFill,
              borderBottom: isUnderline ? `2px solid ${fieldBorder}` : undefined,
              boxShadow: isUnderline
                ? "none"
                : `inset 0 0 0 1px ${fieldBorder}`,
            }}
          />
          <div
            className="h-1.5 w-[70%]"
            style={{
              borderRadius: fieldRadius,
              backgroundColor: ctaBg,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-[4.75rem] w-full overflow-hidden rounded-lg border border-black/[0.05]"
      style={{ backgroundColor: pageBg }}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background: isDark
            ? "radial-gradient(ellipse at 30% 20%, rgba(34,211,238,0.18), transparent 55%)"
            : "radial-gradient(ellipse at 70% 0%, rgba(24,119,242,0.12), transparent 50%)",
        }}
      />

      <div
        className="absolute inset-x-2 bottom-2 top-2 flex flex-col gap-1 rounded-lg p-1.5 shadow-[0_4px_12px_rgba(15,23,42,0.1)] ring-1 ring-black/[0.04]"
        style={{
          backgroundColor: isGlass ? "rgba(255,255,255,0.55)" : panelBg,
          backdropFilter: isGlass ? "blur(6px)" : undefined,
        }}
      >
        <div
          className="h-0.5 w-8 rounded-full"
          style={{ backgroundColor: labelColor }}
        />
        <div
          className="h-2.5 w-full"
          style={{
            borderRadius: fieldRadius,
            backgroundColor: fieldFill,
            borderBottom: isUnderline ? `2px solid ${fieldBorder}` : undefined,
            boxShadow: isUnderline ? "none" : `inset 0 0 0 1px ${fieldBorder}`,
          }}
        />
        <div
          className="h-0.5 w-6 rounded-full"
          style={{ backgroundColor: labelColor }}
        />
        <div
          className="h-2.5 w-full"
          style={{
            borderRadius: fieldRadius,
            backgroundColor: fieldFill,
            borderBottom: isUnderline ? `2px solid ${fieldBorder}` : undefined,
            boxShadow: isUnderline ? "none" : `inset 0 0 0 1px ${fieldBorder}`,
          }}
        />
        <div
          className="mt-auto h-3.5 w-full rounded-md shadow-sm"
          style={{ backgroundColor: ctaBg, color: ctaText }}
        />
      </div>
    </div>
  );
}
