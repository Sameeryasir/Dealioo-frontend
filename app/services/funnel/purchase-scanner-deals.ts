import { hasAuthSession } from "@/app/lib/auth-session";
import { authAxios } from "@/app/lib/auth-axios";

export type ScannerPurchasedDeal = {
  funnelId: number;
  campaignName: string;
  couponId: number;
};

export async function purchaseScannerDeals(params: {
  businessId: number;
  /** @deprecated Use businessId */
  restaurantId?: number;
  customerId: number;
  funnelIds: number[];
  orderSubtotal?: number;
  extraItemsAmount?: number;
  idempotencyKey?: string;
}): Promise<ScannerPurchasedDeal[]> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }

  const businessId = params.businessId ?? params.restaurantId;
  if (businessId == null || businessId < 1) {
    throw new Error("Business is required.");
  }

  const response = await authAxios.post<ScannerPurchasedDeal[]>(
    `/funnel-event/business/${businessId}/guest/${params.customerId}/purchase-deals`,
    {
      funnelIds: params.funnelIds,
      ...(params.orderSubtotal != null
        ? { orderSubtotal: params.orderSubtotal }
        : {}),
      ...(params.extraItemsAmount != null && params.extraItemsAmount > 0
        ? { extraItemsAmount: params.extraItemsAmount }
        : {}),
      ...(params.idempotencyKey?.trim()
        ? { idempotencyKey: params.idempotencyKey.trim() }
        : {}),
    },
  );

  return Array.isArray(response.data) ? response.data : [];
}
