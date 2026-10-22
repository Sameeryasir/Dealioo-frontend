"use client";

import { Eye } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function EditorPageItem({
  title,
  subtitle,
  description,
  icon: Icon,
  iconWrapClass,
  selected,
  stepNumber,
  onSelect,
  onPreview,
  compact = false,
  isLast = false,
}: {
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  iconWrapClass: string;
  thumbSrc?: string;
  selected: boolean;
  stepNumber?: number;
  onSelect: () => void;
  onPreview?: () => void;
  compact?: boolean;
  isLast?: boolean;
}) {
  const stepLabel =
    stepNumber != null ? String(stepNumber).padStart(2, "0") : null;

  return (
    <div className={`relative flex gap-3 ${compact ? "pb-2.5" : "pb-3"}`}>
      <div className="relative flex w-4 shrink-0 flex-col items-center">
        <span
          className={`relative z-[1] mt-4 size-2.5 rounded-full transition ${
            selected
              ? "bg-[#1877f2] shadow-[0_0_0_4px_rgba(24,119,242,0.18)]"
              : "border-2 border-slate-300 bg-white"
          }`}
          aria-hidden
        />
        {!isLast ? (
          <span
            className="absolute top-7 bottom-0 w-px bg-gradient-to-b from-slate-300 to-slate-200"
            aria-hidden
          />
        ) : null}
      </div>

      <div
        className={`group relative min-w-0 flex-1 overflow-hidden rounded-2xl border transition duration-200 ${
          selected
            ? "border-[#bfdbfe] bg-gradient-to-br from-[#f4f8ff] to-white shadow-[0_10px_24px_rgba(24,119,242,0.1)]"
            : "border-slate-200/90 bg-white hover:-translate-y-px hover:border-[#bfdbfe] hover:shadow-[0_8px_18px_rgba(15,23,42,0.06)]"
        }`}
      >
        {selected ? (
          <span
            className="absolute bottom-0 left-0 top-0 w-[3px] bg-[#1877f2]"
            aria-hidden
          />
        ) : null}

        <button
          type="button"
          onClick={onSelect}
          title={`${title} — ${subtitle}`}
          aria-current={selected ? "page" : undefined}
          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
        >
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${iconWrapClass}`}
          >
            <Icon className="size-4" strokeWidth={2.15} aria-hidden />
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              {stepLabel ? (
                <span
                  className={`shrink-0 text-[0.62rem] font-bold tabular-nums tracking-[0.08em] ${
                    selected ? "text-[#1877f2]" : "text-slate-400"
                  }`}
                >
                  {stepLabel}
                </span>
              ) : null}
              <span
                className={`truncate text-[0.84rem] leading-tight ${
                  selected
                    ? "font-bold text-[#0e182b]"
                    : "font-semibold text-[#0e182b]"
                }`}
              >
                {title}
              </span>
            </span>
            <span className="mt-0.5 block truncate text-[0.68rem] font-medium text-slate-500">
              {compact ? subtitle : description}
            </span>
          </span>
        </button>

        {selected && onPreview ? (
          <div className="border-t border-[#e8edf5]/90 px-3 pb-2.5 pt-2">
            <button
              type="button"
              aria-label={`Preview ${title}`}
              title="Preview live page"
              onClick={onPreview}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#bfdbfe] bg-white px-2.5 py-1.5 text-[0.7rem] font-semibold text-[#1877f2] transition hover:bg-[#e8f1ff]"
            >
              <Eye className="size-3.5" strokeWidth={2.15} aria-hidden />
              Preview this step
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
