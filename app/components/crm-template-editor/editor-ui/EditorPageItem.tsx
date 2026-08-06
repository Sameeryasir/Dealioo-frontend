"use client";

import { ChevronRight, Eye } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function EditorPageItem({
  title,
  subtitle,
  description,
  icon: Icon,
  iconWrapClass,
  selected,
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
  return (
    <div className={`relative flex gap-2.5 ${compact ? "pb-2" : "pb-2.5"}`}>
      <div className="relative flex w-3.5 shrink-0 flex-col items-center">
        <span
          className={`relative z-[1] mt-3.5 size-2.5 rounded-full ${
            selected
              ? "bg-[#1877f2] shadow-[0_0_0_3px_rgba(24,119,242,0.16)]"
              : "border-2 border-[#cbd5e1] bg-white"
          }`}
          aria-hidden
        />
        {!isLast ? (
          <span
            className="absolute top-6 bottom-0 w-px bg-[#e2e8f0]"
            aria-hidden
          />
        ) : null}
      </div>

      <div
        className={`group relative min-w-0 flex-1 overflow-hidden rounded-[0.85rem] border transition duration-150 ${
          selected
            ? "border-[#dbeafe] bg-white shadow-[0_6px_16px_rgba(24,119,242,0.08)]"
            : "border-[#e8edf5] bg-white hover:border-[#dbeafe]"
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
          className="flex w-full items-center gap-2 px-2.5 py-2 text-left"
        >
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-[0.6rem] ${iconWrapClass}`}
          >
            <Icon className="size-3.5" strokeWidth={2.15} aria-hidden />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-[0.8rem] font-extrabold leading-tight text-[#0e182b]">
              {title}
            </span>
            <span className="mt-0.5 block truncate text-[0.68rem] font-semibold text-slate-500">
              {subtitle}
            </span>
            <span className="mt-0.5 block truncate text-[0.62rem] font-medium text-slate-400">
              {description}
            </span>
          </span>

          {!selected ? (
            <ChevronRight
              className="size-3.5 shrink-0 text-slate-300 transition group-hover:text-[#1877f2]"
              aria-hidden
            />
          ) : null}
        </button>

        {selected && onPreview ? (
          <div className="border-t border-[#eef2f7] px-2.5 pb-2 pt-1.5">
            <button
              type="button"
              aria-label={`Preview ${title}`}
              title="Preview live page"
              onClick={onPreview}
              className="inline-flex w-full items-center justify-center gap-1 rounded-full border border-[#bfdbfe] bg-[#f4f8ff] px-2.5 py-1 text-[0.68rem] font-bold text-[#1877f2] transition hover:bg-[#e8f1ff]"
            >
              <Eye className="size-3" strokeWidth={2.15} aria-hidden />
              Preview
              <ChevronRight className="size-3" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
