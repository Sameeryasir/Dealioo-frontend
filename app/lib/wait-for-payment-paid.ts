import { getPaymentStatus } from "@/app/services/payment/get-payment-status";

/** Poll backend until payment is paid or failed (webhook / status sync / recovery). */
export async function waitForPaymentPaid(
  paymentId: number,
  opts?: { maxAttempts?: number; intervalMs?: number },
): Promise<boolean> {
  const maxAttempts = opts?.maxAttempts ?? 60;
  const intervalMs = opts?.intervalMs ?? 2_000;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await getPaymentStatus(paymentId);
      if (res.status === "paid") return true;
      if (res.status === "failed" || res.status === "cancelled") {
        return false;
      }
    } catch {
      // Keep polling through transient network errors.
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}
