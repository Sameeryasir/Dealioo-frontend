import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";
import type { AutomationExecutionStatus } from "@/app/services/automation/types";

export const RESTAURANT_CHAT_PAGE_SIZE = 20;

export type ActiveFlowCustomer = {
  executionId: number;
  customerId: number;
  customerName: string | null;
  customerEmail: string | null;
  automationId: number;
  automationName: string;
  status: AutomationExecutionStatus;
  stepType: string | null;
  scheduledAt: string | null;
  startedAt: string;
  updatedAt: string;
};

export type PaginatedActiveFlowCustomersResponse = {
  data: ActiveFlowCustomer[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function getRestaurantActiveFlowCustomers(
  restaurantId: number,
  options: { page?: number; limit?: number } = {},
): Promise<PaginatedActiveFlowCustomersResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(restaurantId)) {
    throw new Error("Valid restaurant id is required.");
  }

  const q = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? RESTAURANT_CHAT_PAGE_SIZE),
  });

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/chat/restaurant/${encodeURIComponent(String(restaurantId))}/active-flows?${q.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(
        res,
        "Could not load customers with active automations.",
      ),
    );
  }

  return (await res.json()) as PaginatedActiveFlowCustomersResponse;
}
