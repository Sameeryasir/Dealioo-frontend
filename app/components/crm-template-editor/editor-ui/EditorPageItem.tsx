"use client";

import { Pencil } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  editorFunnelStepIconIdleClass,
  editorFunnelStepIconSelectedClass,
  editorFunnelStepIdleClass,
  editorFunnelStepSelectedClass,
} from "@/app/components/crm-template-editor/editor-sidebar-theme";

export function EditorPageItem({
  title,
  description,
  icon: Icon,
  selected,
  stepNumber,
  onSelect,
  onEdit,
  compact = false,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  selected: boolean;
  stepNumber: number;
  onSelect: () => void;
  onEdit: () => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div
        className={`group relative min-h-[5.5rem] overflow-hidden rounded-xl border bg-white shadow-[0_4px_14px_rgba(15,23,42,0.05)] transition-all duration-200 lg:min-h-[6.25rem] ${
          selected
            ? "border-[#1877f2]/35 ring-1 ring-[#1877f2]/15"
            : "border-[#e8edf5] hover:border-[#1877f2]/20 hover:shadow-[0_6px_18px_rgba(24,119,242,0.08)]"
        }`}
      >
        {selected ? (
          <span
            className="absolute bottom-2 left-0 top-2 w-0.5 rounded-r-full bg-[#1877f2]"
            aria-hidden
          />
        ) : null}

        <button
          type="button"
          onClick={onSelect}
          title={title}
          className="flex h-full w-full min-w-0 flex-col items-center justify-center gap-1.5 px-2 py-3 text-center max-lg:flex-row max-lg:justify-start max-lg:gap-2.5 max-lg:px-2.5 max-lg:py-2.5 max-lg:text-left lg:gap-2 lg:px-2.5 lg:py-3.5"
        >
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-full lg:size-10 ${
              selected
                ? editorFunnelStepIconSelectedClass
                : editorFunnelStepIconIdleClass
            }`}
          >
            <Icon className="size-4 lg:size-[1.15rem]" strokeWidth={2.25} aria-hidden />
          </span>

          <span className="w-full min-w-0 text-center text-[0.72rem] font-extrabold leading-tight text-[#07111f] max-lg:flex-1 max-lg:truncate max-lg:text-left lg:text-[0.8rem]">
            {title}
          </span>
        </button>

        <button
          type="button"
          aria-label={`Edit ${title}`}
          title="Edit page"
          onClick={onEdit}
          className={`absolute right-1 top-1 flex size-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-[#e8f2ff] hover:text-[#1877f2] lg:right-1.5 lg:top-1.5 lg:size-7 ${
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <Pencil className="size-3 lg:size-3.5" strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`group relative flex items-stretch overflow-hidden rounded-[1.05rem] border transition-all duration-200 ${
        selected ? editorFunnelStepSelectedClass : editorFunnelStepIdleClass
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
          className={`relative flex size-8 shrink-0 items-center justify-center rounded-xl font-extrabold text-[0.65rem] ${
            selected
              ? editorFunnelStepIconSelectedClass
              : editorFunnelStepIconIdleClass
          }`}
        >
          <Icon className="size-4" strokeWidth={2.25} aria-hidden />
          {!selected ? (
            <span
              className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-white text-[0.5rem] font-bold text-[#1877f2] ring-1 ring-[#e8edf5]"
              aria-hidden
            >
              {stepNumber}
            </span>
          ) : null}
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
