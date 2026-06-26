import { AUTOMATION_BLOCKS } from "@/app/components/automation/mock-data";
import type {
  AutomationExecution,
  AutomationExecutionRecipient,
  AutomationExecutionStatus,
  AutomationExecutionStatusDto,
} from "@/app/services/automation/types";

const API_NODE_TYPE_LABELS: Record<string, string> = {
  trigger: "Trigger",
  wait: "Wait",
  email: "Send Email",
  sms: "Send SMS",
  whatsapp: "Send WhatsApp",
  condition: "Condition",
  coupon: "Create Coupon",
  tag: "Tag Customer",
};

export function formatExecutionStepType(type?: string | null): string {
  const raw = type?.trim();
  if (!raw) return "—";
  const apiLabel = API_NODE_TYPE_LABELS[raw.toLowerCase()];
  if (apiLabel) return apiLabel;
  const block = AUTOMATION_BLOCKS.find((b) => b.id === raw.toLowerCase());
  if (block) return block.label;
  return raw
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function isExecutionInProgress(
  status: AutomationExecutionStatus,
): boolean {
  return status === "queued" || status === "running" || status === "waiting";
}

export function isBulkEmailSendInProgress(
  status: AutomationExecutionStatusDto,
): boolean {
  return (
    status.status === "running" &&
    status.totalRecipients > 0 &&
    status.emailsSent === 0 &&
    status.progressPercent === 0
  );
}

export function normalizeExecutionStatusForDisplay(
  status: AutomationExecutionStatusDto,
): AutomationExecutionStatusDto {
  if (status.status === "completed" && status.totalRecipients > 0) {
    return {
      ...status,
      emailsSent: status.totalRecipients,
      progressPercent: 100,
    };
  }
  return status;
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

export function executionRunDisplayName(
  row: Pick<
    AutomationExecution,
    | "id"
    | "status"
    | "executedRecipients"
    | "customerId"
    | "customer"
    | "totalRecipients"
  >,
): string {
  const bulkRecipientCount = row.totalRecipients ?? 0;
  if (bulkRecipientCount > 1) {
    return row.status === "completed"
      ? `Completed for ${bulkRecipientCount} customers`
      : `${bulkRecipientCount} customers`;
  }

  const executedCount = row.executedRecipients?.length ?? 0;
  if (executedCount > 1) {
    return row.status === "completed"
      ? `Completed for ${executedCount} customers`
      : `${executedCount} customers`;
  }

  const label = executionRunTitle(
    row.executedRecipients,
    row.customerId,
    row.customer,
  );
  return label.trim() ? label : `Run #${row.id}`;
}

export function executionRunCustomersLine(
  row: Pick<
    AutomationExecution,
    | "status"
    | "emailsSentCount"
    | "totalRecipients"
    | "executedRecipients"
    | "customerId"
    | "customer"
  >,
): string {
  const progress = executionProgressLabel(
    row.status,
    row.emailsSentCount,
    row.totalRecipients,
  );
  if (progress) return progress;

  const subtitle = executionRunSubtitle(row.executedRecipients);
  if (subtitle) return subtitle;

  const total = row.totalRecipients ?? 0;
  if (total > 0) {
    return total === 1 ? "1 customer reached" : `${total} customers reached`;
  }

  return customerLabel(row.customerId, row.customer);
}
