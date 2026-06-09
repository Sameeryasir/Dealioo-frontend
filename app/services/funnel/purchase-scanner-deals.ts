import { hasAuthSession } from "@/app/lib/auth-session";
import { authAxios } from "@/app/lib/auth-axios";

export type ScannerPurchasedDeal = {
  funnelId: number;
  campaignName: string;
  couponId: number;
};

export async function purchaseScannerDeals(params: {
  restaurantId: number;
  customerId: number;
  funnelIds: number[];
  orderSubtotal: number;
}): Promise<ScannerPurchasedDeal[]> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }

  const response = await authAxios.post<ScannerPurchasedDeal[]>(
    `/funnel-event/restaurant/${params.restaurantId}/guest/${params.customerId}/purchase-deals`,
    {
      funnelIds: params.funnelIds,
      orderSubtotal: params.orderSubtotal,
    },
  );

  return Array.isArray(response.data) ? response.data : [];
}
