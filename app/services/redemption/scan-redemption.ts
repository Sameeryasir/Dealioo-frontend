import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export type ScanRedemptionSuccess = {
  success: true;
  customerName: string;
  campaignName: string;
  couponStatus: string;
  redeemedAt: string;
  totalVisits: number;
  rewardsAvailable: number;
  previouslyRedeemedCount: number;
};

export type RedeemableReward = {
  couponId: number;
  label: string;
  paymentLabel: "PREPAID" | "UNPAID";
  campaignPrice?: number | null;
  isScannedCoupon: boolean;
  canSelect: boolean;
};

export type ScanPreviewSuccess = {
  success: true;
  customer: {
    id: number;
    name: string;
    email: string;
  };
  coupon: {
    id: number;
    status: string;
    paymentStatus: string;
    expiresAt: string | null;
    redeemedAt: string | null;
  };
  campaign: {
    id: number;
    name: string;
  };
  customerName: string;
  customerEmail: string;
  campaignName: string;
  totalVisits: number;
  rewardsAvailable: number;
  upcomingRewardsCount: number;
  previouslyRedeemedCount: number;
  previousRedemptions: Array<{
    campaignName: string;
    redeemedAt: string;
  }>;
  canRedeem: boolean;
  requiresWalkInPayment: boolean;
  redeemBlockedReason: string | null;
  paymentStatus: string;
  couponStatus: string;
  couponExpired: boolean;
  qrToken: string;
  scannedCouponId: number;
  availableRewards: RedeemableReward[];
};

export type ScanPreviewFailure = {
  success: false;
  message: string;
};

export type ScanPreviewResponse = ScanPreviewSuccess | ScanPreviewFailure;

export type ScanRedemptionFailure = {
  success: false;
  message: string;
};

export type ScanRedemptionResponse =
  | ScanRedemptionSuccess
  | ScanRedemptionFailure;

function createRedemptionIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `redeem-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

async function postScanPayload(
  restaurantId: number,
  qrToken: string,
  pathSuffix: "" | "/preview",
  couponIds?: number[],
  orderSubtotal?: number,
  idempotencyKey?: string,
  channel: "qr_scan" | "staff_lookup" = "qr_scan",
): Promise<Response> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(restaurantId)) {
    throw new Error("Valid business id is required.");
  }
  if (!qrToken.trim()) {
    throw new Error("QR token is required.");
  }

  return authenticatedFetch(
    `${getApiBaseUrl()}/redemption/scan/${encodeURIComponent(String(restaurantId))}${pathSuffix}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        qrToken: qrToken.trim(),
        couponIds: couponIds?.length ? couponIds : undefined,
        orderSubtotal,
        idempotencyKey,
        channel: pathSuffix === "" ? channel : undefined,
        deviceInfo:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      }),
    },
  );
}

export async function previewRedemptionQr(
  restaurantId: number,
  qrToken: string,
): Promise<ScanPreviewResponse> {
  const res = await postScanPayload(restaurantId, qrToken, "/preview");

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not read this QR code."),
    );
  }

  return (await res.json()) as ScanPreviewResponse;
}

export async function scanRedemptionQr(
  restaurantId: number,
  qrToken: string,
  couponIds?: number[],
  orderSubtotal?: number,
  idempotencyKey: string = createRedemptionIdempotencyKey(),
  channel: "qr_scan" | "staff_lookup" = "qr_scan",
): Promise<ScanRedemptionResponse> {
  const res = await postScanPayload(
    restaurantId,
    qrToken,
    "",
    couponIds,
    orderSubtotal,
    idempotencyKey,
    channel,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not redeem this QR code."),
    );
  }

  return (await res.json()) as ScanRedemptionResponse;
}

export type RedemptionStats = {
  couponsIssued: number;
  couponsRedeemed: number;
  restaurantVisits: number;
  redemptionRate: number;
};

export async function getRedemptionStats(
  restaurantId: number,
): Promise<RedemptionStats> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/redemption/business/${encodeURIComponent(String(restaurantId))}/stats`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load redemption stats."),
    );
  }

  return (await res.json()) as RedemptionStats;
}

export type GuestActiveDeal = {
  couponId: number;
  funnelId?: number | null;
  campaignId?: number | null;
  campaignName: string;
  offerName: string;
  paymentLabel: "PREPAID" | "UNPAID";
  paymentBadge?: "PAID_ONLINE" | "PAID_AT_COUNTER" | "PENDING";
  paymentStatus: string;
  campaignPrice?: number | null;
  expiresAt: string | null;
  canSelect?: boolean;
  qrToken?: string;
};

export type GuestProfile = {
  customerId: number;
  customerName: string;
  email: string;
  phone: string | null;
  totalVisits: number;
  rewardsAvailable: number;
  upcomingRewardsCount: number;
  previouslyRedeemedCount: number;
  previousRedemptions: Array<{
    campaignName: string;
    redeemedAt: string;
  }>;
  activeDeals: GuestActiveDeal[];
};

export async function getGuestProfile(
  restaurantId: number,
  customerId: number,
): Promise<GuestProfile | null> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(restaurantId) || !isPositiveInt(customerId)) {
    throw new Error("Valid business and guest ids are required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/redemption/business/${encodeURIComponent(String(restaurantId))}/guests/${encodeURIComponent(String(customerId))}/profile`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load guest profile."),
    );
  }

  const profile = (await res.json()) as GuestProfile;
  return {
    ...profile,
    activeDeals: profile.activeDeals ?? [],
  };
}

export type GuestPassUnavailableReason = "revoked" | "expired" | "redeemed";

export type GuestCouponResponse = {
  id: number;
  status: string;
  paymentStatus: string;
  paymentConfirmed: boolean;
  issuedAt: string;
  expiresAt: string | null;
  campaignName: string | null;
  customerName: string | null;
  passAvailable: boolean;
  passUnavailableReason: GuestPassUnavailableReason | null;
  passMessage: string | null;
  qr: {
    couponId: number;
    token: string;
    qrDataUrl: string;
  } | null;
};

export async function getGuestCouponByPayment(
  funnelPaymentId: number,
): Promise<GuestCouponResponse> {
  const res = await fetch(
    `${getApiBaseUrl()}/redemption/coupon/payment/${encodeURIComponent(String(funnelPaymentId))}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load your pass."),
    );
  }

  return (await res.json()) as GuestCouponResponse;
}

export async function getGuestCouponByCustomerAndFunnel(
  customerId: number,
  funnelId: number,
): Promise<GuestCouponResponse> {
  const res = await fetch(
    `${getApiBaseUrl()}/redemption/coupon/customer/${encodeURIComponent(String(customerId))}/funnel/${encodeURIComponent(String(funnelId))}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load your pass."),
    );
  }

  return (await res.json()) as GuestCouponResponse;
}
