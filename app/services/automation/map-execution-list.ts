import type {
  AutomationExecution,
  AutomationExecutionStatus,
  ExecutionListItem,
  PaginatedExecutionsApiResponse,
  PaginatedExecutionsResponse,
} from "@/app/services/automation/types";

function toIsoDate(value: string | Date): string {
  if (typeof value === "string") return value;
  return value instanceof Date ? value.toISOString() : String(value);
}

function isExecutionListItem(row: unknown): row is ExecutionListItem {
  if (!row || typeof row !== "object") return false;
  const r = row as Record<string, unknown>;
  return (
    typeof r.id === "number" &&
    typeof r.status === "string" &&
    (typeof r.startedAt === "string" || r.startedAt instanceof Date) &&
    typeof r.customerCount === "number"
  );
}

export function mapExecutionListItemToExecution(
  item: ExecutionListItem,
  automationId = 0,
): AutomationExecution {
  const id = item.id ?? item.runId;
  const startedAt = toIsoDate(item.startedAt);
  const status = item.status as AutomationExecutionStatus;
  const customerId = item.customerId ?? 0;
  const customerEmail = item.customerEmail?.trim() || undefined;
  const customerName = item.customerName?.trim() || undefined;
  const totalRecipients = Math.max(0, item.totalRecipients ?? 0);
  const emailsSentCount = Math.max(0, item.emailsSentCount ?? 0);
  const scheduledAt =
    item.scheduledAt == null ? null : toIsoDate(item.scheduledAt);

  const stepType = item.stepType?.trim() || undefined;

  return {
    id,
    automationId,
    customerId,
    currentNodeId: 0,
    status,
    scheduledAt,
    totalRecipients,
    emailsSentCount,
    queueJobId: null,
    lastError: null,
    createdAt: startedAt,
    updatedAt: startedAt,
    ...(customerId > 0 || customerEmail || customerName
      ? {
          customer: {
            id: customerId,
            email: customerEmail,
            name: customerName,
          },
        }
      : {}),
    ...(stepType
      ? {
          currentNode: {
            id: 0,
            type: stepType,
            config: {},
            order: 0,
          },
        }
      : {}),
  };
}

function mapExecutionRow(
  row: ExecutionListItem | AutomationExecution,
  automationId?: number,
): AutomationExecution {
  if (isExecutionListItem(row)) {
    return mapExecutionListItemToExecution(row, automationId ?? 0);
  }
  const full = row as AutomationExecution;
  return {
    ...full,
    id: full.id,
    createdAt: full.createdAt ?? full.updatedAt,
    updatedAt: full.updatedAt ?? full.createdAt,
  };
}

export function normalizeExecutionsListResponse(
  raw: PaginatedExecutionsApiResponse,
  automationId?: number,
): PaginatedExecutionsResponse {
  return {
    data: (raw.data ?? []).map((row) => mapExecutionRow(row, automationId)),
    meta: raw.meta,
  };
}
