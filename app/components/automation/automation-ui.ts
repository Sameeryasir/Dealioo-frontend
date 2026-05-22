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
        shell: "border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white",
        icon: "bg-emerald-500 text-white shadow-emerald-500/25",
        ring: "ring-emerald-500/35 shadow-emerald-100/80",
        accent: "border-l-emerald-500",
        badge: "bg-emerald-100/90 text-emerald-800",
      };
    case "blue":
      return {
        shell: "border-blue-200/80 bg-gradient-to-br from-blue-50/90 to-white",
        icon: "bg-blue-500 text-white shadow-blue-500/25",
        ring: "ring-blue-500/35 shadow-blue-100/80",
        accent: "border-l-blue-500",
        badge: "bg-blue-100/90 text-blue-800",
      };
    case "violet":
      return {
        shell: "border-violet-200/80 bg-gradient-to-br from-violet-50/90 to-white",
        icon: "bg-violet-500 text-white shadow-violet-500/25",
        ring: "ring-violet-500/35 shadow-violet-100/80",
        accent: "border-l-violet-500",
        badge: "bg-violet-100/90 text-violet-800",
      };
    case "orange":
      return {
        shell: "border-orange-200/80 bg-gradient-to-br from-orange-50/90 to-white",
        icon: "bg-orange-500 text-white shadow-orange-500/25",
        ring: "ring-orange-500/35 shadow-orange-100/80",
        accent: "border-l-orange-500",
        badge: "bg-orange-100/90 text-orange-800",
      };
    case "amber":
      return {
        shell: "border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white",
        icon: "bg-amber-500 text-white shadow-amber-500/25",
        ring: "ring-amber-500/35 shadow-amber-100/80",
        accent: "border-l-amber-500",
        badge: "bg-amber-100/90 text-amber-800",
      };
    default:
      return {
        shell: "border-zinc-200/90 bg-gradient-to-br from-zinc-50/90 to-white",
        icon: "bg-zinc-800 text-white shadow-zinc-500/20",
        ring: "ring-zinc-500/30 shadow-zinc-100/80",
        accent: "border-l-zinc-600",
        badge: "bg-zinc-100 text-zinc-700",
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
