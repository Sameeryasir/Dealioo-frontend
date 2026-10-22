"use client";

import { Check } from "lucide-react";
import { FormDesignMiniPreview } from "@/app/components/crm-template-editor/form-designs/FormDesignMiniPreview";
import { getFormDesignStyle } from "@/app/components/crm-template-editor/form-designs/registry";
import type {
  FormDesign,
  FormSwatchKind,
} from "@/app/components/crm-template-editor/form-designs/types";

const FORM_TYPE_LABELS: Record<FormSwatchKind, string> = {
  card: "Card",
  split: "Split",
  dark: "Dark",
  neon: "Neon",
  underline: "Underline",
  glass: "Glass",
  gold: "Luxury",
  rounded: "Rounded",
  pill: "Pill",
};

export function FormDesignPickerCard({
  design,
  label,
  description,
  selected,
  onSelect,
}: {
  design: FormDesign;
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const typeLabel = FORM_TYPE_LABELS[getFormDesignStyle(design).swatchKind];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        "group relative overflow-hidden rounded-xl border bg-white p-2 text-left shadow-[0_4px_12px_rgba(15,23,42,0.04)] transition duration-200",
        selected
          ? "border-[#93c5fd] shadow-[0_8px_18px_rgba(24,119,242,0.14)] ring-2 ring-[#1877f2]/20"
          : "border-[#e8edf5] hover:-translate-y-px hover:border-[#93c5fd] hover:shadow-[0_8px_18px_rgba(24,119,242,0.1)]",
      ].join(" ")}
    >
      {selected ? (
        <span className="absolute right-2 top-2 z-10 flex size-5 items-center justify-center rounded-full bg-[#1877f2] text-white shadow-[0_4px_10px_rgba(24,119,242,0.3)]">
          <Check className="size-3" strokeWidth={3} aria-hidden />
        </span>
      ) : null}

      <FormDesignMiniPreview design={design} wide />

      <div className="mt-2 min-w-0 px-0.5">
        <span className="inline-flex items-center rounded-full bg-[#e8f1ff] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#1877f2] ring-1 ring-[#dbeafe]">
          {typeLabel}
        </span>
        <p className="mt-1 truncate text-[0.78rem] font-bold tracking-tight text-[#0e182b]">
          {label}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[0.62rem] leading-snug text-slate-500">
          {description}
        </p>
      </div>
    </button>
  );
}
