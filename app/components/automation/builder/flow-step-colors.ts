export const DEALIOO_SIDEBAR = {
  header:
    "border-b border-white/10 bg-[linear-gradient(180deg,#0e2238_0%,#122d48_52%,#16385a_100%)] text-white",
  glow: "bg-[radial-gradient(ellipse_120%_40%_at_50%_0%,rgba(24,119,242,0.24)_0%,transparent_70%),radial-gradient(ellipse_120%_35%_at_50%_100%,rgba(244,114,182,0.12)_0%,transparent_70%)]",
  activeIcon:
    "bg-gradient-to-br from-[#1d84ff] via-[#1877f2] to-[#0f5ed7] shadow-[0_4px_14px_rgba(24,119,242,0.32)]",
} as const;

export const FLOW_TRIGGER = {
  border: "border-zinc-200/80",
  ring: "ring-[#1877f2]/45",
  header: DEALIOO_SIDEBAR.header,
  headerSub: "text-white/75",
  icon: DEALIOO_SIDEBAR.activeIcon,
  body: "text-zinc-700",
  previewHeader: DEALIOO_SIDEBAR.header,
} as const;

export const FLOW_WAIT = {
  border: "border-blue-200/80",
  ring: "ring-[#1877f2]/40",
  header: "border-blue-100 bg-blue-100 text-blue-950",
  headerSub: "text-blue-800/75",
  icon: "bg-[#1877f2] shadow-[0_4px_14px_rgba(24,119,242,0.32)]",
  body: "text-blue-900",
  previewHeader: "border-blue-200 bg-blue-100 text-blue-950",
} as const;

export const FLOW_FILTER = {
  border: "border-blue-200/80",
  ring: "ring-[#1877f2]/40",
  header: "border-blue-100 bg-blue-100 text-blue-950",
  headerSub: "text-blue-800/75",
  icon: "bg-[#1877f2] shadow-[0_4px_14px_rgba(24,119,242,0.32)]",
  notPill: "bg-[#0f5ed7] text-white",
  valuePill: "bg-blue-100 text-blue-900 ring-blue-200/80",
  previewHeader: "border-blue-200 bg-blue-100 text-blue-950",
} as const;

export const FLOW_ACTIONS = {
  border: "border-blue-200/80",
  ring: "ring-[#1877f2]/35",
  header: "border-blue-100 bg-blue-100 text-blue-950",
  headerSub: "text-blue-800/75",
  icon: "bg-[#1877f2] shadow-[0_4px_14px_rgba(24,119,242,0.32)]",
  stepIcon: "text-blue-800 bg-blue-50 ring-blue-100",
  stepSelected: "border-blue-300 bg-blue-50/90 ring-blue-200/80",
  stepDefault: "border-blue-100/80 bg-white hover:border-blue-200",
  previewHeader: "border-blue-200 bg-blue-100 text-blue-950",
} as const;

export const FLOW_CRON = {
  border: "border-blue-200/80",
  ring: "ring-[#1877f2]/40",
  header: "border-blue-100 bg-blue-100 text-blue-950",
  headerSub: "text-blue-800/75",
  icon: "bg-[#1877f2] shadow-[0_4px_14px_rgba(24,119,242,0.32)]",
  body: "text-blue-900",
  previewHeader: "border-blue-200 bg-blue-100 text-blue-950",
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
