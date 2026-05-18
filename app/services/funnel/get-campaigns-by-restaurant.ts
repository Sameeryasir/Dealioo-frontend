/**
 * Change: Accept GET body as either a raw campaign array or `{ data: [...] }`.
 * Why: Backend returns `[{ id, ... }]`; reading only `.data` yielded [] so the list never showed.
 * Related: `app/(routes)/restaurant/[restaurantId]/dashboard/campaigns/page.tsx`
 */
import axios from "axios";
import { getApiBaseUrl } from "@/app/lib/api";

export type Funnel = {
  id: number;
  restaurantId: number;
  campaignName: string;
  websiteUrl: string;
  imageUrl?: string;
  offer?: string;
  /** API may send a number or a decimal string (e.g. `"10.99"`). */
  price?: number | string;
  published?: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type CampaignListWrapped = {
  data?: Funnel[] | null;
};

function campaignsFromResponseBody(body: unknown): Funnel[] {
  if (Array.isArray(body)) return body as Funnel[];
  if (body && typeof body === "object" && "data" in body) {
    const inner = (body as CampaignListWrapped).data;
    if (Array.isArray(inner)) return inner;
  }
  return [];
}

export async function fetchCampaignsByRestaurant(
  accessToken: string,
  restaurantId: number,
): Promise<Funnel[]> {
  if (!accessToken) {
    throw new Error("Missing access token. Sign in again.");
  }

  const response = await axios.get<unknown>(
    `${getApiBaseUrl()}/campaign/restaurant/${restaurantId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return campaignsFromResponseBody(response.data);
}
