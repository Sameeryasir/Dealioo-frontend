import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export const GUEST_SEARCH_PAGE_SIZE = 10;

export type CustomerSearchResult = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
};

export type PaginatedCustomerSearchResponse = {
  data: CustomerSearchResult[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function searchCustomers(
  businessId: number,
  query: string,
  page = 1,
  limit = GUEST_SEARCH_PAGE_SIZE,
): Promise<PaginatedCustomerSearchResponse> {
  if (!Number.isFinite(businessId) || businessId < 1) {
    throw new Error("Invalid business.");
  }
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }

  const trimmed = query.trim();
  if (!trimmed) {
    return {
      data: [],
      meta: { page: 1, limit, total: 0, totalPages: 0 },
    };
  }

  const params = new URLSearchParams({
    q: trimmed,
    page: String(page),
    limit: String(limit),
  });

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/customer/business/${businessId}/scanner/guests/search?${params.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not search guests."),
    );
  }

  return (await res.json()) as PaginatedCustomerSearchResponse;
}
