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
      items: Array.isArray(data?.items) ? data.items : [],
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
