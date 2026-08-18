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
  | "automation_deactivated"
  | "automation_deleted"
  | "funnel_updated"
  | "funnel_deleted"
  | "scanner_redeemed"
  | "scanner_payment"
  | "scanner_purchase";

export type HistoryCategory =
  | "all"
  | "funnels"
  | "automations"
  | "campaigns"
  | "payments";

export type BusinessHistoryEvent = {
  id: number;
  eventType: BusinessHistoryEventType;
  description: string;
  actorUserId: number | null;
  actorName: string | null;
  actorRole: string | null;
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
  counts: Record<HistoryCategory, number>;
  actors: Array<{ id: number; name: string }>;
};

export type BusinessHistoryListOptions = {
  page?: number;
  category?: HistoryCategory;
  eventType?: string;
  actorUserId?: number;
  q?: string;
  from?: string;
  to?: string;
};

export function businessHistoryQueryKey(
  businessId: number,
  options: BusinessHistoryListOptions = {},
) {
  return [
    "business-history",
    businessId,
    options.page ?? 1,
    options.category ?? "all",
    options.eventType ?? "",
    options.actorUserId ?? "",
    options.q ?? "",
    options.from ?? "",
    options.to ?? "",
  ] as const;
}

export async function getBusinessHistory(
  businessId: number,
  options: BusinessHistoryListOptions = {},
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
  if (options.category && options.category !== "all") {
    q.set("category", options.category);
  }
  if (options.eventType) q.set("eventType", options.eventType);
  if (options.actorUserId) q.set("actorUserId", String(options.actorUserId));
  if (options.q) q.set("q", options.q);
  if (options.from) q.set("from", options.from);
  if (options.to) q.set("to", options.to);

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

  const json = (await res.json()) as PaginatedBusinessHistoryResponse;
  return {
    ...json,
    counts: json.counts ?? {
      all: json.meta?.total ?? 0,
      funnels: 0,
      automations: 0,
      campaigns: 0,
      payments: 0,
    },
    actors: json.actors ?? [],
    data: (json.data ?? []).map((row) => ({
      ...row,
      actorRole: row.actorRole ?? null,
    })),
  };
}
