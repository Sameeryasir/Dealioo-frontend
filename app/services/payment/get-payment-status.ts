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

export async function getPaymentStatus(
  paymentId: number,
): Promise<PaymentStatusResponse> {
  if (!Number.isFinite(paymentId) || paymentId < 1) {
    throw new Error("Payment id is required.");
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8_000);

  try {
    const res = await fetch(
      `${getApiBaseUrl()}/payment/${encodeURIComponent(String(paymentId))}/status`,
      { method: "GET", cache: "no-store", signal: controller.signal },
    );

    if (!res.ok) {
      throw new Error(
        await parseApiErrorMessage(res, "Could not load payment status."),
      );
    }

    return res.json() as Promise<PaymentStatusResponse>;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Payment confirmation is taking longer than expected.");
    }
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
