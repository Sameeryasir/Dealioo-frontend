import {
  getApiBaseUrl,
  parseApiErrorMessage,
} from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export const FUNNEL_ORDERS_PAGE_SIZE = 10;

export type FunnelPayment = {
  id: number;
  funnelId: number;
  restaurantId: number;
  stripePaymentIntentId: string;
  stripeConnectedAccountId: string;
  amount: number;
  currency: string;
  status: string;
  customerEmail: string;
  paymentMethod: string;
  receiptUrl: string | null;
  failureReason: string | null;
  failedAt: string | null;
  cancelledAt: string | null;
  stripeRefundId: string | null;
  refundedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Server-paginated orders for one funnel (page/limit applied on the API). */
export type PaginatedFunnelOrdersResponse = {
  funnelId: number;
  data: FunnelPayment[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function getFunnelOrders(
  funnelId: number,
  page = 1,
  limit = FUNNEL_ORDERS_PAGE_SIZE,
): Promise<PaginatedFunnelOrdersResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(funnelId)) {
    throw new Error("Valid funnel id is required.");
  }

  const q = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/payment/funnel/${encodeURIComponent(String(funnelId))}/orders?${q.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load funnel orders."),
    );
  }

  const json = (await res.json()) as PaginatedFunnelOrdersResponse;

  if (!Array.isArray(json.data) || !json.meta) {
    throw new Error("Invalid funnel orders response from server.");
  }

  return json;
}
