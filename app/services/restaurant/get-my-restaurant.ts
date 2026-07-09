import axios from "axios";
import { parseApiMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authAxios } from "@/app/lib/auth-axios";

export type AdminRestaurant = {
  id?: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  cuisineType?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  branchCount?: number | null;
  stripeAccountId?: string | null;
};

export type RestaurantOwner = {
  id?: number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  isActive?: boolean;
  twoFactorEnabled?: boolean;
  onboardingStep?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type RestaurantMenuItem = {
  id?: number;
  name: string;
  description?: string | null;
  menuType?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  isActive?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type RestaurantDetail = AdminRestaurant & {
  owner?: RestaurantOwner | null;
  menu?: RestaurantMenuItem[];
};

function pickString(
  o: Record<string, unknown>,
  camel: string,
  snake: string,
): string | null | undefined {
  const a = o[camel];
  const b = o[snake];
  if (typeof a === "string") return a;
  if (typeof b === "string") return b;
  if (a === null || b === null) return null;
  return undefined;
}

function pickNumber(
  o: Record<string, unknown>,
  camel: string,
  snake: string,
): number | null | undefined {
  const a = o[camel];
  const b = o[snake];
  if (typeof a === "number" && Number.isFinite(a)) return a;
  if (typeof b === "number" && Number.isFinite(b)) return b;
  if (a === null || b === null) return null;
  return undefined;
}

function pickBoolean(
  o: Record<string, unknown>,
  camel: string,
  snake: string,
): boolean | undefined {
  const a = o[camel];
  const b = o[snake];
  if (typeof a === "boolean") return a;
  if (typeof b === "boolean") return b;
  return undefined;
}

function parseId(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Number.parseInt(value.trim(), 10);
  }
  return undefined;
}

function coerceOwner(o: Record<string, unknown>): RestaurantOwner | null {
  const id = parseId(o.id);
  const name = pickString(o, "name", "name");
  if (id == null && (name == null || !String(name).trim())) {
    return null;
  }
  return {
    id,
    name: name?.trim() ?? null,
    email: pickString(o, "email", "email") ?? null,
    phone: pickString(o, "phone", "phone") ?? null,
    emailVerified: pickBoolean(o, "emailVerified", "email_verified"),
    phoneVerified: pickBoolean(o, "phoneVerified", "phone_verified"),
    isActive: pickBoolean(o, "isActive", "is_active"),
    twoFactorEnabled: pickBoolean(o, "twoFactorEnabled", "two_factor_enabled"),
    onboardingStep:
      pickNumber(o, "onboardingStep", "onboarding_step") ?? null,
    createdAt: pickString(o, "createdAt", "created_at") ?? null,
    updatedAt: pickString(o, "updatedAt", "updated_at") ?? null,
  };
}

function coerceMenuItem(value: unknown): RestaurantMenuItem | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const name = o.name;
  if (typeof name !== "string" || !name.trim()) return null;
  return {
    id: parseId(o.id),
    name: name.trim(),
    description: pickString(o, "description", "description") ?? null,
    menuType: pickString(o, "menuType", "menu_type") ?? null,
    fileUrl: pickString(o, "fileUrl", "file_url") ?? null,
    fileName: pickString(o, "fileName", "file_name") ?? null,
    fileSize: pickNumber(o, "fileSize", "file_size") ?? null,
    isActive: pickBoolean(o, "isActive", "is_active"),
    createdAt: pickString(o, "createdAt", "created_at") ?? null,
    updatedAt: pickString(o, "updatedAt", "updated_at") ?? null,
  };
}

function coerceRestaurantDetail(value: unknown): RestaurantDetail | null {
  const base = coerceRestaurant(value);
  if (!base) return null;
  if (typeof value !== "object" || value === null) return base;
  const o = value as Record<string, unknown>;

  let owner: RestaurantOwner | null | undefined;
  if (o.owner != null && typeof o.owner === "object") {
    owner = coerceOwner(o.owner as Record<string, unknown>);
  }

  let menu: RestaurantMenuItem[] | undefined;
  if (Array.isArray(o.menu)) {
    const items = o.menu
      .map((item) => coerceMenuItem(item))
      .filter((m): m is RestaurantMenuItem => m != null);
    menu = items;
  }

  return {
    ...base,
    ...(owner != null ? { owner } : {}),
    ...(menu != null ? { menu } : {}),
  };
}

function coerceRestaurant(value: unknown): AdminRestaurant | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const name = o.name;
  if (typeof name !== "string" || !name.trim()) return null;

  const parsedId = parseId(o.id);

  return {
    id: parsedId,
    name: name.trim(),
    slug: pickString(o, "slug", "slug") ?? null,
    description: pickString(o, "description", "description") ?? null,
    cuisineType: pickString(o, "cuisineType", "cuisine_type") ?? null,
    logoUrl: pickString(o, "logoUrl", "logo_url") ?? null,
    websiteUrl: pickString(o, "websiteUrl", "website_url") ?? null,
    email: pickString(o, "email", "email") ?? null,
    phoneNumber: pickString(o, "phoneNumber", "phone_number") ?? null,
    city: pickString(o, "city", "city") ?? null,
    state: pickString(o, "state", "state") ?? null,
    country: pickString(o, "country", "country") ?? null,
    postalCode: pickString(o, "postalCode", "postal_code") ?? null,
    branchCount: pickNumber(o, "branchCount", "branch_count") ?? null,
    stripeAccountId:
      pickString(o, "stripeAccountId", "stripe_account_id") ?? null,
  };
}

export const MY_RESTAURANTS_PAGE_SIZE = 6;

export type PaginatedMyRestaurantsResponse = {
  data: AdminRestaurant[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function fetchMyRestaurants(
  options: { page?: number; limit?: number; search?: string } = {},
): Promise<PaginatedMyRestaurantsResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }

  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? MY_RESTAURANTS_PAGE_SIZE),
  });
  const search = options.search?.trim();
  if (search) {
    params.set("search", search);
  }

  try {
    const response = await authAxios.get<unknown>(
      `/restaurant/all?${params.toString()}`,
    );
    const payload = response.data;

    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      const record = payload as Record<string, unknown>;
      const rawItems = Array.isArray(record.data) ? record.data : [];
      const rawMeta =
        record.meta && typeof record.meta === "object"
          ? (record.meta as Record<string, unknown>)
          : null;

      const data = rawItems
        .map((item) => coerceRestaurant(item))
        .filter((r): r is AdminRestaurant => r != null);

      const page =
        typeof rawMeta?.page === "number" && Number.isFinite(rawMeta.page)
          ? rawMeta.page
          : (options.page ?? 1);
      const limit =
        typeof rawMeta?.limit === "number" && Number.isFinite(rawMeta.limit)
          ? rawMeta.limit
          : (options.limit ?? MY_RESTAURANTS_PAGE_SIZE);
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

      return {
        data,
        meta: { page, limit, total, totalPages },
      };
    }

    if (Array.isArray(payload)) {
      const data = payload
        .map((item) => coerceRestaurant(item))
        .filter((r): r is AdminRestaurant => r != null);
      return {
        data,
        meta: {
          page: 1,
          limit: data.length || MY_RESTAURANTS_PAGE_SIZE,
          total: data.length,
          totalPages: data.length === 0 ? 0 : 1,
        },
      };
    }

    const one = coerceRestaurant(payload);
    return {
      data: one ? [one] : [],
      meta: {
        page: 1,
        limit: MY_RESTAURANTS_PAGE_SIZE,
        total: one ? 1 : 0,
        totalPages: one ? 1 : 0,
      },
    };
  } catch (error) {
    console.error("Fetch my restaurant error:", error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return {
          data: [],
          meta: {
            page: options.page ?? 1,
            limit: options.limit ?? MY_RESTAURANTS_PAGE_SIZE,
            total: 0,
            totalPages: 0,
          },
        };
      }
      if (error.response?.data?.message != null) {
        throw new Error(
          parseApiMessage(
            error.response.data.message,
            "Could not load restaurants.",
          ),
        );
      }
    }
    throw error;
  }
}

export async function fetchRestaurantById(
  accessToken: string,
  restaurantId: number,
): Promise<RestaurantDetail> {
  if (!accessToken.trim()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Invalid restaurant.");
  }

  try {
    const response = await authAxios.get<unknown>(
      `/restaurant/${restaurantId}`,
    );
    const one = coerceRestaurantDetail(response.data);
    if (!one) {
      throw new Error("Invalid restaurant data from server.");
    }
    return { ...one, id: one.id ?? restaurantId };
  } catch (error) {
    console.error("Fetch restaurant by id error:", error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error("Restaurant not found.");
      }
      if (error.response?.data?.message != null) {
        throw new Error(
          parseApiMessage(
            error.response.data.message,
            "Could not load restaurants.",
          ),
        );
      }
    }
    throw error instanceof Error ? error : new Error("Request failed");
  }
}
