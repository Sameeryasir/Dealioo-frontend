import type {
  AutomationExecutionRecipient,
  AutomationExecutionStatus,
} from "@/app/services/automation/types";

export function isExecutionInProgress(
  status: AutomationExecutionStatus,
): boolean {
  return status === "queued" || status === "running" || status === "waiting";
}

export function executionProgressLabel(
  status: AutomationExecutionStatus,
  emailsSent?: number,
  totalRecipients?: number,
): string | null {
  if (!isExecutionInProgress(status)) return null;
  const sent = emailsSent ?? 0;
  const total = totalRecipients ?? 0;
  if (total > 0) return `${sent} / ${total} emails`;
  if (status === "queued") return "Queued";
  return "In progress";
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
    case "completed":
      return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200";
    case "failed":
      return "bg-red-100 text-red-900 ring-1 ring-red-200";
    default:
      return "bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200";
  }
}

export function formatExecutionDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}

export function formatScheduledCountdown(
  scheduledAt: string | null | undefined,
): string | null {
  if (!scheduledAt) return null;
  const ms = new Date(scheduledAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  if (ms <= 0) return "Due now";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `in ${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `in ${h}h ${m}m` : `in ${h}h`;
}

export function customerLabel(
  customerId: number,
  customer?: { email?: string; name?: string },
): string {
  if (customer?.email?.trim()) return customer.email.trim();
  if (customer?.name?.trim()) return customer.name.trim();
  return `Customer #${customerId}`;
}

export function recipientLabel(recipient: AutomationExecutionRecipient): string {
  const email = recipient.email?.trim();
  if (email) return email;
  return `Customer #${recipient.customerId}`;
}

export function executionRunTitle(
  executedRecipients: AutomationExecutionRecipient[] | undefined,
  customerId: number,
  customer?: { email?: string; name?: string },
): string {
  const count = executedRecipients?.length ?? 0;
  if (count > 1) {
    return `Completed for ${count} customers`;
  }
  if (count === 1 && executedRecipients?.[0]) {
    return recipientLabel(executedRecipients[0]);
  }
  return customerLabel(customerId, customer);
}

export function executionRunSubtitle(
  executedRecipients: AutomationExecutionRecipient[] | undefined,
): string | null {
  if (!executedRecipients || executedRecipients.length === 0) {
    return null;
  }
  return executedRecipients.map(recipientLabel).join(", ");
}
