import { Check } from "lucide-react";
import { HeroDesignMiniPreview } from "@/app/components/crm-template-editor/hero-designs/HeroDesignMiniPreview";
import type { HeroDesignStyle } from "@/app/components/crm-template-editor/hero-designs/types";

export function HeroDesignPickerOption({
  label,
  description,
  selected,
  style,
  onSelect,
}: {
  label: string;
  description: string;
  selected: boolean;
  style: HeroDesignStyle;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        "group relative w-full overflow-hidden rounded-xl border border-zinc-200/90 bg-white text-left shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition-[border-color,box-shadow] duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 focus-visible:ring-offset-1",
        selected
          ? "border-zinc-900 ring-1 ring-zinc-900/10 shadow-[0_4px_14px_rgba(15,23,42,0.08)]"
          : "hover:border-zinc-300 hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]",
      ].join(" ")}
    >
      {selected ? (
        <span
          className="absolute right-1.5 top-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-white shadow-sm"
          aria-hidden
        >
          <Check className="size-2.5" strokeWidth={3} />
        </span>
      ) : null}

      <div className="flex items-center gap-2 p-2 pr-7">
        <HeroDesignMiniPreview style={style} />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold leading-tight text-zinc-900">
            {label}
          </span>
          <span className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-zinc-500">
            {description}
          </span>
        </span>
      </div>
    </button>
  );
}
