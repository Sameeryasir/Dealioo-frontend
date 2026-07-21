import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export const RESTAURANT_ACTIVITY_PAGE_SIZE = 10;

export type ActivityEventType =
  | "visited"
  | "redeemed_reward"
  | "prepaid_for_offer"
  | "message_sent";

export type ActivityEventFilter = "all" | ActivityEventType;

export type ActivityQueryFilters = {
  eventType?: ActivityEventFilter;
  from?: string;
  to?: string;
  search?: string;
};

export type RestaurantActivityEvent = {
  id: number;
  eventType: ActivityEventType;
  occurredAt: string;
  customerName: string | null;
  customerEmail: string | null;
  description: string;
};

export type ActivitySummary = {
  totalEvents: number;
  totalVisited: number;
  totalRedeemed: number;
  totalPrepaid: number;
  totalMessagesSent: number;
  from?: string;
  to?: string;
};

export type ActivityMonthlyPoint = {
  month: string;
  totalEvents: number;
  checkIns?: number;
  visited: number;
  redeemedReward: number;
  prepaidForOffer: number;
  messageSent: number;
  prepaidRevenueCents: number;
  orders?: number;
  members?: number;
};

export type ActivityMonthlyResponse = {
  businessId: number;
  months: number;
  activeCampaigns: number;
  totalOrders: number;
  totalMembers: number;
  todayRevenueCents: number;
  data: ActivityMonthlyPoint[];
};

export type PaginatedActivityResponse = {
  data: RestaurantActivityEvent[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    allEventsTotal: number;
  };
};

function appendActivityFilters(
  params: URLSearchParams,
  filters: ActivityQueryFilters = {},
) {
  const eventType = filters.eventType ?? "all";
  if (eventType !== "all") {
    params.set("eventType", eventType);
  }
  if (filters.from) {
    params.set("from", filters.from);
  }
  if (filters.to) {
    params.set("to", filters.to);
  }
  const search = filters.search?.trim();
  if (search) {
    params.set("search", search);
  }
}

export async function getRestaurantActivityEvents(
  restaurantId: number,
  options: {
    page?: number;
    limit?: number;
  } & ActivityQueryFilters = {},
): Promise<PaginatedActivityResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(restaurantId)) {
    throw new Error("Valid business id is required.");
  }

  const q = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? RESTAURANT_ACTIVITY_PAGE_SIZE),
  });

  appendActivityFilters(q, options);

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/activity/business/${encodeURIComponent(String(restaurantId))}/events?${q.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load activity events."),
    );
  }

  return (await res.json()) as PaginatedActivityResponse;
}

export async function getRestaurantActivitySummary(
  restaurantId: number,
  options: ActivityQueryFilters = {},
): Promise<ActivitySummary> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(restaurantId)) {
    throw new Error("Valid business id is required.");
  }

  const q = new URLSearchParams();
  appendActivityFilters(q, options);

  const query = q.toString();
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/activity/business/${encodeURIComponent(String(restaurantId))}/summary${query ? `?${query}` : ""}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load activity summary."),
    );
  }

  return (await res.json()) as ActivitySummary;
}

export async function getRestaurantActivityMonthly(
  restaurantId: number,
  options: { months?: number } = {},
): Promise<ActivityMonthlyResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(restaurantId)) {
    throw new Error("Valid business id is required.");
  }

  const months = options.months ?? 6;
  const q = new URLSearchParams({ months: String(months) });

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/activity/business/${encodeURIComponent(String(restaurantId))}/summary/monthly?${q.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load activity chart."),
    );
  }

  return (await res.json()) as ActivityMonthlyResponse;
}
