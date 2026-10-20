import type { PlatformDashboardPeriod } from "@/app/services/admin/get-platform-dashboard";

export const adminQueryKeys = {
  all: ["admin"] as const,
  dashboard: (period: PlatformDashboardPeriod, month: string, timezone: string) =>
    [...adminQueryKeys.all, "dashboard", period, month, timezone] as const,
  users: (
    page: number,
    search: string,
    limit: number,
    tab: string,
    sort: string,
  ) => [...adminQueryKeys.all, "users", page, search, limit, tab, sort] as const,
  usersRoot: () => [...adminQueryKeys.all, "users"] as const,
  roles: () => [...adminQueryKeys.all, "roles"] as const,
  businessesRoot: () => [...adminQueryKeys.all, "businesses"] as const,
  businesses: (
    page: number,
    search: string,
    limit: number,
    onboarding: string,
  ) =>
    [
      ...adminQueryKeys.businessesRoot(),
      page,
      search,
      limit,
      onboarding,
    ] as const,
  meetings: () => [...adminQueryKeys.all, "meetings"] as const,
};
