/**
 * Shared color tokens for the abandoned-checkout flow canvas.
 * Orange trigger → blue wait → orange filter → green actions.
 */

export const FLOW_TRIGGER = {
  bg: "bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600",
  border: "border border-orange-400/30",
  ring: "ring-orange-400/45",
  label: "text-orange-100",
  title: "text-white",
  body: "text-orange-50/95",
  iconWrap: "bg-white/15 ring-white/20",
  icon: "text-white",
  previewHeader: "border-orange-200 bg-orange-100 text-orange-950",
} as const;

export const FLOW_WAIT = {
  border: "border-sky-200/80",
  ring: "ring-sky-400/40",
  header: "border-sky-100 bg-sky-100 text-sky-950",
  headerSub: "text-sky-800/75",
  icon: "bg-sky-500 shadow-sky-500/20",
  body: "text-sky-900",
  previewHeader: "border-sky-200 bg-sky-100 text-sky-950",
} as const;

export const FLOW_FILTER = {
  border: "border-orange-200/80",
  ring: "ring-orange-300/45",
  header: "border-orange-100 bg-orange-100 text-orange-950",
  headerSub: "text-orange-800/75",
  icon: "bg-orange-400 shadow-orange-400/20",
  notPill: "bg-sky-600 text-white",
  valuePill: "bg-sky-100 text-sky-900 ring-sky-200/80",
  previewHeader: "border-orange-200 bg-orange-100 text-orange-950",
} as const;

export const FLOW_ACTIONS = {
  border: "border-emerald-200/80",
  ring: "ring-emerald-400/35",
  header: "border-emerald-100 bg-emerald-100 text-emerald-950",
  headerSub: "text-emerald-800/75",
  icon: "bg-emerald-500 shadow-emerald-500/20",
  stepIcon: "text-emerald-800 bg-emerald-50 ring-emerald-100",
  stepSelected: "border-emerald-300 bg-emerald-50/90 ring-emerald-200/80",
  stepDefault: "border-emerald-100/80 bg-white hover:border-emerald-200",
  previewHeader: "border-emerald-200 bg-emerald-100 text-emerald-950",
} as const;

export const FLOW_CRON = {
  border: "border-violet-200/80",
  ring: "ring-violet-400/40",
  header: "border-violet-100 bg-violet-100 text-violet-950",
  headerSub: "text-violet-800/75",
  icon: "bg-violet-500 shadow-violet-500/20",
  body: "text-violet-900",
  previewHeader: "border-violet-200 bg-violet-100 text-violet-950",
} as const;

export function flowPreviewHeaderClass(
  kind: "signup_trigger" | "cron_trigger" | "wait" | "condition" | "default",
): string {
  switch (kind) {
    case "signup_trigger":
      return FLOW_TRIGGER.previewHeader;
    case "cron_trigger":
      return FLOW_CRON.previewHeader;
    case "wait":
      return FLOW_WAIT.previewHeader;
    case "condition":
      return FLOW_FILTER.previewHeader;
    default:
      return FLOW_ACTIONS.previewHeader;
  }
}
