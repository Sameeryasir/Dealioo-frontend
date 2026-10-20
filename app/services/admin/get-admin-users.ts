import { parseApiMessage } from "@/app/lib/api";
import { authAxios } from "@/app/lib/auth-axios";
import type {
  PlatformAdminUser,
  PlatformAdminUserBusiness,
} from "@/app/services/admin/get-platform-overview";

export type AdminUsersTab =
  | "all"
  | "active"
  | "inactive"
  | "admins"
  | "managers"
  | "viewers";

export type AdminUsersSort = "newest" | "oldest" | "name_asc" | "name_desc";

export type AdminUsersSummary = {
  total: number;
  newUsers: number;
  active: number;
  inactive: number;
  totalChangePct: number;
  newUsersChangePct: number;
  activeSharePct: number;
  inactiveSharePct: number;
  tabs: {
    all: number;
    active: number;
    inactive: number;
    admins: number;
    managers: number;
    viewers: number;
  };
};

export type AdminUsersPage = {
  items: PlatformAdminUser[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: AdminUsersSummary;
};

const EMPTY_SUMMARY: AdminUsersSummary = {
  total: 0,
  newUsers: 0,
  active: 0,
  inactive: 0,
  totalChangePct: 0,
  newUsersChangePct: 0,
  activeSharePct: 0,
  inactiveSharePct: 0,
  tabs: {
    all: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    managers: 0,
    viewers: 0,
  },
};

function normalizeBusinesses(raw: unknown): PlatformAdminUserBusiness[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Partial<PlatformAdminUserBusiness>;
      const id = Number(row.id);
      const name = String(row.name ?? "").trim();
      const role = String(row.role ?? "").trim();
      const logoUrl =
        typeof row.logoUrl === "string" && row.logoUrl.trim()
          ? row.logoUrl.trim()
          : null;
      if (!Number.isFinite(id) || id <= 0 || !name) return null;
      return { id, name, role: role || "Member", logoUrl };
    })
    .filter((row): row is PlatformAdminUserBusiness => row != null);
}

function asSummary(raw: unknown): AdminUsersSummary {
  if (!raw || typeof raw !== "object") return EMPTY_SUMMARY;
  const data = raw as Partial<AdminUsersSummary>;
  const tabs = (data.tabs ?? {}) as Partial<AdminUsersSummary["tabs"]>;
  return {
    total: Number(data.total) || 0,
    newUsers: Number(data.newUsers) || 0,
    active: Number(data.active) || 0,
    inactive: Number(data.inactive) || 0,
    totalChangePct: Number(data.totalChangePct) || 0,
    newUsersChangePct: Number(data.newUsersChangePct) || 0,
    activeSharePct: Number(data.activeSharePct) || 0,
    inactiveSharePct: Number(data.inactiveSharePct) || 0,
    tabs: {
      all: Number(tabs.all) || 0,
      active: Number(tabs.active) || 0,
      inactive: Number(tabs.inactive) || 0,
      admins: Number(tabs.admins) || 0,
      managers: Number(tabs.managers) || 0,
      viewers: Number(tabs.viewers) || 0,
    },
  };
}

export async function getAdminUsers(input: {
  page: number;
  limit: number;
  search?: string;
  tab?: AdminUsersTab;
  sort?: AdminUsersSort;
}): Promise<AdminUsersPage> {
  try {
    const params = new URLSearchParams({
      page: String(input.page),
      limit: String(input.limit),
      tab: input.tab ?? "all",
      sort: input.sort ?? "newest",
    });
    if (input.search?.trim()) params.set("search", input.search.trim());

    const { data } = await authAxios.get<AdminUsersPage>(
      `/admin/users?${params.toString()}`,
    );

    const items: PlatformAdminUser[] = Array.isArray(data?.items)
      ? data.items.map((item) => ({
          ...item,
          businesses: normalizeBusinesses(item?.businesses),
        }))
      : [];

    return {
      items,
      meta: {
        page: Number(data?.meta?.page) || input.page,
        limit: Number(data?.meta?.limit) || input.limit,
        total: Number(data?.meta?.total) || 0,
        totalPages: Number(data?.meta?.totalPages) || 0,
      },
      summary: asSummary(data?.summary),
    };
  } catch (error) {
    throw new Error(parseApiMessage(error, "Could not load users."));
  }
}
