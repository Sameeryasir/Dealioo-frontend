import { Check } from "lucide-react";
import { LandingDesignMiniPreview } from "@/app/components/crm-template-editor/landing-designs/LandingDesignMiniPreview";
import type { LandingDesignStyle } from "@/app/components/crm-template-editor/landing-designs/types";

export function LandingDesignPickerOption({
  label,
  description,
  selected,
  style,
  onSelect,
}: {
  label: string;
  description: string;
  selected: boolean;
  style: LandingDesignStyle;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        "group relative w-full overflow-hidden rounded-lg border border-zinc-200/90 text-left transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1",
        selected
          ? "bg-white"
          : "bg-zinc-50/40 hover:border-zinc-300 hover:bg-white",
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
        <LandingDesignMiniPreview style={style} />
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
