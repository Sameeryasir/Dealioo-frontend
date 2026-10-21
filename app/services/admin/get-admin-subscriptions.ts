import { parseApiMessage } from "@/app/lib/api";
import { authAxios } from "@/app/lib/auth-axios";

export type AdminSubscriptionStatus =
  | "active"
  | "cancelled"
  | "past_due"
  | "trialing"
  | string;

export type AdminSubscription = {
  id: string;
  status: AdminSubscriptionStatus;
  billingCycle: "monthly" | "annual" | string;
  cancelAtPeriodEnd: boolean;
  startedAt: string | null;
  cancelledAt: string | null;
  cancelsAt: string | null;
  createdAt: string;
  updatedAt: string;
  amount: number | null;
  currency: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  plan: {
    id: string;
    name: string;
    slug: string;
  };
};

export type AdminSubscriptionsPage = {
  items: AdminSubscription[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  counts: {
    all: number;
    active: number;
    trialing: number;
    pastDue: number;
    cancelled: number;
  };
};

function normalizeSubscription(
  raw: Partial<AdminSubscription> | null | undefined,
): AdminSubscription | null {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id ?? "").trim();
  if (!id) return null;

  const user = (raw.user ?? {}) as Partial<AdminSubscription["user"]>;
  const plan = (raw.plan ?? {}) as Partial<AdminSubscription["plan"]>;
  const userId = Number(user.id);
  const amountRaw = raw.amount;
  const amount =
    amountRaw == null
      ? null
      : Number.isFinite(Number(amountRaw))
        ? Number(amountRaw)
        : null;

  return {
    id,
    status: String(raw.status ?? "active"),
    billingCycle: String(raw.billingCycle ?? "monthly"),
    cancelAtPeriodEnd: Boolean(raw.cancelAtPeriodEnd),
    startedAt: raw.startedAt ? String(raw.startedAt) : null,
    cancelledAt: raw.cancelledAt ? String(raw.cancelledAt) : null,
    cancelsAt: raw.cancelsAt ? String(raw.cancelsAt) : null,
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
    amount,
    currency: String(raw.currency ?? "USD").toUpperCase(),
    user: {
      id: Number.isFinite(userId) ? userId : 0,
      name: String(user.name ?? "—").trim() || "—",
      email: String(user.email ?? "—").trim() || "—",
    },
    plan: {
      id: String(plan.id ?? "").trim(),
      name: String(plan.name ?? "—").trim() || "—",
      slug: String(plan.slug ?? "unknown").trim() || "unknown",
    },
  };
}

export async function getAdminSubscriptions(input: {
  page: number;
  limit: number;
  search?: string;
}): Promise<AdminSubscriptionsPage> {
  try {
    const params = new URLSearchParams({
      page: String(input.page),
      limit: String(input.limit),
    });
    if (input.search?.trim()) params.set("search", input.search.trim());

    const { data } = await authAxios.get<AdminSubscriptionsPage>(
      `/admin/subscriptions?${params.toString()}`,
    );

    return {
      items: Array.isArray(data?.items)
        ? data.items
            .map((item) => normalizeSubscription(item))
            .filter((item): item is AdminSubscription => item != null)
        : [],
      meta: {
        page: Number(data?.meta?.page) || input.page,
        limit: Number(data?.meta?.limit) || input.limit,
        total: Number(data?.meta?.total) || 0,
        totalPages: Number(data?.meta?.totalPages) || 0,
      },
      counts: {
        all: Number(data?.counts?.all) || 0,
        active: Number(data?.counts?.active) || 0,
        trialing: Number(data?.counts?.trialing) || 0,
        pastDue: Number(data?.counts?.pastDue) || 0,
        cancelled: Number(data?.counts?.cancelled) || 0,
      },
    };
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not load subscriptions."),
    );
  }
}
