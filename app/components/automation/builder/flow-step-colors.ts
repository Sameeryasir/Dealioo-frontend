/**
 * What changed: Canvas node colors aligned with left BlockSidebar section tones.
 * Why: Same block type should read the same color in palette and on the canvas.
 * Related: BlockSidebar iconToneClass, flow-step-cards.
 */

/** Shared semantic colors — keep palette + canvas in sync. */
export const FLOW_SECTION_COLORS = {
  triggers: {
    solid: "bg-[#1877f2] text-white shadow-[0_4px_14px_rgba(24,119,242,0.32)]",
    border: "border-blue-200/80",
    ring: "ring-[#1877f2]/45",
    header: "border-blue-100 bg-blue-50 text-blue-950",
    headerSub: "text-blue-800/75",
    body: "text-blue-950",
    soft: "bg-blue-50 text-blue-800 ring-blue-100",
    pill: "bg-blue-100 text-blue-900 ring-blue-200/80",
  },
  actions: {
    solid: "bg-violet-600 text-white shadow-[0_4px_14px_rgba(124,58,237,0.28)]",
    border: "border-violet-200/80",
    ring: "ring-violet-500/40",
    header: "border-violet-100 bg-violet-50 text-violet-950",
    headerSub: "text-violet-800/75",
    body: "text-violet-950",
    soft: "bg-violet-50 text-violet-800 ring-violet-100",
    pill: "bg-violet-100 text-violet-900 ring-violet-200/80",
  },
  conditions: {
    solid: "bg-orange-500 text-white shadow-[0_4px_14px_rgba(249,115,22,0.28)]",
    border: "border-orange-200/80",
    ring: "ring-orange-500/40",
    header: "border-orange-100 bg-orange-50 text-orange-950",
    headerSub: "text-orange-800/75",
    body: "text-orange-950",
    soft: "bg-orange-50 text-orange-800 ring-orange-100",
    pill: "bg-orange-100 text-orange-900 ring-orange-200/80",
    notPill: "bg-orange-600 text-white",
  },
  flow: {
    solid: "bg-sky-500 text-white shadow-[0_4px_14px_rgba(14,165,233,0.28)]",
    border: "border-sky-200/80",
    ring: "ring-sky-500/40",
    header: "border-sky-100 bg-sky-50 text-sky-950",
    headerSub: "text-sky-800/75",
    body: "text-sky-950",
    soft: "bg-sky-50 text-sky-800 ring-sky-100",
    pill: "bg-sky-100 text-sky-900 ring-sky-200/80",
  },
} as const;

/** Trigger cards keep a stronger dark header so they stay visually first in the flow. */
export const DEALIOO_SIDEBAR = {
  header:
    "border-b border-white/10 bg-[linear-gradient(180deg,#0e2238_0%,#122d48_52%,#16385a_100%)] text-white",
  glow: "bg-[radial-gradient(ellipse_120%_40%_at_50%_0%,rgba(24,119,242,0.24)_0%,transparent_70%),radial-gradient(ellipse_120%_35%_at_50%_100%,rgba(244,114,182,0.12)_0%,transparent_70%)]",
  activeIcon: FLOW_SECTION_COLORS.triggers.solid,
} as const;

export const FLOW_TRIGGER = {
  border: FLOW_SECTION_COLORS.triggers.border,
  ring: FLOW_SECTION_COLORS.triggers.ring,
  header: DEALIOO_SIDEBAR.header,
  headerSub: "text-white/75",
  icon: FLOW_SECTION_COLORS.triggers.solid,
  body: "text-zinc-700",
  previewHeader: DEALIOO_SIDEBAR.header,
} as const;

export const FLOW_WAIT = {
  border: FLOW_SECTION_COLORS.flow.border,
  ring: FLOW_SECTION_COLORS.flow.ring,
  header: FLOW_SECTION_COLORS.flow.header,
  headerSub: FLOW_SECTION_COLORS.flow.headerSub,
  icon: FLOW_SECTION_COLORS.flow.solid,
  body: FLOW_SECTION_COLORS.flow.body,
  previewHeader: FLOW_SECTION_COLORS.flow.header,
} as const;

export const FLOW_FILTER = {
  border: FLOW_SECTION_COLORS.conditions.border,
  ring: FLOW_SECTION_COLORS.conditions.ring,
  header: FLOW_SECTION_COLORS.conditions.header,
  headerSub: FLOW_SECTION_COLORS.conditions.headerSub,
  icon: FLOW_SECTION_COLORS.conditions.solid,
  notPill: FLOW_SECTION_COLORS.conditions.notPill,
  valuePill: FLOW_SECTION_COLORS.conditions.pill,
  previewHeader: FLOW_SECTION_COLORS.conditions.header,
} as const;

export const FLOW_ACTIONS = {
  border: FLOW_SECTION_COLORS.actions.border,
  ring: FLOW_SECTION_COLORS.actions.ring,
  header: FLOW_SECTION_COLORS.actions.header,
  headerSub: FLOW_SECTION_COLORS.actions.headerSub,
  icon: FLOW_SECTION_COLORS.actions.solid,
  stepIcon: FLOW_SECTION_COLORS.actions.soft,
  stepSelected:
    "border-violet-300 bg-violet-50/90 ring-violet-200/80",
  stepDefault: "border-violet-100/80 bg-white hover:border-violet-200",
  previewHeader: FLOW_SECTION_COLORS.actions.header,
} as const;

export const FLOW_CRON = {
  border: FLOW_SECTION_COLORS.triggers.border,
  ring: FLOW_SECTION_COLORS.triggers.ring,
  header: FLOW_SECTION_COLORS.triggers.header,
  headerSub: FLOW_SECTION_COLORS.triggers.headerSub,
  icon: FLOW_SECTION_COLORS.triggers.solid,
  body: FLOW_SECTION_COLORS.triggers.body,
  previewHeader: FLOW_SECTION_COLORS.triggers.header,
} as const;

export function flowPreviewHeaderClass(
  kind: "signup_trigger" | "cron_trigger" | "wait" | "condition" | "default",
): string {
  switch (kind) {
    case "signup_trigger":
      return FLOW_TRIGGER.previewHeader;
    case "cron_trigger":
      return FLOW_TRIGGER.previewHeader;
    case "wait":
      return FLOW_WAIT.previewHeader;
    case "condition":
      return FLOW_FILTER.previewHeader;
    default:
      return FLOW_ACTIONS.previewHeader;
  }
}

/** Right settings panel chrome keyed by block section (matches left + canvas). */
export function settingsSectionChrome(section: string): {
  icon: string;
  accentBorder: string;
  chip: string;
} {
  switch (section) {
    case "actions":
      return {
        icon: FLOW_SECTION_COLORS.actions.solid,
        accentBorder: "border-l-violet-500",
        chip: "bg-violet-500/10 text-violet-700 ring-violet-500/15",
      };
    case "conditions":
      return {
        icon: FLOW_SECTION_COLORS.conditions.solid,
        accentBorder: "border-l-orange-500",
        chip: "bg-orange-500/10 text-orange-700 ring-orange-500/15",
      };
    case "flow":
      return {
        icon: FLOW_SECTION_COLORS.flow.solid,
        accentBorder: "border-l-sky-500",
        chip: "bg-sky-500/10 text-sky-700 ring-sky-500/15",
      };
    case "triggers":
    default:
      return {
        icon: FLOW_SECTION_COLORS.triggers.solid,
        accentBorder: "border-l-[#1877f2]",
        chip: "bg-[#1877f2]/10 text-[#0f5ed7] ring-[#1877f2]/15",
      };
  }
}
