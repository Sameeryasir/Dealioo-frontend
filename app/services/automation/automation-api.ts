import { automationFetch } from "@/app/services/automation/automation-fetch";
import type {
  Automation,
  CreateAutomationBody,
  UpdateAutomationBody,
} from "@/app/services/automation/types";
import type {
  AutomationListItem,
  AutomationStatus,
} from "@/app/components/automation/types";

const UI_TRIGGER_TO_API: Record<string, string> = {
  Signup: "signup",
  Payment: "payment",
  "Funnel Complete": "funnel_complete",
  "Abandoned Checkout": "abandoned_checkout",
  "Cron Job": "cron",
  "Tag Added": "tag_added",
};

const API_TRIGGER_TO_UI: Record<string, string> = {
  signup: "Signup",
  payment: "Payment",
  funnel_complete: "Funnel Complete",
  abandoned_checkout: "Abandoned Checkout",
  cron: "Cron Job",
  tag_added: "Tag Added",
};

export function triggerToApi(trigger: string): string {
  return UI_TRIGGER_TO_API[trigger] ?? trigger.toLowerCase().replace(/\s+/g, "_");
}

export function triggerToUi(trigger: string): string {
  return API_TRIGGER_TO_UI[trigger] ?? trigger;
}

export function automationStatusFromApi(automation: Automation): AutomationStatus {
  if (automation.isActive) return "active";
  if (automation.published) return "published";
  return "draft";
}

function listStatusFromApi(automation: Automation): AutomationStatus {
  return automationStatusFromApi(automation);
}

function formatLastUpdated(iso?: string): string {
  if (!iso) return "N/A";
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  } catch {
    return "N/A";
  }
}

export function mapAutomationToListItem(
  automation: Automation,
  businessLabel = "N/A",
): AutomationListItem {
  return {
    id: String(automation.id),
    numericId: automation.id,
    name: automation.name,
    description: automation.description?.trim() ?? "",
    trigger: triggerToUi(automation.trigger),
    status: listStatusFromApi(automation),
    business: businessLabel,
    campaignId: automation.campaignId,
    lastUpdated: formatLastUpdated(automation.updatedAt ?? automation.createdAt),
    customersEntered: 0,
  };
}

export async function getAutomations(
  businessId?: number,
): Promise<Automation[]> {
  const query =
    businessId != null ? `?businessId=${encodeURIComponent(String(businessId))}` : "";
  return automationFetch<Automation[]>(query);
}

export async function getAutomationById(id: number): Promise<Automation> {
  return automationFetch<Automation>(`/${id}`);
}

export async function createAutomation(
  body: CreateAutomationBody,
): Promise<Automation> {
  return automationFetch<Automation>("", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteAutomation(id: number): Promise<void> {
  await automationFetch<void>(`/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
  });
}

export async function updateAutomation(
  id: number,
  body: UpdateAutomationBody,
): Promise<Automation> {
  return automationFetch<Automation>(`/${encodeURIComponent(String(id))}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
