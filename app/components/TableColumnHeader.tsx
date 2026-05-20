import type { LucideIcon } from "lucide-react";

const ICON_STROKE = 2.25;

export function TableColumnHeader({
  icon: Icon,
  label,
  variant = "inline",
}: {
  icon?: LucideIcon;
  label: string;
  variant?: "inline" | "boxed";
}) {
  if (!label) return <span aria-hidden />;

  if (variant === "boxed" && Icon) {
    return (
      <span className="inline-flex items-center gap-2.5">
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-zinc-200/80 bg-white shadow-sm ring-1 ring-zinc-950/[0.04]">
          <Icon
            className="size-3.5 text-black"
            strokeWidth={ICON_STROKE}
            aria-hidden
          />
        </span>
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-zinc-900">
          {label}
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      {Icon ? (
        <Icon
          className="size-3.5 shrink-0 text-zinc-400"
          aria-hidden
          strokeWidth={ICON_STROKE}
        />
      ) : null}
      {label}
    </span>
  );
}
