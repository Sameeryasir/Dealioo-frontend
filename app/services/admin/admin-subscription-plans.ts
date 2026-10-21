import { parseApiMessage } from "@/app/lib/api";
import { authAxios } from "@/app/lib/auth-axios";

export type AdminSubscriptionPlanDescription = {
  badge: string | null;
  tagline: string;
  summary: string;
  features?: string[];
  featureGroups?: Array<{ label: string; items: string[] }>;
  cta: string;
  highlighted: boolean;
  salesEmail?: string | null;
  color?: string;
  monthly: {
    price: string;
    period: string;
    originalPrice?: string | null;
    promo: string | null;
    subline: string | null;
  };
  annual: {
    price: string;
    period: string;
    originalPrice?: string | null;
    promo: string | null;
    subline: string | null;
  };
};

export type AdminSubscriptionPlan = {
  id: string;
  slug: string;
  name: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  currency: string;
  isActive: boolean;
  sortOrder: number;
  description: AdminSubscriptionPlanDescription | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminSubscriptionPlansResponse = {
  items: AdminSubscriptionPlan[];
  counts: {
    all: number;
    active: number;
    inactive: number;
  };
};

export type AdminSubscriptionPlanInput = {
  slug: string;
  name: string;
  monthlyPrice?: number | null;
  yearlyPrice?: number | null;
  monthlyOriginalPrice?: number | null;
  yearlyOriginalPrice?: number | null;
  promo?: string | null;
  currency?: string;
  isActive?: boolean;
  sortOrder?: number;
  badge?: string | null;
  tagline?: string;
  summary?: string;
  cta?: string;
  highlighted?: boolean;
  color?: string;
  features?: string[];
};

function normalizePlan(
  data: Partial<AdminSubscriptionPlan> | null | undefined,
): AdminSubscriptionPlan {
  return {
    id: String(data?.id ?? ""),
    slug: String(data?.slug ?? ""),
    name: String(data?.name ?? ""),
    monthlyPrice:
      data?.monthlyPrice == null ? null : Number(data.monthlyPrice),
    yearlyPrice: data?.yearlyPrice == null ? null : Number(data.yearlyPrice),
    currency: String(data?.currency ?? "USD"),
    isActive: Boolean(data?.isActive),
    sortOrder: Number(data?.sortOrder) || 0,
    description: data?.description ?? null,
    createdAt: String(data?.createdAt ?? ""),
    updatedAt: String(data?.updatedAt ?? ""),
  };
}

export async function getAdminSubscriptionPlans(): Promise<AdminSubscriptionPlansResponse> {
  try {
    const { data } = await authAxios.get<AdminSubscriptionPlansResponse>(
      "/admin/subscription-plans",
    );
    return {
      items: Array.isArray(data?.items)
        ? data.items.map((item) => normalizePlan(item))
        : [],
      counts: {
        all: Number(data?.counts?.all) || 0,
        active: Number(data?.counts?.active) || 0,
        inactive: Number(data?.counts?.inactive) || 0,
      },
    };
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not load subscription plans."),
    );
  }
}

export async function createAdminSubscriptionPlan(
  input: AdminSubscriptionPlanInput,
): Promise<AdminSubscriptionPlan> {
  try {
    const { data } = await authAxios.post<AdminSubscriptionPlan>(
      "/admin/subscription-plans",
      input,
    );
    return normalizePlan(data);
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not create subscription plan."),
    );
  }
}

export async function updateAdminSubscriptionPlan(
  planId: string,
  input: Partial<AdminSubscriptionPlanInput>,
): Promise<AdminSubscriptionPlan> {
  try {
    const { data } = await authAxios.patch<AdminSubscriptionPlan>(
      `/admin/subscription-plans/${planId}`,
      input,
    );
    return normalizePlan(data);
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not update subscription plan."),
    );
  }
}
