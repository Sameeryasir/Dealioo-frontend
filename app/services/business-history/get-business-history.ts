import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export const BUSINESS_HISTORY_PAGE_SIZE = 10;

export type BusinessHistoryEventType =
  | "campaign_created"
  | "campaign_updated"
  | "campaign_deleted"
  | "business_created"
  | "business_updated"
  | "business_deleted"
  | "automation_updated"
  | "automation_activated"
  | "automation_deleted"
  | "funnel_updated"
  | "funnel_deleted";

export type BusinessHistoryEvent = {
  id: number;
  eventType: BusinessHistoryEventType;
  description: string;
  actorUserId: number | null;
  actorName: string | null;
  occurredAt: string;
};

export type PaginatedBusinessHistoryResponse = {
  data: BusinessHistoryEvent[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function getBusinessHistory(
  businessId: number,
  options: { page?: number } = {},
): Promise<PaginatedBusinessHistoryResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(businessId)) {
    throw new Error("Valid business id is required.");
  }

  const q = new URLSearchParams({
    page: String(options.page ?? 1),
  });

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/business-history/business/${encodeURIComponent(String(businessId))}?${q.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load business history."),
    );
  }

  return (await res.json()) as PaginatedBusinessHistoryResponse;
}
