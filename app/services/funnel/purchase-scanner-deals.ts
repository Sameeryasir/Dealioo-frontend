import { hasAuthSession } from "@/app/lib/auth-session";
import { authAxios } from "@/app/lib/auth-axios";

export type ScannerPurchaseMeans = "IN_PERSON" | "REDEEMED" | "SCANNED";

export type ScannerPurchasedDeal = {
  funnelId: number;
  campaignName: string;
  couponId: number | null;
  purchaseMeans: ScannerPurchaseMeans;
};

export async function purchaseScannerDeals(params: {
  businessId: number;
  restaurantId?: number;
  customerId: number;
  funnelIds: number[];
  purchaseMeans: ScannerPurchaseMeans;
  orderSubtotal?: number;
  extraItemsAmount?: number;
  extraItemNames?: string[];
  extraItems?: Array<{ name: string; unitPrice: number; qty: number }>;
  idempotencyKey?: string;
}): Promise<ScannerPurchasedDeal[]> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }

  const businessId = params.businessId ?? params.restaurantId;
  if (businessId == null || businessId < 1) {
    throw new Error("Business is required.");
  }

  const extraItemNames = Array.isArray(params.extraItemNames)
    ? params.extraItemNames
        .map((name) => name.trim())
        .filter(Boolean)
        .slice(0, 20)
    : [];
  const extraItems = Array.isArray(params.extraItems)
    ? params.extraItems
        .filter(
          (item) =>
            item &&
            typeof item.name === "string" &&
            item.name.trim() &&
            Number.isFinite(item.unitPrice) &&
            item.unitPrice > 0 &&
            Number.isFinite(item.qty) &&
            item.qty >= 1,
        )
        .map((item) => ({
          name: item.name.trim().slice(0, 120),
          unitPrice: Math.round(item.unitPrice * 100) / 100,
          qty: Math.min(99, Math.max(1, Math.round(item.qty))),
        }))
        .slice(0, 20)
    : [];

  const response = await authAxios.post<ScannerPurchasedDeal[]>(
    `/funnel-event/business/${businessId}/guest/${params.customerId}/purchase-deals`,
    {
      funnelIds: params.funnelIds,
      purchaseMeans: params.purchaseMeans,
      ...(params.orderSubtotal != null
        ? { orderSubtotal: params.orderSubtotal }
        : {}),
      ...(params.extraItemsAmount != null && params.extraItemsAmount > 0
        ? { extraItemsAmount: params.extraItemsAmount }
        : {}),
      ...(extraItems.length > 0 ? { extraItems } : {}),
      ...(extraItemNames.length > 0 ? { extraItemNames } : {}),
      ...(params.idempotencyKey?.trim()
        ? { idempotencyKey: params.idempotencyKey.trim() }
        : {}),
    },
  );

  return Array.isArray(response.data) ? response.data : [];
}
