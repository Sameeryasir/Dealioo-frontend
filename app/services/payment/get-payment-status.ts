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
  paidAt: string | null;
  syncedFromStripe?: boolean;
  syncSource?: "status_sync";
  stripeLifecycle?: "processing" | null;
};

export async function getPaymentStatus(
  paymentId: number,
  checkoutToken: string,
): Promise<PaymentStatusResponse> {
  if (!Number.isFinite(paymentId) || paymentId < 1) {
    throw new Error("Payment id is required.");
  }
  const token = checkoutToken?.trim();
  if (!token) {
    throw new Error("Checkout token is required.");
  }

  const params = new URLSearchParams({ checkoutToken: token });
  const res = await fetch(
    `${getApiBaseUrl()}/payment/${encodeURIComponent(String(paymentId))}/status?${params.toString()}`,
    { method: "GET", cache: "no-store" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load payment status."),
    );
  }

  return res.json() as Promise<PaymentStatusResponse>;
}
