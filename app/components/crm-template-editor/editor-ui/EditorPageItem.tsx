"use client";

import { Eye } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  editorFunnelStepIconIdleClass,
  editorFunnelStepIconSelectedClass,
} from "@/app/components/crm-template-editor/editor-sidebar-theme";

export function EditorPageItem({
  title,
  description,
  icon: Icon,
  selected,
  onSelect,
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
  onPreview?: () => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div
        className={`group relative flex items-center transition-colors duration-150 ${
          selected ? "bg-slate-50" : "hover:bg-slate-50/70"
        }`}
      >
        {selected ? (
          <span
            className="absolute bottom-0 left-0 top-0 w-0.5 bg-[#1877f2]"
            aria-hidden
          />
        ) : null}

        <button
          type="button"
          onClick={onSelect}
          title={`${title} — ${description}`}
          className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-left"
        >
          <span
            className={`flex size-7 shrink-0 items-center justify-center rounded-md ${
              selected
                ? editorFunnelStepIconSelectedClass
                : editorFunnelStepIconIdleClass
            }`}
          >
            <Icon className="size-3.5" strokeWidth={2} aria-hidden />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-[0.8125rem] font-semibold leading-tight text-slate-900">
              {title}
            </span>
            <span className="mt-0.5 block truncate text-[0.7rem] font-normal text-slate-500">
              {description}
            </span>
          </span>
        </button>

        {onPreview ? (
          <div className="mr-2 flex shrink-0 items-center">
            <button
              type="button"
              aria-label={`Preview ${title}`}
              title="Preview live page"
              onClick={onPreview}
              className={`flex size-7 items-center justify-center rounded-md transition ${
                selected
                  ? "text-[#1877f2] hover:bg-[#e8f2ff]"
                  : "text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-[#e8f2ff] hover:text-[#1877f2]"
              }`}
            >
              <Eye className="size-3.5" strokeWidth={2} aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`group relative flex items-stretch transition-colors duration-150 ${
        selected ? "bg-slate-50" : "hover:bg-slate-50/70"
      }`}
    >
      {selected ? (
        <span
          className="absolute bottom-0 left-0 top-0 w-0.5 bg-[#1877f2]"
          aria-hidden
        />
      ) : null}

      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-left"
      >
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-md ${
            selected
              ? editorFunnelStepIconSelectedClass
              : editorFunnelStepIconIdleClass
          }`}
        >
          <Icon className="size-3.5" strokeWidth={2} aria-hidden />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[0.8125rem] font-semibold leading-tight text-slate-900">
            {title}
          </span>
          <span
            className={`mt-0.5 block truncate text-[0.7rem] ${
              selected ? "text-slate-600" : "text-slate-500"
            }`}
          >
            {description}
          </span>
        </span>
      </button>

      {onPreview ? (
        <button
          type="button"
          aria-label={`Preview ${title}`}
          title="Preview live page"
          onClick={onPreview}
          className={`flex shrink-0 items-center justify-center px-2.5 transition ${
            selected
              ? "text-[#1877f2] hover:text-[#166fe0]"
              : "text-slate-400 opacity-70 group-hover:opacity-100 hover:text-[#1877f2]"
          }`}
        >
          <Eye className="size-3.5" strokeWidth={2} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
