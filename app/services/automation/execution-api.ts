import { automationFetch } from "@/app/services/automation/automation-fetch";
import type {
  AutomationExecution,
  AutomationExecutionStatus,
  AutomationLog,
  StartAutomationExecutionBody,
} from "@/app/services/automation/types";

export type GetExecutionsParams = {
  automationId?: number;
  customerId?: number;
  status?: AutomationExecutionStatus;
};

export async function getExecutions(
  params?: GetExecutionsParams,
): Promise<AutomationExecution[]> {
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
  const query = q.toString();
  return automationFetch<AutomationExecution[]>(
    `/execution${query ? `?${query}` : ""}`,
  );
}

export async function getExecutionById(
  id: number,
): Promise<AutomationExecution> {
  return automationFetch<AutomationExecution>(`/execution/${id}`);
}

export async function getExecutionLogs(
  executionId: number,
): Promise<AutomationLog[]> {
  return automationFetch<AutomationLog[]>(`/execution/${executionId}/logs`);
}

export async function getAutomationLogs(
  automationId: number,
): Promise<AutomationLog[]> {
  return automationFetch<AutomationLog[]>(
    `/log?automationId=${automationId}`,
  );
}

/** POST /automation/execution — only automationId (no customerId in body). */
export async function startExecution(
  automationId: number,
  options?: Pick<StartAutomationExecutionBody, "currentNodeId">,
): Promise<AutomationExecution> {
  const payload: StartAutomationExecutionBody = { automationId };
  const nodeId = options?.currentNodeId;
  if (nodeId != null && Number.isInteger(nodeId) && nodeId >= 1) {
    payload.currentNodeId = nodeId;
  }
  return automationFetch<AutomationExecution>("/execution", {
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
