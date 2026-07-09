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
};

export type PaginatedActivityResponse = {
  data: RestaurantActivityEvent[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function getRestaurantActivityEvents(
  restaurantId: number,
  options: {
    page?: number;
    limit?: number;
    eventType?: ActivityEventType | "all";
    from?: string;
    to?: string;
  } = {},
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

  if (options.eventType && options.eventType !== "all") {
    q.set("eventType", options.eventType);
  }
  if (options.from) {
    q.set("from", options.from);
  }
  if (options.to) {
    q.set("to", options.to);
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/activity/restaurant/${encodeURIComponent(String(restaurantId))}/events?${q.toString()}`,
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
  options: { from?: string; to?: string } = {},
): Promise<ActivitySummary> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(restaurantId)) {
    throw new Error("Valid business id is required.");
  }

  const q = new URLSearchParams();
  if (options.from) q.set("from", options.from);
  if (options.to) q.set("to", options.to);

  const query = q.toString();
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/activity/restaurant/${encodeURIComponent(String(restaurantId))}/summary${query ? `?${query}` : ""}`,
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
