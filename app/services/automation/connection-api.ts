import { automationFetch } from "@/app/services/automation/automation-fetch";
import type {
  AutomationConnection,
  CreateAutomationConnectionBody,
  SyncAutomationConnectionsBody,
} from "@/app/services/automation/types";

export async function createAutomationConnection(
  body: CreateAutomationConnectionBody,
): Promise<AutomationConnection> {
  return automationFetch<AutomationConnection>("/connection", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function syncAutomationConnections(
  body: SyncAutomationConnectionsBody,
): Promise<AutomationConnection[]> {
  return automationFetch<AutomationConnection[]>("/connection/sync", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteAutomationConnection(id: number): Promise<void> {
  await automationFetch<void>(`/connection/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
  });
}
