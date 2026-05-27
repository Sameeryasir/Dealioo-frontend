import { hasAuthSession } from "@/app/lib/auth-session";
import { authAxios } from "@/app/lib/auth-axios";

export type Funnel = {
  id: number;
  restaurantId: number;
  campaignName: string;
  websiteUrl: string;
  imageUrl?: string;
  offer?: string;
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
  restaurantId: number,
): Promise<Funnel[]> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }

  const response = await authAxios.get<unknown>(
    `/campaign/restaurant/${restaurantId}`,
  );

  return campaignsFromResponseBody(response.data);
}
