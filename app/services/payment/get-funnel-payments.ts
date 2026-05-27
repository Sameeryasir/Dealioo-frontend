import {
  getApiBaseUrl,
  parseApiErrorMessage,
} from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

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

export type FunnelPaymentsResponse = {
  payments: FunnelPayment[];
};

export async function getFunnelPayments(
  funnelId: number,
): Promise<FunnelPayment[]> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(funnelId)) {
    throw new Error("Valid funnel id is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/payment/funnel/${encodeURIComponent(String(funnelId))}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load funnel payments."),
    );
  }

  const json = (await res.json()) as FunnelPaymentsResponse | FunnelPayment[];
  if (Array.isArray(json)) return json;
  return Array.isArray(json.payments) ? json.payments : [];
}
