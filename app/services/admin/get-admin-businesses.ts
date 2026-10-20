import { parseApiMessage } from "@/app/lib/api";
import { authAxios } from "@/app/lib/auth-axios";
import type { PlatformAdminBusiness } from "@/app/services/admin/get-platform-overview";

export type AdminBusinessesPage = {
  items: PlatformAdminBusiness[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  counts: {
    all: number;
    onboarded: number;
    notOnboarded: number;
  };
};

function normalizeBusiness(
  raw: Partial<PlatformAdminBusiness> | null | undefined,
): PlatformAdminBusiness | null {
  if (!raw || typeof raw !== "object") return null;
  const id = Number(raw.id);
  if (!Number.isFinite(id) || id < 1) return null;

  const setupProgressPercent = Math.max(
    0,
    Math.min(100, Number(raw.setupProgressPercent) || 0),
  );
  const setupComplete =
    typeof raw.setupComplete === "boolean"
      ? raw.setupComplete
      : setupProgressPercent === 100;

  return {
    id,
    name: String(raw.name ?? ""),
    slug: String(raw.slug ?? ""),
    logoUrl: raw.logoUrl ?? null,
    city: raw.city ?? null,
    state: raw.state ?? null,
    country: raw.country ?? null,
    postalCode: raw.postalCode ?? null,
    email: raw.email ?? null,
    phoneNumber: raw.phoneNumber ?? null,
    onboardingCompleted: Boolean(raw.onboardingCompleted),
    stripeConnected: Boolean(raw.stripeConnected),
    metaConnected: Boolean(raw.metaConnected),
    googleAdsConnected: Boolean(raw.googleAdsConnected),
    twilioConnected: Boolean(raw.twilioConnected),
    setupProgressPercent,
    setupComplete,
    createdAt: String(raw.createdAt ?? ""),
    ownerName: raw.ownerName ?? null,
    ownerEmail: raw.ownerEmail ?? null,
    ownerAvatar: raw.ownerAvatar ?? null,
    planName: raw.planName ?? null,
    planSlug: raw.planSlug ?? null,
  };
}

export async function getAdminBusinesses(input: {
  page: number;
  limit: number;
  search?: string;
  onboarding?: "all" | "onboarded" | "not_onboarded";
}): Promise<AdminBusinessesPage> {
  try {
    const params = new URLSearchParams({
      page: String(input.page),
      limit: String(input.limit),
    });
    if (input.search?.trim()) params.set("search", input.search.trim());
    if (input.onboarding && input.onboarding !== "all") {
      params.set("onboarding", input.onboarding);
    }

    const { data } = await authAxios.get<AdminBusinessesPage>(
      `/admin/businesses?${params.toString()}`,
    );

    return {
      items: Array.isArray(data?.items)
        ? data.items
            .map((item) => normalizeBusiness(item))
            .filter((item): item is PlatformAdminBusiness => item != null)
        : [],
      meta: {
        page: Number(data?.meta?.page) || input.page,
        limit: Number(data?.meta?.limit) || input.limit,
        total: Number(data?.meta?.total) || 0,
        totalPages: Number(data?.meta?.totalPages) || 0,
      },
      counts: {
        all: Number(data?.counts?.all) || 0,
        onboarded: Number(data?.counts?.onboarded) || 0,
        notOnboarded: Number(data?.counts?.notOnboarded) || 0,
      },
    };
  } catch (error) {
    throw new Error(parseApiMessage(error, "Could not load businesses."));
  }
}
