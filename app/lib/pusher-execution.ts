import type {
  AutomationExecution,
  AutomationExecutionStatusDto,
} from "@/app/services/automation/types";

export const PUSHER_EXECUTION_EVENT = {
  COMPLETED: "execution-completed",
  FAILED: "execution-failed",
} as const;

export function pusherExecutionChannel(executionId: number): string {
  return `automation-execution-${executionId}`;
}

export function pusherAutomationChannel(automationId: number): string {
  return `automation-${automationId}`;
}

export type ExecutionTerminalPusherPayload = {
  executionId: number;
  automationId: number;
  status: AutomationExecutionStatusDto["status"];
  isTerminal: true;
  totalRecipients: number;
  emailsSent: number;
  progressPercent: number;
  queueJobId: string | null;
  lastError: string | null;
  finishedAt: string;
  stepType?: string | null;
};

export function isPusherConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_PUSHER_KEY?.trim() &&
      process.env.NEXT_PUBLIC_PUSHER_CLUSTER?.trim(),
  );
}

function resolveStepNode(
  stepType: string | null | undefined,
  existing?: AutomationExecution,
): AutomationExecution["currentNode"] {
  const type = stepType?.trim() || existing?.currentNode?.type?.trim();
  if (!type) return existing?.currentNode;

  return {
    id: existing?.currentNode?.id ?? 0,
    type,
    config: existing?.currentNode?.config ?? {},
    order: existing?.currentNode?.order ?? 0,
  };
}

export function mapPusherPayloadToExecution(
  payload: ExecutionTerminalPusherPayload,
  existing?: AutomationExecution,
): AutomationExecution {
  const finishedAt = payload.finishedAt;

  return {
    id: payload.executionId,
    automationId: payload.automationId,
    customerId: existing?.customerId ?? 0,
    currentNodeId: existing?.currentNodeId ?? 0,
    status: payload.status,
    scheduledAt: null,
    totalRecipients: payload.totalRecipients,
    emailsSentCount: payload.emailsSent,
    queueJobId: payload.queueJobId,
    lastError: payload.lastError,
    createdAt: existing?.createdAt ?? finishedAt,
    updatedAt: finishedAt,
    currentNode: resolveStepNode(payload.stepType, existing),
    automation: existing?.automation,
    customer: existing?.customer,
    executedRecipients: existing?.executedRecipients,
  };
}

export function mapPusherPayloadToStatusDto(
  payload: ExecutionTerminalPusherPayload,
  existing?: AutomationExecutionStatusDto,
): AutomationExecutionStatusDto {
  return {
    executionId: payload.executionId,
    automationId: payload.automationId,
    status: payload.status,
    isTerminal: true,
    totalRecipients: payload.totalRecipients,
    emailsSent: payload.emailsSent,
    progressPercent: payload.progressPercent,
    queueJobId: payload.queueJobId,
    lastError: payload.lastError,
    createdAt: existing?.createdAt ?? payload.finishedAt,
    updatedAt: payload.finishedAt,
  };
}
