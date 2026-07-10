import axios from "axios";
import { parseApiMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authAxios } from "@/app/lib/auth-axios";

export type AdminBusiness = {
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

/** @deprecated Use AdminBusiness */
export type AdminRestaurant = AdminBusiness;

export type BusinessOwner = {
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

/** @deprecated Use BusinessOwner */
export type RestaurantOwner = BusinessOwner;

export type BusinessMenuSummary = {
  id?: number;
};

export type BusinessDetail = AdminBusiness & {
  owner?: BusinessOwner | null;
  menu?: BusinessMenuSummary[];
};

/** @deprecated Use BusinessDetail */
export type RestaurantDetail = BusinessDetail;

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

function coerceOwner(o: Record<string, unknown>): BusinessOwner | null {
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

function coerceMenuSummaries(value: unknown): BusinessMenuSummary[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const menu = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const id = parseId((entry as Record<string, unknown>).id);
      return id != null ? { id } : { id: undefined };
    })
    .filter((entry): entry is BusinessMenuSummary => entry != null);

  return menu.length > 0 ? menu : [];
}

function coerceBusinessDetail(value: unknown): BusinessDetail | null {
  const base = coerceBusiness(value);
  if (!base) return null;
  if (typeof value !== "object" || value === null) return base;
  const o = value as Record<string, unknown>;

  let owner: BusinessOwner | null | undefined;
  if (o.owner != null && typeof o.owner === "object") {
    owner = coerceOwner(o.owner as Record<string, unknown>);
  }

  const menu = coerceMenuSummaries(o.menu);

  return {
    ...base,
    ...(owner != null ? { owner } : {}),
    ...(menu !== undefined ? { menu } : {}),
  };
}

/** @deprecated Use coerceBusinessDetail */
function coerceRestaurantDetail(value: unknown): BusinessDetail | null {
  return coerceBusinessDetail(value);
}

export function parseBusinessFromApi(value: unknown): AdminBusiness | null {
  return coerceBusiness(value);
}

function coerceBusiness(value: unknown): AdminBusiness | null {
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

/** @deprecated Use coerceBusiness */
function coerceRestaurant(value: unknown): AdminBusiness | null {
  return coerceBusiness(value);
}

export const MY_BUSINESSES_PAGE_SIZE = 8;
/** @deprecated Use MY_BUSINESSES_PAGE_SIZE */
export const MY_RESTAURANTS_PAGE_SIZE = MY_BUSINESSES_PAGE_SIZE;

export type PaginatedMyBusinessesResponse = {
  data: AdminBusiness[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

/** @deprecated Use PaginatedMyBusinessesResponse */
export type PaginatedMyRestaurantsResponse = PaginatedMyBusinessesResponse;

export async function fetchMyBusinesses(
  options: { page?: number; limit?: number; search?: string } = {},
): Promise<PaginatedMyBusinessesResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }

  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? MY_BUSINESSES_PAGE_SIZE),
  });
  const search = options.search?.trim();
  if (search) {
    params.set("search", search);
  }

  try {
    const response = await authAxios.get<unknown>(
      `/business/all?${params.toString()}`,
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
        .filter((r): r is AdminBusiness => r != null);

      const page =
        typeof rawMeta?.page === "number" && Number.isFinite(rawMeta.page)
          ? rawMeta.page
          : (options.page ?? 1);
      const limit =
        typeof rawMeta?.limit === "number" && Number.isFinite(rawMeta.limit)
          ? rawMeta.limit
          : (options.limit ?? MY_BUSINESSES_PAGE_SIZE);
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
        .filter((r): r is AdminBusiness => r != null);
      return {
        data,
        meta: {
          page: 1,
          limit: data.length || MY_BUSINESSES_PAGE_SIZE,
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
        limit: MY_BUSINESSES_PAGE_SIZE,
        total: one ? 1 : 0,
        totalPages: one ? 1 : 0,
      },
    };
  } catch (error) {
    console.error("Fetch my businesses error:", error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return {
          data: [],
          meta: {
            page: options.page ?? 1,
            limit: options.limit ?? MY_BUSINESSES_PAGE_SIZE,
            total: 0,
            totalPages: 0,
          },
        };
      }
      if (error.response?.data?.message != null) {
        throw new Error(
          parseApiMessage(
            error.response.data.message,
            "Could not load businesses.",
          ),
        );
      }
    }
    throw error;
  }
}

export async function fetchBusinessById(
  accessToken: string,
  businessId: number,
): Promise<BusinessDetail> {
  if (!accessToken.trim()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!Number.isFinite(businessId) || businessId < 1) {
    throw new Error("Invalid business.");
  }

  try {
    const response = await authAxios.get<unknown>(
      `/business/${businessId}`,
    );
    const one = coerceBusinessDetail(response.data);
    if (!one) {
      throw new Error("Invalid business data from server.");
    }
    return { ...one, id: one.id ?? businessId };
  } catch (error) {
    console.error("Fetch business by id error:", error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error("Business not found.");
      }
      if (error.response?.data?.message != null) {
        throw new Error(
          parseApiMessage(
            error.response.data.message,
            "Could not load businesses.",
          ),
        );
      }
    }
    throw error instanceof Error ? error : new Error("Request failed");
  }
}
