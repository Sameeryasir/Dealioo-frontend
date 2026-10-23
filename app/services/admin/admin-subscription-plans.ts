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

export type AdminSubscriptionPlanStripe = {
  monthlySynced: boolean;
  yearlySynced: boolean;
  billingReady: boolean;
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
  activeSubscriberCount: number;
  totalSubscriberCount: number;
  canDelete: boolean;
  stripe: AdminSubscriptionPlanStripe;
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
  const monthlyPrice =
    data?.monthlyPrice == null ? null : Number(data.monthlyPrice);
  const yearlyPrice =
    data?.yearlyPrice == null ? null : Number(data.yearlyPrice);
  const monthlySynced = Boolean(data?.stripe?.monthlySynced);
  const yearlySynced = Boolean(data?.stripe?.yearlySynced);

  return {
    id: String(data?.id ?? ""),
    slug: String(data?.slug ?? ""),
    name: String(data?.name ?? ""),
    monthlyPrice,
    yearlyPrice,
    currency: String(data?.currency ?? "USD"),
    isActive: Boolean(data?.isActive),
    sortOrder: Number(data?.sortOrder) || 0,
    description: data?.description ?? null,
    createdAt: String(data?.createdAt ?? ""),
    updatedAt: String(data?.updatedAt ?? ""),
    activeSubscriberCount: Number(data?.activeSubscriberCount) || 0,
    totalSubscriberCount: Number(data?.totalSubscriberCount) || 0,
    canDelete: Boolean(data?.canDelete),
    stripe: {
      monthlySynced,
      yearlySynced,
      billingReady:
        typeof data?.stripe?.billingReady === "boolean"
          ? data.stripe.billingReady
          : (monthlyPrice == null || monthlySynced) &&
            (yearlyPrice == null || yearlySynced),
    },
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

export async function deleteAdminSubscriptionPlan(
  planId: string,
): Promise<{ deleted: boolean; id: string }> {
  try {
    const { data } = await authAxios.delete<{ deleted: boolean; id: string }>(
      `/admin/subscription-plans/${planId}`,
    );
    return {
      deleted: Boolean(data?.deleted),
      id: String(data?.id ?? planId),
    };
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not delete subscription plan."),
    );
  }
}
