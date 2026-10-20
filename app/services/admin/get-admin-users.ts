import { parseApiMessage } from "@/app/lib/api";
import { authAxios } from "@/app/lib/auth-axios";
import type { PlatformAdminUser } from "@/app/services/admin/get-platform-overview";

export type AdminUsersPage = {
  items: PlatformAdminUser[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function getAdminUsers(input: {
  page: number;
  limit: number;
  search?: string;
}): Promise<AdminUsersPage> {
  try {
    const params = new URLSearchParams({
      page: String(input.page),
      limit: String(input.limit),
    });
    if (input.search?.trim()) params.set("search", input.search.trim());

    const { data } = await authAxios.get<AdminUsersPage>(
      `/admin/users?${params.toString()}`,
    );

    return {
      items: Array.isArray(data?.items) ? data.items : [],
      meta: {
        page: Number(data?.meta?.page) || input.page,
        limit: Number(data?.meta?.limit) || input.limit,
        total: Number(data?.meta?.total) || 0,
        totalPages: Number(data?.meta?.totalPages) || 0,
      },
    };
  } catch (error) {
    throw new Error(parseApiMessage(error, "Could not load users."));
  }
}
