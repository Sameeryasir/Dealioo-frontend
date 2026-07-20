import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export const BUSINESS_CUSTOMERS_PAGE_SIZE = 10;

export type BusinessCustomerRecord = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  joiningDate: string;
  visitCount: number;
};

export type PaginatedBusinessCustomersResponse = {
  data: BusinessCustomerRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type BusinessJoiningTrendPoint = {
  label: string;
  monthKey: string;
  joined: number;
};

export async function getBusinessCustomers(
  businessId: number,
  page = 1,
  limit = BUSINESS_CUSTOMERS_PAGE_SIZE,
): Promise<PaginatedBusinessCustomersResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }

  const q = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/customer/business/${businessId}?${q.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load customers."),
    );
  }

  return (await res.json()) as PaginatedBusinessCustomersResponse;
}

export async function getBusinessJoiningTrend(
  businessId: number,
  months = 6,
): Promise<BusinessJoiningTrendPoint[]> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }

  const q = new URLSearchParams({ months: String(months) });
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/customer/business/${businessId}/joining-trend?${q.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load joining trend."),
    );
  }

  const data: unknown = await res.json();
  return Array.isArray(data) ? (data as BusinessJoiningTrendPoint[]) : [];
}
