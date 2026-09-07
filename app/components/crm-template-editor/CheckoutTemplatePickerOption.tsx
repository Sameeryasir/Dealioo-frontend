"use client";

import { Check } from "lucide-react";
import { CheckoutTemplateType } from "@/app/components/crm-template-editor/checkout-template-types";

const PREVIEW_STYLES: Record<
  CheckoutTemplateType,
  { bar: string; panel: string; accent: string }
> = {
  [CheckoutTemplateType.SHOPIFY]: {
    bar: "bg-zinc-800",
    panel: "bg-zinc-50",
    accent: "bg-emerald-600",
  },
  [CheckoutTemplateType.PREMIUM]: {
    bar: "bg-gradient-to-r from-violet-600 to-indigo-600",
    panel: "bg-violet-50",
    accent: "bg-violet-600",
  },
  [CheckoutTemplateType.MINIMAL]: {
    bar: "bg-white border border-zinc-200",
    panel: "bg-white",
    accent: "bg-zinc-900",
  },
  [CheckoutTemplateType.STRIPE]: {
    bar: "bg-[#635bff]",
    panel: "bg-white",
    accent: "bg-[#635bff]",
  },
  [CheckoutTemplateType.APPLE]: {
    bar: "bg-zinc-100",
    panel: "bg-white",
    accent: "bg-black",
  },
  [CheckoutTemplateType.FLOATING]: {
    bar: "bg-sky-100",
    panel: "bg-white shadow-lg",
    accent: "bg-sky-600",
  },
  [CheckoutTemplateType.SPLIT]: {
    bar: "bg-zinc-900",
    panel: "bg-zinc-100",
    accent: "bg-amber-500",
  },
  [CheckoutTemplateType.DARK]: {
    bar: "bg-zinc-950",
    panel: "bg-zinc-900",
    accent: "bg-violet-500",
  },
  [CheckoutTemplateType.CRM]: {
    bar: "bg-indigo-700",
    panel: "bg-indigo-50",
    accent: "bg-indigo-600",
  },
  [CheckoutTemplateType.COMPACT]: {
    bar: "bg-teal-700",
    panel: "bg-teal-50",
    accent: "bg-teal-600",
  },
  [CheckoutTemplateType.GRADIENT]: {
    bar: "bg-gradient-to-r from-rose-500 to-orange-400",
    panel: "bg-rose-50",
    accent: "bg-rose-600",
  },
  [CheckoutTemplateType.CARD]: {
    bar: "bg-blue-700",
    panel: "bg-blue-50",
    accent: "bg-blue-600",
  },
  [CheckoutTemplateType.BOLD]: {
    bar: "bg-red-700",
    panel: "bg-red-50",
    accent: "bg-red-600",
  },
};

export function CheckoutTemplatePickerOption({
  label,
  description,
  value,
  selected,
  onSelect,
}: {
  label: string;
  description: string;
  value: CheckoutTemplateType;
  selected: boolean;
  onSelect: () => void;
}) {
  const preview = PREVIEW_STYLES[value];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        "relative w-full overflow-hidden rounded-lg border text-left transition",
        selected
          ? "border-zinc-900 bg-white ring-1 ring-zinc-900/10 shadow-sm"
          : "border-zinc-200/90 bg-zinc-50/40 hover:border-zinc-300 hover:bg-white",
      ].join(" ")}
    >
      {selected ? (
        <span className="absolute right-1.5 top-1.5 z-10 flex size-4 items-center justify-center rounded-full bg-zinc-900 text-white">
          <Check className="size-2.5" strokeWidth={3} aria-hidden />
        </span>
      ) : null}
      <div className={`h-8 ${preview.bar}`} aria-hidden />
      <div className={`space-y-1 p-2 ${preview.panel}`}>
        <div className="h-1.5 w-3/4 rounded bg-zinc-200/80" />
        <div className="h-1.5 w-1/2 rounded bg-zinc-200/60" />
        <div className={`mt-1 h-2 w-full rounded ${preview.accent}`} />
      </div>
      <div className="border-t border-zinc-100 px-2 py-1.5">
        <span className="block text-[11px] font-semibold text-zinc-900">
          {label}
        </span>
        <span className="line-clamp-2 text-[10px] text-zinc-500">
          {description}
        </span>
      </div>
    </button>
  );
}
