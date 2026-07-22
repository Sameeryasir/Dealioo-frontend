import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export const RESTAURANT_FUNNEL_EVENTS_PAGE_SIZE = 10;

export type BusinessFunnelEventStatusFilter = "all" | "paid" | "not_paid";
export type BusinessFunnelEventDateFilter = "all" | "today" | "week" | "month";

export type BusinessFunnelEventFilters = {
  status?: BusinessFunnelEventStatusFilter;
  date?: BusinessFunnelEventDateFilter;
  search?: string;
};

export type RestaurantOrderPaymentStatus =
  | "not_paid"
  | "paid_online"
  | "paid_walk_in"
  | "paid_both";

export type BusinessFunnelEvent = {
  id: number;
  rowKey?: string;
  eventType: "signup" | "payment";
  createdAt: string;
  funnelId: number;
  campaignId: number;
  campaignName: string;
  customer: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  } | null;
  customerEmail: string | null;
  amount: number | null;
  currency: string | null;
  paymentStatus: string | null;
  receiptUrl: string | null;
  orderStatus: RestaurantOrderPaymentStatus;
  onlineAmountCents: number | null;
  businessAmount: number | null;
  businessVisitedAt: string | null;
  paidAt: string | null;
  funnelPaymentId: number | null;
  /** @deprecated Use businessAmount */
  restaurantAmount?: number | null;
  /** @deprecated Use businessVisitedAt */
  restaurantVisitedAt?: string | null;
};

export type PaginatedBusinessFunnelEventsResponse = {
  data: BusinessFunnelEvent[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    campaignCount: number;
    funnelCount: number;
    allEventsTotal: number;
  };
};

export async function getBusinessFunnelEvents(
  restaurantId: number,
  page = 1,
  limit = RESTAURANT_FUNNEL_EVENTS_PAGE_SIZE,
  filters: BusinessFunnelEventFilters = {},
): Promise<PaginatedBusinessFunnelEventsResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(restaurantId)) {
    throw new Error("Valid business id is required.");
  }

  const q = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const status = filters.status ?? "all";
  const date = filters.date ?? "all";
  const search = filters.search?.trim() ?? "";

  if (status !== "all") {
    q.set("status", status);
  }
  if (date !== "all") {
    q.set("date", date);
  }
  if (search.length > 0) {
    q.set("search", search);
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/funnel-event/business/${encodeURIComponent(String(restaurantId))}/events?${q.toString()}`,
    {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(
        res,
        "Could not load business funnel events.",
      ),
    );
  }

  return (await res.json()) as PaginatedBusinessFunnelEventsResponse;
}
