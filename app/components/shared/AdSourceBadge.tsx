"use client";

export type AdSourceBadgeProps = {
  source?: "meta" | "google" | "utm" | "in_store" | null;
  label?: string | null;
  detail?: string | null;
  className?: string;
  /**
   * When true, guests with no Facebook/Google ad match show "In store"
   * (campaign guests: walk-in vs paid ad).
   */
  showInStoreFallback?: boolean;
};

export function AdSourceBadge({
  source,
  label,
  detail,
  className = "",
  showInStoreFallback = false,
}: AdSourceBadgeProps) {
  // --- Campaign guest sources: only In store | Facebook | Google ---
  const resolvedSource =
    source === "meta" || source === "google"
      ? source
      : showInStoreFallback
        ? "in_store"
        : source === "in_store"
          ? "in_store"
          : source === "utm"
            ? "utm"
            : null;

  const resolvedLabel =
    resolvedSource === "meta"
      ? label?.trim() || "Facebook"
      : resolvedSource === "google"
        ? label?.trim() || "Google"
        : resolvedSource === "in_store"
          ? "In store"
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
        : resolvedSource === "in_store"
          ? "bg-[#fff7ed] text-[#c2410c]"
          : "bg-[#f1f5f9] text-slate-600";

  const title =
    resolvedSource === "in_store"
      ? "In store"
      : detail?.trim()
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
