import type { LandingDesignSwatchKind } from "@/app/components/crm-template-editor/landing-designs/types";

const SWATCH_GRADIENTS: Record<LandingDesignSwatchKind, string> = {
  lavender: "from-violet-400 via-indigo-400 to-violet-600",
  dark: "from-slate-800 via-slate-900 to-cyan-500",
  warm: "from-orange-300 via-amber-400 to-red-500",
  green: "from-emerald-300 via-green-400 to-teal-500",
  blue: "from-sky-300 via-blue-400 to-cyan-500",
  mono: "from-zinc-200 via-zinc-400 to-zinc-900",
  rose: "from-rose-200 via-pink-300 to-rose-600",
  contrast: "from-zinc-900 via-zinc-800 to-yellow-400",
  gold: "from-stone-800 via-amber-600 to-yellow-500",
  cream: "from-amber-100 via-stone-200 to-amber-700",
  plum: "from-purple-600 via-fuchsia-600 to-purple-900",
  coral: "from-pink-300 via-rose-400 to-orange-400",
  slate: "from-slate-200 via-slate-400 to-slate-700",
  electric: "from-fuchsia-500 via-violet-600 to-purple-950",
  sage: "from-lime-200 via-green-300 to-emerald-600",
  wine: "from-rose-900 via-red-800 to-rose-600",
  candy: "from-fuchsia-200 via-pink-300 to-fuchsia-600",
  teal: "from-teal-200 via-cyan-400 to-blue-500",
  indigo: "from-slate-700 via-blue-600 to-cyan-400",
  berry: "from-red-300 via-rose-500 to-red-700",
  mint: "from-cyan-200 via-teal-300 to-cyan-600",
  forest: "from-green-900 via-emerald-700 to-green-400",
};

export function LandingDesignSwatch({
  kind,
  selected,
}: {
  kind: LandingDesignSwatchKind;
  selected?: boolean;
}) {
  const ring = selected
    ? "ring-2 ring-zinc-900 ring-offset-2"
    : "ring-1 ring-zinc-200/90";

  return (
    <div
      className={`h-11 w-[4.25rem] shrink-0 overflow-hidden rounded-lg bg-gradient-to-br ${SWATCH_GRADIENTS[kind]} shadow-inner ${ring}`}
      aria-hidden
    />
  );
}
