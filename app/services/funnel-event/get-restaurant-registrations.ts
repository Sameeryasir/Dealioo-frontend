import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export const RESTAURANT_FUNNEL_EVENTS_PAGE_SIZE = 10;

export type RestaurantFunnelEvent = {
  id: number;
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
};

export type PaginatedRestaurantFunnelEventsResponse = {
  data: RestaurantFunnelEvent[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    campaignCount: number;
    funnelCount: number;
  };
};

export async function getRestaurantFunnelEvents(
  restaurantId: number,
  page = 1,
  limit = RESTAURANT_FUNNEL_EVENTS_PAGE_SIZE,
): Promise<PaginatedRestaurantFunnelEventsResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(restaurantId)) {
    throw new Error("Valid restaurant id is required.");
  }

  const q = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/funnel-event/restaurant/${encodeURIComponent(String(restaurantId))}/events?${q.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(
        res,
        "Could not load restaurant funnel events.",
      ),
    );
  }

  return (await res.json()) as PaginatedRestaurantFunnelEventsResponse;
}
