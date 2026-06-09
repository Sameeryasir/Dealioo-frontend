import { hasAuthSession } from "@/app/lib/auth-session";
import { authAxios } from "@/app/lib/auth-axios";

export type RestaurantFunnelDeal = {
  id: number;
  campaignName: string;
  price: number | string | null;
};

type FunnelApiRow = {
  id?: number;
  campaignName?: string;
  price?: number | string | null;
};

function mapFunnelRow(row: FunnelApiRow): RestaurantFunnelDeal | null {
  if (typeof row.id !== "number" || row.id < 1) return null;

  const name = row.campaignName?.trim();
  if (!name) return null;

  return {
    id: row.id,
    campaignName: name,
    price: row.price ?? null,
  };
}

export async function fetchFunnelsByRestaurant(
  restaurantId: number,
): Promise<RestaurantFunnelDeal[]> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }

  const response = await authAxios.get<unknown>(
    `/funnel/restaurant/${restaurantId}`,
  );

  const rows = Array.isArray(response.data) ? response.data : [];
  return rows
    .map((row) => mapFunnelRow(row as FunnelApiRow))
    .filter((row): row is RestaurantFunnelDeal => row != null);
}
