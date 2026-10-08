"use client";

export type AdSourceBadgeProps = {
  source?: "meta" | "google" | "utm" | null;
  label?: string | null;
  detail?: string | null;
  className?: string;
};

export function AdSourceBadge({
  source,
  label,
  detail,
  className = "",
}: AdSourceBadgeProps) {
  const resolvedSource =
    source === "meta" || source === "google" || source === "utm"
      ? source
      : null;

  const resolvedLabel =
    resolvedSource === "meta"
      ? label?.trim() || "Facebook"
      : resolvedSource === "google"
        ? label?.trim() || "Google"
        : label?.trim() || null;

  if (!resolvedSource || !resolvedLabel) {
    return (
      <span className={`text-xs text-slate-400 ${className}`.trim()}>—</span>
    );
  }

  const tone =
    resolvedSource === "meta"
      ? "bg-[#e8f2ff] text-[#1877f2]"
      : resolvedSource === "google"
        ? "bg-[#ecfdf5] text-[#047857]"
        : "bg-[#f1f5f9] text-slate-600";

  const title = detail?.trim()
    ? `${resolvedLabel} · ${detail.trim()}`
    : resolvedLabel;

  return (
    <span
      title={title}
      className={`inline-flex max-w-[10rem] truncate rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${tone} ${className}`.trim()}
    >
      {resolvedLabel}
    </span>
  );
}
