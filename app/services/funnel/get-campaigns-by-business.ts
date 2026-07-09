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

export const CAMPAIGNS_PAGE_SIZE = 6;

export type PaginatedCampaignsResponse = {
  data: Funnel[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function coerceCampaign(value: unknown): Funnel | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const id =
    typeof o.id === "number" && Number.isFinite(o.id)
      ? o.id
      : typeof o.id === "string" && /^\d+$/.test(o.id)
        ? Number.parseInt(o.id, 10)
        : null;
  const campaignName =
    typeof o.campaignName === "string"
      ? o.campaignName
      : typeof o.campaign_name === "string"
        ? o.campaign_name
        : null;
  const restaurantId =
    typeof o.restaurantId === "number" && Number.isFinite(o.restaurantId)
      ? o.restaurantId
      : typeof o.restaurant_id === "number" && Number.isFinite(o.restaurant_id)
        ? o.restaurant_id
        : null;
  const websiteUrl =
    typeof o.websiteUrl === "string"
      ? o.websiteUrl
      : typeof o.website_url === "string"
        ? o.website_url
        : null;

  if (id == null || !campaignName?.trim() || restaurantId == null || !websiteUrl) {
    return null;
  }

  const imageUrl =
    typeof o.imageUrl === "string"
      ? o.imageUrl
      : typeof o.image_url === "string"
        ? o.image_url
        : undefined;
  const offer =
    typeof o.offer === "string"
      ? o.offer
      : o.offer === null
        ? undefined
        : undefined;
  const price = o.price ?? undefined;
  const status =
    typeof o.status === "string"
      ? o.status
      : typeof o.status === "number"
        ? String(o.status)
        : "unpublished";
  const createdAt =
    typeof o.createdAt === "string"
      ? o.createdAt
      : typeof o.created_at === "string"
        ? o.created_at
        : new Date().toISOString();
  const updatedAt =
    typeof o.updatedAt === "string"
      ? o.updatedAt
      : typeof o.updated_at === "string"
        ? o.updated_at
        : createdAt;

  return {
    id,
    restaurantId,
    campaignName: campaignName.trim(),
    websiteUrl,
    imageUrl,
    offer,
    price: typeof price === "number" || typeof price === "string" ? price : undefined,
    status,
    createdAt,
    updatedAt,
  };
}

function campaignsFromResponseBody(
  body: unknown,
  fallbackPage: number,
  fallbackLimit: number,
): PaginatedCampaignsResponse {
  if (body && typeof body === "object" && !Array.isArray(body)) {
    const record = body as Record<string, unknown>;
    const rawItems = Array.isArray(record.data) ? record.data : [];
    const rawMeta =
      record.meta && typeof record.meta === "object"
        ? (record.meta as Record<string, unknown>)
        : null;

    const data = rawItems
      .map((item) => coerceCampaign(item))
      .filter((item): item is Funnel => item != null);

    const page =
      typeof rawMeta?.page === "number" && Number.isFinite(rawMeta.page)
        ? rawMeta.page
        : fallbackPage;
    const limit =
      typeof rawMeta?.limit === "number" && Number.isFinite(rawMeta.limit)
        ? rawMeta.limit
        : fallbackLimit;
    const total =
      typeof rawMeta?.total === "number" && Number.isFinite(rawMeta.total)
        ? rawMeta.total
        : data.length;
    const totalPages =
      typeof rawMeta?.totalPages === "number" &&
      Number.isFinite(rawMeta.totalPages)
        ? rawMeta.totalPages
        : total === 0
          ? 0
          : Math.ceil(total / limit);

    return { data, meta: { page, limit, total, totalPages } };
  }

  if (Array.isArray(body)) {
    const data = body
      .map((item) => coerceCampaign(item))
      .filter((item): item is Funnel => item != null);
    return {
      data,
      meta: {
        page: 1,
        limit: data.length || fallbackLimit,
        total: data.length,
        totalPages: data.length === 0 ? 0 : 1,
      },
    };
  }

  const one = coerceCampaign(body);
  return {
    data: one ? [one] : [],
    meta: {
      page: 1,
      limit: fallbackLimit,
      total: one ? 1 : 0,
      totalPages: one ? 1 : 0,
    },
  };
}

export async function fetchCampaignsByRestaurant(
  restaurantId: number,
  options: { page?: number; limit?: number; search?: string } = {},
): Promise<PaginatedCampaignsResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }

  const page = options.page ?? 1;
  const limit = options.limit ?? CAMPAIGNS_PAGE_SIZE;
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const search = options.search?.trim();
  if (search) {
    params.set("search", search);
  }

  const response = await authAxios.get<unknown>(
    `/campaign/business/${restaurantId}?${params.toString()}`,
  );

  return campaignsFromResponseBody(response.data, page, limit);
}

export async function fetchCampaignById(campaignId: number): Promise<Funnel> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }

  const response = await authAxios.get<unknown>(`/campaign/${campaignId}`);
  const campaign = coerceCampaign(response.data);
  if (!campaign) {
    throw new Error("Invalid campaign data from server.");
  }
  return campaign;
}
