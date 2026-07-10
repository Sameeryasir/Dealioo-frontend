"use client";

import { Eye, Pencil } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  editorFunnelStepIconIdleClass,
  editorFunnelStepIconSelectedClass,
} from "@/app/components/crm-template-editor/editor-sidebar-theme";

export function EditorPageItem({
  title,
  description,
  icon: Icon,
  thumbSrc,
  selected,
  onSelect,
  onEdit,
  onPreview,
  compact = false,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  thumbSrc?: string;
  selected: boolean;
  stepNumber?: number;
  onSelect: () => void;
  onEdit: () => void;
  onPreview?: () => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div
        className={`group relative flex min-h-[5rem] items-center overflow-hidden rounded-[1.1rem] border transition-all duration-200 ${
          selected
            ? "border-[#1877f2]/30 bg-[#f4f8ff] shadow-[0_4px_14px_rgba(24,119,242,0.08)]"
            : "border-[#e8edf5] bg-white hover:border-[#1877f2]/20 hover:bg-[#fafcff]"
        }`}
      >
        {selected ? (
          <span
            className="absolute bottom-3 left-0 top-3 w-0.5 rounded-r-full bg-[#1877f2]"
            aria-hidden
          />
        ) : null}

        <button
          type="button"
          onClick={onSelect}
          title={`${title} — ${description}`}
          className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-4 text-left"
        >
          {thumbSrc ? (
            <span
              className={`editor-funnel-step-thumb flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#f4f8ff] to-white ring-1 ring-[#e8edf5] ${
                selected ? "editor-funnel-step-thumb--selected" : ""
              }`}
            >
              <img
                src={`${thumbSrc}?v=1`}
                alt=""
                className="size-[3.35rem] object-contain drop-shadow-[0_3px_8px_rgba(24,119,242,0.2)]"
                loading="lazy"
                decoding="async"
                aria-hidden
              />
            </span>
          ) : (
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                selected
                  ? editorFunnelStepIconSelectedClass
                  : editorFunnelStepIconIdleClass
              }`}
            >
              <Icon className="size-4" strokeWidth={2.25} aria-hidden />
            </span>
          )}

          <span className="min-w-0 flex-1">
            <span className="block text-[0.9rem] font-extrabold leading-tight tracking-tight text-[#07111f]">
              {title}
            </span>
          </span>
        </button>

        <div className="mr-2.5 flex shrink-0 items-center gap-1">
          {onPreview ? (
            <button
              type="button"
              aria-label={`Preview ${title}`}
              title="Preview live page"
              onClick={onPreview}
              className={`flex size-10 items-center justify-center rounded-lg transition ${
                selected
                  ? "text-[#1877f2] hover:bg-[#1877f2]/10"
                  : "text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-[#e8f2ff] hover:text-[#1877f2]"
              }`}
            >
              <Eye className="size-4" strokeWidth={2.25} aria-hidden />
            </button>
          ) : null}

          <button
            type="button"
            aria-label={`Edit ${title}`}
            title="Edit page"
            onClick={onEdit}
            className={`flex size-10 items-center justify-center rounded-lg transition ${
              selected
                ? "text-[#1877f2] hover:bg-[#1877f2]/10"
                : "text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-[#e8f2ff] hover:text-[#1877f2]"
            }`}
          >
            <Pencil className="size-4" strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative flex items-stretch overflow-hidden rounded-[1.05rem] border transition-all duration-200 ${
        selected
          ? "border-[#1877f2]/30 bg-[#f4f8ff] shadow-[0_6px_18px_rgba(24,119,242,0.1)] ring-1 ring-[#1877f2]/15"
          : "border-[#e8edf5] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)] hover:border-[#1877f2]/20 hover:bg-[#fafcff]"
      }`}
    >
      {selected ? (
        <span
          className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-[#1877f2]"
          aria-hidden
        />
      ) : null}

      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2.5 text-left"
      >
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${
            selected
              ? editorFunnelStepIconSelectedClass
              : editorFunnelStepIconIdleClass
          }`}
        >
          <Icon className="size-4" strokeWidth={2.25} aria-hidden />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[0.8125rem] font-extrabold leading-tight tracking-tight text-[#07111f]">
            {title}
          </span>
          <span
            className={`mt-0.5 block truncate text-[0.65rem] leading-snug ${
              selected ? "text-[#1877f2]/80" : "text-slate-500"
            }`}
          >
            {description}
          </span>
        </span>
      </button>

      <button
        type="button"
        aria-label={`Edit ${title}`}
        title="Edit page"
        onClick={onEdit}
        className={`flex shrink-0 items-center justify-center px-2.5 py-2.5 transition ${
          selected
            ? "text-[#1877f2] hover:bg-[#1877f2]/10"
            : "text-slate-400 opacity-70 group-hover:opacity-100 hover:bg-[#e8f2ff] hover:text-[#1877f2]"
        }`}
      >
        <Pencil className="size-3.5" strokeWidth={2.25} aria-hidden />
      </button>
    </div>
  );
}
