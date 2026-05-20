"use client";

import { Pencil } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function EditorPageItem({
  title,
  description,
  icon: Icon,
  selected,
  onSelect,
  onEdit,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      className={`relative flex items-stretch overflow-hidden rounded-xl transition-colors ${
        selected
          ? "bg-zinc-900 shadow-md shadow-black/20"
          : "bg-transparent hover:bg-zinc-50"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className={`flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-2.5 text-left ${
          selected ? "text-white" : "text-zinc-900"
        }`}
      >
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
            selected
              ? "bg-white/12 text-white"
              : "bg-zinc-100 text-zinc-600"
          }`}
        >
          <Icon className="size-4" strokeWidth={2} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-[0.8125rem] font-semibold leading-tight ${
              selected ? "text-white" : "text-zinc-900"
            }`}
          >
            {title}
          </span>
          <span
            className={`mt-0.5 block truncate text-[0.65rem] leading-snug ${
              selected ? "text-white/65" : "text-zinc-500"
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
            ? "text-white/90 hover:bg-white/10"
            : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        }`}
      >
        <Pencil className="size-3.5" strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
