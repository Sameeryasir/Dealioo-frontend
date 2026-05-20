import { automationFetch } from "@/app/services/automation/automation-fetch";
import {
  EXECUTIONS_PAGE_SIZE,
  type AutomationExecution,
  type AutomationExecutionStatus,
  type AutomationExecutionStatusDto,
  type PaginatedExecutionsResponse,
  type StartAutomationExecutionBody,
  type StartAutomationExecutionResponse,
} from "@/app/services/automation/types";

export type GetExecutionsParams = {
  automationId?: number;
  customerId?: number;
  status?: AutomationExecutionStatus;
  page?: number;
  limit?: number;
};

export async function getExecutions(
  params?: GetExecutionsParams,
): Promise<PaginatedExecutionsResponse> {
  const q = new URLSearchParams();
  if (params?.automationId != null) {
    q.set("automationId", String(params.automationId));
  }
  if (params?.customerId != null) {
    q.set("customerId", String(params.customerId));
  }
  if (params?.status) {
    q.set("status", params.status);
  }
  q.set("page", String(params?.page ?? 1));
  q.set("limit", String(params?.limit ?? EXECUTIONS_PAGE_SIZE));
  const query = q.toString();
  return automationFetch<PaginatedExecutionsResponse>(
    `/execution?${query}`,
  );
}

export async function getExecutionById(
  id: number,
): Promise<AutomationExecution> {
  return automationFetch<AutomationExecution>(`/execution/${id}`);
}

/** GET /automation/execution/:id/status — poll until isTerminal is true. */
export async function getExecutionStatus(
  executionId: number,
): Promise<AutomationExecutionStatusDto> {
  return automationFetch<AutomationExecutionStatusDto>(
    `/execution/${executionId}/status`,
  );
}

/** POST /automation/execution — only automationId (no customerId in body). */
export async function startExecution(
  automationId: number,
  options?: Pick<StartAutomationExecutionBody, "currentNodeId">,
): Promise<StartAutomationExecutionResponse> {
  const payload: StartAutomationExecutionBody = { automationId };
  const nodeId = options?.currentNodeId;
  if (nodeId != null && Number.isInteger(nodeId) && nodeId >= 1) {
    payload.currentNodeId = nodeId;
  }
  return automationFetch<StartAutomationExecutionResponse>("/execution", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function processExecution(id: number): Promise<void> {
  await automationFetch<void>(`/execution/${id}/process`, { method: "POST" });
}

export async function resumeExecution(id: number): Promise<void> {
  await automationFetch<void>(`/execution/${id}/resume`, { method: "POST" });
}

/** DELETE /automation/execution/:id */
export async function deleteExecution(id: number): Promise<void> {
  await automationFetch<void>(`/execution/${id}`, { method: "DELETE" });
}
