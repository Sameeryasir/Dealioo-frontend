import type { AutomationStatus } from "@/app/components/automation/types";
import type { AutomationExecutionStatus } from "@/app/services/automation/types";

export function automationStatusBadgeClass(status: AutomationStatus): string {
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

export function executionStatusBadgeClass(
  status: AutomationExecutionStatus,
): string {
  switch (status) {
    case "queued":
      return "bg-violet-100 text-violet-900 ring-1 ring-violet-200";
    case "running":
      return "bg-blue-100 text-blue-900 ring-1 ring-blue-200";
    case "waiting":
      return "bg-amber-100 text-amber-900 ring-1 ring-amber-200";
    case "paused":
      return "bg-zinc-200 text-zinc-800 ring-1 ring-zinc-300";
    case "completed":
      return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200";
    case "failed":
      return "bg-red-100 text-red-900 ring-1 ring-red-200";
    default:
      return "bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200";
  }
}

export function paymentStatusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "paid" || s === "succeeded") {
    return "bg-[#e8f2ff] text-[#0d5bbf] ring-1 ring-[#1877f2]/25";
  }
  if (s === "failed") return "bg-red-50 text-red-700 ring-1 ring-red-200/80";
  if (s === "cancelled" || s === "canceled") {
    return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
  }
  if (s === "refunded" || s === "partially_refunded") {
    return "bg-violet-50 text-violet-800 ring-1 ring-violet-200/80";
  }
  if (s === "disputed") return "bg-orange-50 text-orange-800 ring-1 ring-orange-200/80";
  return "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80";
}

export function triggerIconClass(trigger: string): string {
  const t = trigger.toLowerCase();
  if (t.includes("signup")) return "text-emerald-700";
  if (t.includes("payment")) return "text-blue-700";
  if (t.includes("funnel")) return "text-violet-700";
  if (t.includes("tag")) return "text-amber-700";
  return "text-amber-700";
}
