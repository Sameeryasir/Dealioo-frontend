import { automationFetch } from "@/app/services/automation/automation-fetch";
import { purposeToDisplayLabel } from "@/app/services/automation/automation-purpose";
import type {
  Automation,
  AutomationPurpose,
  CreateAutomationBody,
  PaginationMeta,
  UpdateAutomationBody,
  UpdateAutomationResponse,
} from "@/app/services/automation/types";
import type {
  AutomationListItem,
  AutomationStatus,
} from "@/app/components/automation/types";

const UI_TRIGGER_TO_API: Record<string, string> = {
  Signup: "signup",
  Payment: "payment",
  "Funnel Complete": "funnel_completed",
  "Abandoned Checkout": "abandoned_checkout",
  "First Purchase": "first_purchase",
  "No Visit": "no_visit",
  "Win-back": "no_visit",
  "Cron Job": "cron",
};

const API_TRIGGER_TO_UI: Record<string, string> = {
  signup: "Signup",
  payment: "Payment",
  funnel_completed: "Funnel Complete",
  funnel_complete: "Funnel Complete",
  abandoned_checkout: "Abandoned Checkout",
  first_purchase: "First Purchase",
  no_visit: "Win-back",
  cron: "Cron Job",
};

export function triggerToApi(trigger: string): string {
  return UI_TRIGGER_TO_API[trigger] ?? trigger.toLowerCase().replace(/\s+/g, "_");
}

export function triggerToUi(trigger: string): string {
  return API_TRIGGER_TO_UI[trigger] ?? trigger;
}

export function purposeToUi(
  purpose: AutomationPurpose | string | null | undefined,
  trigger?: string | null,
): string {
  return purposeToDisplayLabel(purpose, trigger);
}

export function automationStatusFromApi(automation: Automation): AutomationStatus {
  if (automation.isActive) return "active";
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
    purpose: purposeToUi(automation.purpose, automation.trigger),
    status: listStatusFromApi(automation),
    business: businessLabel,
    campaignId: automation.campaignId,
    lastUpdated: formatLastUpdated(automation.updatedAt ?? automation.createdAt),
    customersEntered: 0,
  };
}

export async function getAutomations(
  params: {
    businessId?: number;
    campaignId?: number;
    q?: string;
    status?: "active" | "draft";
    page?: number;
    limit?: number;
  } = {},
): Promise<{ data: Automation[]; meta: PaginationMeta }> {
  // What changed: accept page/limit/campaign/search/status and return { data, meta }.
  // Why: list UI paginates server-side; provision/edit still pass a high limit.
  const search = new URLSearchParams();
  if (params.businessId != null) {
    search.set("businessId", String(params.businessId));
  }
  if (params.campaignId != null && params.campaignId >= 1) {
    search.set("campaignId", String(params.campaignId));
  }
  if (params.q?.trim()) {
    search.set("q", params.q.trim());
  }
  if (params.status === "active" || params.status === "draft") {
    search.set("status", params.status);
  }
  if (params.page != null) {
    search.set("page", String(params.page));
  }
  if (params.limit != null) {
    search.set("limit", String(params.limit));
  }
  const query = search.toString();
  return automationFetch<{ data: Automation[]; meta: PaginationMeta }>(
    query ? `?${query}` : "",
  );
}

export type AutomationsListPage = {
  data: AutomationListItem[];
  meta: PaginationMeta;
};

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
): Promise<UpdateAutomationResponse> {
  return automationFetch<UpdateAutomationResponse>(
    `/${encodeURIComponent(String(id))}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

export async function activateAutomation(id: number): Promise<Automation> {
  return automationFetch<Automation>(
    `/${encodeURIComponent(String(id))}/activate`,
    { method: "POST" },
  );
}

export async function deactivateAutomation(id: number): Promise<Automation> {
  return automationFetch<Automation>(
    `/${encodeURIComponent(String(id))}/deactivate`,
    { method: "POST" },
  );
}

export async function publishAutomation(id: number): Promise<Automation> {
  return automationFetch<Automation>(
    `/${encodeURIComponent(String(id))}/publish`,
    { method: "POST" },
  );
}
