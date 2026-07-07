/** Reusable Tailwind class bundles, add a design by picking a preset + colors. */
export type LightAccent =
  | "violet"
  | "orange"
  | "emerald"
  | "sky"
  | "rose"
  | "amber"
  | "plum"
  | "coral"
  | "sage"
  | "candy"
  | "teal"
  | "slate"
  | "berry"
  | "mint";

export type DarkAccent =
  | "cyan"
  | "amber"
  | "contrast"
  | "wine"
  | "electric"
  | "graphite"
  | "plum"
  | "forest";

export type LandingThemePreset = {
  badgeClass: string;
  headingClass: string;
  subheadingClass: string;
  bodyClass: string;
  dividerClass: string;
  trustClass: string;
  heroPlaceholderClass: string;
};

export const LIGHT_THEME_PRESETS: Record<LightAccent, LandingThemePreset> = {
  violet: {
    badgeClass:
      "border border-violet-200/80 bg-white/80 text-violet-700 shadow-sm backdrop-blur-sm",
    headingClass: "text-zinc-900",
    subheadingClass: "text-violet-700/90",
    bodyClass: "text-zinc-600",
    dividerClass: "bg-gradient-to-r from-violet-400 to-indigo-400",
    trustClass: "text-zinc-400",
    heroPlaceholderClass:
      "border-violet-200/80 bg-gradient-to-br from-violet-50 to-indigo-50 text-violet-700",
  },
  orange: {
    badgeClass: "border border-orange-200 bg-white/90 text-orange-800",
    headingClass: "text-stone-900",
    subheadingClass: "text-orange-700",
    bodyClass: "text-stone-600",
    dividerClass: "bg-gradient-to-r from-orange-400 to-red-400",
    trustClass: "text-stone-400",
    heroPlaceholderClass:
      "border-orange-200 bg-gradient-to-br from-orange-50 to-amber-100 text-orange-800",
  },
  emerald: {
    badgeClass: "border border-emerald-200 bg-white/90 text-emerald-800",
    headingClass: "text-emerald-950",
    subheadingClass: "text-emerald-700",
    bodyClass: "text-emerald-900/70",
    dividerClass: "bg-gradient-to-r from-emerald-400 to-teal-400",
    trustClass: "text-emerald-600/60",
    heroPlaceholderClass:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-800",
  },
  sky: {
    badgeClass: "border border-sky-200 bg-white/90 text-sky-800",
    headingClass: "text-slate-900",
    subheadingClass: "text-sky-700",
    bodyClass: "text-slate-600",
    dividerClass: "bg-gradient-to-r from-blue-400 to-cyan-400",
    trustClass: "text-slate-400",
    heroPlaceholderClass:
      "border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 text-sky-800",
  },
  rose: {
    badgeClass: "border border-rose-200 bg-white/90 text-rose-800",
    headingClass: "text-rose-950",
    subheadingClass: "text-rose-700",
    bodyClass: "text-rose-900/65",
    dividerClass: "bg-gradient-to-r from-rose-400 to-pink-400",
    trustClass: "text-rose-400",
    heroPlaceholderClass:
      "border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 text-rose-800",
  },
  amber: {
    badgeClass: "border border-amber-200/80 bg-white text-amber-900",
    headingClass: "text-stone-900",
    subheadingClass: "text-amber-800/90",
    bodyClass: "text-stone-600",
    dividerClass: "bg-amber-700/30",
    trustClass: "text-stone-400",
    heroPlaceholderClass:
      "border-amber-200 bg-gradient-to-br from-amber-50 to-stone-100 text-amber-900",
  },
  plum: {
    badgeClass: "border border-purple-200 bg-white/90 text-purple-800",
    headingClass: "text-purple-950",
    subheadingClass: "text-purple-700",
    bodyClass: "text-purple-900/70",
    dividerClass: "bg-gradient-to-r from-purple-400 to-fuchsia-400",
    trustClass: "text-purple-400/80",
    heroPlaceholderClass:
      "border-purple-200 bg-gradient-to-br from-purple-50 to-fuchsia-50 text-purple-800",
  },
  coral: {
    badgeClass: "border border-pink-200 bg-white/90 text-pink-800",
    headingClass: "text-stone-900",
    subheadingClass: "text-pink-600",
    bodyClass: "text-stone-600",
    dividerClass: "bg-gradient-to-r from-pink-400 to-orange-400",
    trustClass: "text-stone-400",
    heroPlaceholderClass:
      "border-pink-200 bg-gradient-to-br from-pink-50 to-orange-50 text-pink-800",
  },
  sage: {
    badgeClass: "border border-lime-200 bg-white/90 text-lime-900",
    headingClass: "text-stone-900",
    subheadingClass: "text-lime-800",
    bodyClass: "text-stone-600",
    dividerClass: "bg-gradient-to-r from-lime-400 to-green-400",
    trustClass: "text-stone-400",
    heroPlaceholderClass:
      "border-lime-200 bg-gradient-to-br from-lime-50 to-green-50 text-lime-900",
  },
  candy: {
    badgeClass: "border border-fuchsia-200 bg-white/90 text-fuchsia-800",
    headingClass: "text-fuchsia-950",
    subheadingClass: "text-fuchsia-600",
    bodyClass: "text-fuchsia-900/65",
    dividerClass: "bg-gradient-to-r from-fuchsia-400 to-pink-400",
    trustClass: "text-fuchsia-400",
    heroPlaceholderClass:
      "border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-pink-50 text-fuchsia-800",
  },
  teal: {
    badgeClass: "border border-teal-200 bg-white/90 text-teal-800",
    headingClass: "text-teal-950",
    subheadingClass: "text-teal-700",
    bodyClass: "text-teal-900/65",
    dividerClass: "bg-gradient-to-r from-teal-400 to-cyan-400",
    trustClass: "text-teal-500/70",
    heroPlaceholderClass:
      "border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 text-teal-800",
  },
  slate: {
    badgeClass: "border border-slate-200 bg-white/90 text-slate-700",
    headingClass: "text-slate-900",
    subheadingClass: "text-slate-600",
    bodyClass: "text-slate-500",
    dividerClass: "bg-gradient-to-r from-slate-300 to-slate-500",
    trustClass: "text-slate-400",
    heroPlaceholderClass:
      "border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 text-slate-600",
  },
  berry: {
    badgeClass: "border border-red-200 bg-white/90 text-red-800",
    headingClass: "text-red-950",
    subheadingClass: "text-red-600",
    bodyClass: "text-red-900/65",
    dividerClass: "bg-gradient-to-r from-red-400 to-rose-400",
    trustClass: "text-red-400/80",
    heroPlaceholderClass:
      "border-red-200 bg-gradient-to-br from-red-50 to-rose-50 text-red-800",
  },
  mint: {
    badgeClass: "border border-cyan-200 bg-white/90 text-cyan-800",
    headingClass: "text-cyan-950",
    subheadingClass: "text-cyan-700",
    bodyClass: "text-cyan-900/65",
    dividerClass: "bg-gradient-to-r from-cyan-400 to-teal-400",
    trustClass: "text-cyan-500/70",
    heroPlaceholderClass:
      "border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50 text-cyan-800",
  },
};

export const DARK_THEME_PRESETS: Record<DarkAccent, LandingThemePreset> = {
  cyan: {
    badgeClass: "border border-cyan-400/30 bg-cyan-500/10 text-cyan-200",
    headingClass: "text-white",
    subheadingClass: "text-cyan-200/90",
    bodyClass: "text-slate-300",
    dividerClass: "bg-gradient-to-r from-cyan-400 to-indigo-400",
    trustClass: "text-slate-500",
    heroPlaceholderClass:
      "border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 text-slate-400",
  },
  amber: {
    badgeClass: "border border-amber-500/40 bg-amber-500/10 text-amber-200",
    headingClass: "text-amber-50",
    subheadingClass: "text-amber-300/90",
    bodyClass: "text-stone-400",
    dividerClass: "bg-gradient-to-r from-amber-400 to-yellow-600",
    trustClass: "text-stone-500",
    heroPlaceholderClass:
      "border-stone-700 bg-gradient-to-br from-stone-800 to-stone-900 text-amber-400",
  },
  contrast: {
    badgeClass: "border border-yellow-400/40 bg-yellow-400/10 text-yellow-300",
    headingClass: "text-white uppercase tracking-wide",
    subheadingClass: "text-yellow-300",
    bodyClass: "text-zinc-300",
    dividerClass: "bg-yellow-400",
    trustClass: "text-zinc-500",
    heroPlaceholderClass: "border-zinc-700 bg-zinc-900 text-yellow-400",
  },
  wine: {
    badgeClass: "border border-rose-500/30 bg-rose-500/10 text-rose-200",
    headingClass: "text-rose-50",
    subheadingClass: "text-rose-300/90",
    bodyClass: "text-rose-100/60",
    dividerClass: "bg-gradient-to-r from-rose-500 to-red-600",
    trustClass: "text-rose-300/50",
    heroPlaceholderClass:
      "border-rose-900 bg-gradient-to-br from-rose-950 to-red-950 text-rose-300",
  },
  electric: {
    badgeClass: "border border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-200",
    headingClass: "text-white",
    subheadingClass: "text-fuchsia-300",
    bodyClass: "text-violet-200/70",
    dividerClass: "bg-gradient-to-r from-fuchsia-400 to-violet-500",
    trustClass: "text-violet-400/60",
    heroPlaceholderClass:
      "border-violet-800 bg-gradient-to-br from-violet-950 to-fuchsia-950 text-fuchsia-300",
  },
  graphite: {
    badgeClass: "border border-blue-400/30 bg-blue-500/10 text-blue-200",
    headingClass: "text-slate-50",
    subheadingClass: "text-blue-300/90",
    bodyClass: "text-slate-400",
    dividerClass: "bg-gradient-to-r from-blue-400 to-slate-500",
    trustClass: "text-slate-500",
    heroPlaceholderClass:
      "border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 text-blue-300",
  },
  plum: {
    badgeClass: "border border-purple-400/30 bg-purple-500/10 text-purple-200",
    headingClass: "text-purple-50",
    subheadingClass: "text-purple-300/90",
    bodyClass: "text-purple-100/60",
    dividerClass: "bg-gradient-to-r from-purple-400 to-fuchsia-500",
    trustClass: "text-purple-300/50",
    heroPlaceholderClass:
      "border-purple-900 bg-gradient-to-br from-purple-950 to-fuchsia-950 text-purple-300",
  },
  forest: {
    badgeClass: "border border-green-400/30 bg-green-500/10 text-green-200",
    headingClass: "text-green-50",
    subheadingClass: "text-green-300/90",
    bodyClass: "text-green-100/60",
    dividerClass: "bg-gradient-to-r from-green-400 to-emerald-500",
    trustClass: "text-green-400/50",
    heroPlaceholderClass:
      "border-green-900 bg-gradient-to-br from-green-950 to-emerald-950 text-green-300",
  },
};

/** Mono light preset, used only for minimal_mono. */
export const MONO_LIGHT_PRESET: LandingThemePreset = {
  badgeClass: "border border-zinc-300 bg-zinc-100 text-zinc-800",
  headingClass: "text-zinc-900 tracking-tight",
  subheadingClass: "text-zinc-600",
  bodyClass: "text-zinc-500",
  dividerClass: "bg-zinc-900",
  trustClass: "text-zinc-400",
  heroPlaceholderClass: "border-zinc-300 bg-zinc-100 text-zinc-600",
};
