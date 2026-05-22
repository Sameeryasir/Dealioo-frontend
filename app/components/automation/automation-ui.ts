import type {
  WorkflowNode,
  WorkflowNodeKind,
} from "@/app/components/automation/types";

const TRIGGER_NODE_KINDS = new Set<WorkflowNodeKind>([
  "signup_trigger",
  "payment_trigger",
  "funnel_complete",
  "cron_trigger",
]);

export function isTriggerNodeKind(kind: WorkflowNodeKind): boolean {
  return TRIGGER_NODE_KINDS.has(kind);
}

export function workflowStartsWithTrigger(nodes: WorkflowNode[]): boolean {
  const first = nodes[0];
  return first != null && isTriggerNodeKind(first.kind);
}

export function workflowStartsWithCronTrigger(nodes: WorkflowNode[]): boolean {
  return nodes[0]?.kind === "cron_trigger";
}

export function nodeToneClass(
  tone: "emerald" | "blue" | "violet" | "orange" | "zinc" | "amber",
): {
  shell: string;
  icon: string;
  ring: string;
  accent: string;
  badge: string;
} {
  switch (tone) {
    case "emerald":
      return {
        shell:
          "border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
        icon: "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)]",
        ring: "ring-2 ring-emerald-400/50 shadow-[0_8px_30px_rgba(16,185,129,0.18)]",
        accent: "border-l-[3px] border-l-emerald-500",
        badge: "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/15",
      };
    case "blue":
      return {
        shell:
          "border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
        icon: "bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-[0_4px_14px_rgba(59,130,246,0.35)]",
        ring: "ring-2 ring-blue-400/50 shadow-[0_8px_30px_rgba(59,130,246,0.18)]",
        accent: "border-l-[3px] border-l-blue-500",
        badge: "bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/15",
      };
    case "violet":
      return {
        shell:
          "border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
        icon: "bg-gradient-to-br from-violet-400 to-violet-600 text-white shadow-[0_4px_14px_rgba(139,92,246,0.38)]",
        ring: "ring-2 ring-violet-400/55 shadow-[0_8px_32px_rgba(139,92,246,0.22)]",
        accent: "border-l-[3px] border-l-violet-500",
        badge: "bg-violet-500/10 text-violet-700 ring-1 ring-violet-500/15",
      };
    case "orange":
      return {
        shell:
          "border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
        icon: "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-[0_4px_14px_rgba(249,115,22,0.35)]",
        ring: "ring-2 ring-orange-400/50 shadow-[0_8px_30px_rgba(249,115,22,0.18)]",
        accent: "border-l-[3px] border-l-orange-500",
        badge: "bg-orange-500/10 text-orange-700 ring-1 ring-orange-500/15",
      };
    case "amber":
      return {
        shell:
          "border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
        icon: "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-[0_4px_14px_rgba(245,158,11,0.35)]",
        ring: "ring-2 ring-amber-400/50 shadow-[0_8px_30px_rgba(245,158,11,0.18)]",
        accent: "border-l-[3px] border-l-amber-500",
        badge: "bg-amber-500/10 text-amber-800 ring-1 ring-amber-500/15",
      };
    default:
      return {
        shell:
          "border-zinc-200/80 bg-gradient-to-br from-zinc-50 via-white to-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
        icon: "bg-gradient-to-br from-zinc-600 to-zinc-900 text-white shadow-[0_4px_14px_rgba(24,24,27,0.25)]",
        ring: "ring-2 ring-zinc-400/40 shadow-[0_8px_28px_rgba(24,24,27,0.12)]",
        accent: "border-l-[3px] border-l-zinc-600",
        badge: "bg-zinc-500/10 text-zinc-700 ring-1 ring-zinc-500/15",
      };
  }
}

export function blockSectionLabel(
  section: "triggers" | "actions" | "conditions" | "flow" | string,
): string {
  switch (section) {
    case "triggers":
      return "Trigger";
    case "actions":
      return "Action";
    case "conditions":
      return "Condition";
    case "flow":
      return "Flow";
    default:
      return "Step";
  }
}
