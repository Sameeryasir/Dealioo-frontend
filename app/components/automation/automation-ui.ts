import type { AutomationStatus } from "@/app/components/automation/types";
import { automationEase } from "@/app/lib/motion";

export { automationEase };

export const automationStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

export const automationItem = {
  hidden: { opacity: 0, y: -28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: automationEase },
  },
};

export const flowListStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.14, delayChildren: 0.06 },
  },
};

export const flowStepReveal = {
  hidden: { opacity: 0, y: -28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: automationEase },
  },
};

export const flowConnectorReveal = {
  hidden: { opacity: 0, scaleY: 0, originY: 0 },
  show: {
    opacity: 1,
    scaleY: 1,
    transition: { duration: 0.28, ease: automationEase },
  },
};

export function statusBadgeClass(status: AutomationStatus): string {
  switch (status) {
    case "active":
      return "bg-zinc-900 text-white";
    case "published":
      return "bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200";
    case "paused":
      return "bg-amber-100 text-amber-900";
    case "draft":
    default:
      return "bg-zinc-50 text-zinc-600 ring-1 ring-zinc-200";
  }
}

export function nodeToneClass(
  tone: "emerald" | "blue" | "violet" | "orange" | "zinc" | "amber",
): { shell: string; icon: string; ring: string } {
  switch (tone) {
    case "emerald":
      return {
        shell: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white",
        icon: "bg-emerald-500 text-white",
        ring: "ring-emerald-400/40",
      };
    case "blue":
      return {
        shell: "border-blue-200/80 bg-gradient-to-br from-blue-50 to-white",
        icon: "bg-blue-500 text-white",
        ring: "ring-blue-400/40",
      };
    case "violet":
      return {
        shell: "border-violet-200/80 bg-gradient-to-br from-violet-50 to-white",
        icon: "bg-violet-500 text-white",
        ring: "ring-violet-400/40",
      };
    case "orange":
      return {
        shell: "border-orange-200/80 bg-gradient-to-br from-orange-50 to-white",
        icon: "bg-orange-500 text-white",
        ring: "ring-orange-400/40",
      };
    case "amber":
      return {
        shell: "border-amber-200/80 bg-gradient-to-br from-amber-50 to-white",
        icon: "bg-amber-500 text-white",
        ring: "ring-amber-400/40",
      };
    default:
      return {
        shell: "border-zinc-200/90 bg-gradient-to-br from-zinc-50 to-white",
        icon: "bg-zinc-800 text-white",
        ring: "ring-zinc-400/40",
      };
  }
}
