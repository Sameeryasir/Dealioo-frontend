import type {
  GuestCouponResponse,
  GuestPassUnavailableReason,
} from "@/app/services/redemption/scan-redemption";

const BLOCKED_STATUSES = new Set(["REVOKED", "REDEEMED", "EXPIRED"]);

/** Decide if the guest should see the unavailable alert instead of a QR. */
export function isGuestPassUnavailable(
  coupon: GuestCouponResponse | null | undefined,
): boolean {
  if (!coupon) return false;
  if (coupon.passAvailable === false) return true;
  if (coupon.qr?.qrDataUrl) return false;

  const status = coupon.status?.trim().toUpperCase() ?? "";
  return BLOCKED_STATUSES.has(status) || coupon.passUnavailableReason != null;
}

export function resolveGuestPassUnavailableReason(
  coupon: GuestCouponResponse,
): GuestPassUnavailableReason {
  if (coupon.passUnavailableReason) {
    return coupon.passUnavailableReason;
  }

  const status = coupon.status?.trim().toUpperCase() ?? "";
  if (status === "REVOKED") return "revoked";
  if (status === "REDEEMED") return "redeemed";
  return "expired";
}

export function canShowGuestPassQr(
  coupon: GuestCouponResponse | null | undefined,
): coupon is GuestCouponResponse & {
  qr: { qrDataUrl: string };
} {
  if (!coupon || isGuestPassUnavailable(coupon)) return false;
  return Boolean(coupon.qr?.qrDataUrl);
}
