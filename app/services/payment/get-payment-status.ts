import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";

export type FunnelPaymentStatusValue =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded"
  | "disputed";

export type PaymentStatusResponse = {
  paymentId: number;
  status: FunnelPaymentStatusValue;
  stripePaymentIntentId: string | null;
  paidAt: string | null;
  failureReason: string | null;
  refundedAmount: number;
  disputeStatus: string | null;
};

/**
 * Fetch funnel payment status from the backend.
 * No short client abort — slow Stripe verification must not look like a failed payment.
 */
export async function getPaymentStatus(
  paymentId: number,
): Promise<PaymentStatusResponse> {
  if (!Number.isFinite(paymentId) || paymentId < 1) {
    throw new Error("Payment id is required.");
  }

  const res = await fetch(
    `${getApiBaseUrl()}/payment/${encodeURIComponent(String(paymentId))}/status`,
    { method: "GET", cache: "no-store" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load payment status."),
    );
  }

  return res.json() as Promise<PaymentStatusResponse>;
}
